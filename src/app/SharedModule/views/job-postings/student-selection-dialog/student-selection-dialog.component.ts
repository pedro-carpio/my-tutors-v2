import { Component, inject, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

import { StudentService, UserService, GoalService } from '../../../../services';
import { EmailService, StudentWelcomeEmailData } from '../../../../services/email.service';
import { PasswordGeneratorService } from '../../../../services/password-generator.service';
import { I18nService, Language } from '../../../../services/i18n.service';
import { Student, Goal, UserRole, LevelCEFR, StudentDetails, User } from '../../../../types/firestore.types';
import { debounceTime, distinctUntilChanged, switchMap, map, startWith, takeUntil, take } from 'rxjs/operators';
import { of, Observable, combineLatest, Subject } from 'rxjs';

export interface StudentSearchResult {
  studentDetails: StudentDetails;
  wasCreated: boolean;
  message?: string;
}

@Component({
  selector: 'app-student-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDividerModule
  ],
  templateUrl: './student-selection-dialog.component.html',
  styleUrls: ['./student-selection-dialog.component.scss']
})
export class StudentSelectionDialogComponent implements OnInit, OnDestroy {
  private dialogRef = inject(MatDialogRef<StudentSelectionDialogComponent>);
  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private userService = inject(UserService);
  private goalService = inject(GoalService);
  private emailService = inject(EmailService);
  private passwordGenerator = inject(PasswordGeneratorService);
  public i18nService = inject(I18nService);
  private snackBar = inject(MatSnackBar);

  // Estado del componente
  isLoading = false;
  isSearching = false;
  foundStudent: Student | null = null;
  showCreateForm = false;
  searchAttempted = false;
  suggestedStudents: Student[] = [];
  showSuggestions = false;
  noResultsFound = false;
  private destroy$ = new Subject<void>();

  availableGoals$: Observable<Goal[]>;

  constructor(@Inject(MAT_DIALOG_DATA) public data: { institutionId: string }) {
    // Inicializar el observable de objetivos filtrados por idioma actual
    this.availableGoals$ = this.i18nService.language$.pipe(
      startWith(this.i18nService.getCurrentLanguage()),
      switchMap((currentLanguage: Language) => 
        this.goalService.getAllGoals().pipe(
          map((goals: Goal[]) => goals.filter(goal => goal.lang === currentLanguage))
        )
      )
    );

    // Configurar validación de email en tiempo real
    this.setupEmailValidation();
  }

  ngOnInit(): void {
    // Inicializar el campo institution_id después de que data esté disponible
    this.studentForm.patchValue({
      institution_id: this.data.institutionId
    });

    // Configurar búsqueda en tiempo real
    this.setupRealTimeSearch();
  }

  // Formulario de búsqueda
  searchForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // Formulario de creación de estudiante
  studentForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    institution_id: ['', Validators.required],
    level_cefr: ['A1'],
    target_language: [''],
    country: [''],
    birth_date: [''],
    enrollment_date: [new Date()],
    goals: [[]],
    // Campos adicionales para job posting
    age: [null, [Validators.required, Validators.min(3), Validators.max(100)]],
    level_group: ['', [Validators.required]],
    individual_duration_minutes: [null, [Validators.min(15)]],
    allergies_conditions: [''],
    responsible_person: ['', [Validators.required]],
    contact_phone: ['', [Validators.required]],
    additional_notes: ['']
  });

  private setupEmailValidation(): void {
    const emailControl = this.studentForm.get('email');
    if (emailControl) {
      emailControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(email => {
          if (email && this.isValidEmail(email) && this.showCreateForm) {
            return this.userService.getUserByEmail(email);
          }
          return of([]);
        })
      ).subscribe(users => {
        if (users.length > 0 && this.showCreateForm) {
          emailControl.setErrors({ emailExists: true });
        }
      });
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupRealTimeSearch(): void {
    const searchEmailControl = this.searchForm.get('email');
    if (searchEmailControl) {
      searchEmailControl.valueChanges.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap(email => {
          if (email && email.length >= 3) {
            this.isSearching = true;
            this.showSuggestions = false;
            this.noResultsFound = false;
            
            // Buscar estudiantes que contengan el email parcial
            return this.searchStudentsByPartialEmail(email);
          } else {
            this.suggestedStudents = [];
            this.showSuggestions = false;
            this.noResultsFound = false;
            this.searchAttempted = false;
            return of([]);
          }
        }),
        takeUntil(this.destroy$)
      ).subscribe((students: Student[]) => {
        this.isSearching = false;
        this.suggestedStudents = students;
        this.showSuggestions = students.length > 0;
        this.noResultsFound = students.length === 0 && searchEmailControl?.value?.length >= 3;
        this.searchAttempted = true;
      });
    }
  }

  private async searchStudentsByPartialEmail(partialEmail: string): Promise<Student[]> {
    try {
      // Buscar usuarios que contengan el email parcial
      const users = await this.userService.searchUsersByPartialEmail(partialEmail);
      const studentPromises = users
        .filter((user: User) => user.roles.includes('student'))
        .map((user: User) => this.studentService.getStudent(user.id).pipe(take(1)).toPromise());
      
      const students = await Promise.all(studentPromises);
      return students.filter((student: any) => student !== undefined) as Student[];
    } catch (error) {
      console.error('Error searching students:', error);
      return [];
    }
  }

  async searchStudent(): Promise<void> {
    const email = this.searchForm.get('email')?.value;
    if (!email || !this.isValidEmail(email)) {
      return;
    }

    this.isSearching = true;
    this.searchAttempted = true;

    try {
      const users = await this.userService.getUserByEmail(email).toPromise();
      if (users && users.length > 0) {
        const user = users[0];
        // Verificar si tiene rol de estudiante
        if (user.roles.includes('student')) {
          const student = await this.studentService.getStudent(user.id).toPromise();
          if (student) {
            this.foundStudent = student;
            this.showCreateForm = false;
          } else {
            this.foundStudent = null;
            this.showCreateForm = true;
            this.populateFormFromEmail(email);
          }
        } else {
          this.foundStudent = null;
          this.showCreateForm = true;
          this.populateFormFromEmail(email);
        }
      } else {
        this.foundStudent = null;
        this.showCreateForm = true;
        this.populateFormFromEmail(email);
      }
    } catch (error) {
      console.error('Error searching student:', error);
      this.foundStudent = null;
      this.showCreateForm = true;
      this.populateFormFromEmail(email);
    } finally {
      this.isSearching = false;
    }
  }

  private populateFormFromEmail(email: string): void {
    this.studentForm.patchValue({
      email: email,
      institution_id: this.data.institutionId
    });
  }

  async useExistingStudent(): Promise<void> {
    if (!this.foundStudent) return;

    const studentDetails: StudentDetails = {
      name: this.foundStudent.full_name,
      age: this.foundStudent.age,
      email: this.foundStudent.user_id, // Usamos el user_id como referencia
      level_group: this.foundStudent.level_group,
      individual_duration_minutes: this.foundStudent.individual_duration_minutes,
      allergies_conditions: this.foundStudent.allergies_conditions,
      responsible_person: this.foundStudent.responsible_person,
      contact_phone: this.foundStudent.contact_phone,
      additional_notes: this.foundStudent.additional_notes,
      is_registered: true,
      user_id: this.foundStudent.user_id,
      created_during_job_posting: false
    };

    const result: StudentSearchResult = {
      studentDetails,
      wasCreated: false,
      message: `Estudiante existente: ${this.foundStudent.full_name}`
    };

    this.dialogRef.close(result);
  }

  async selectSuggestedStudent(student: Student): Promise<void> {
    this.foundStudent = student;
    this.suggestedStudents = [];
    this.showSuggestions = false;
    this.searchAttempted = true;
    
    // Obtener el email del usuario para mostrar en el campo de búsqueda
    try {
      const user = await this.userService.getUser(student.user_id).pipe(take(1)).toPromise();
      if (user) {
        this.searchForm.patchValue({
          email: user.email
        });
      }
    } catch (error) {
      console.error('Error getting user email:', error);
      // Mantener el valor actual del campo de búsqueda
    }
  }

  showCreateStudentForm(): void {
    this.showCreateForm = true;
    this.showSuggestions = false;
    
    // Pre-llenar el email del formulario con el valor de búsqueda
    const searchEmail = this.searchForm.get('email')?.value;
    if (searchEmail) {
      this.studentForm.patchValue({
        email: searchEmail
      });
    }
  }

  async createNewStudent(): Promise<void> {
    if (!this.studentForm.valid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;

    try {
      const formValue = this.studentForm.value;
      
      // Generar contraseña temporal
      const temporaryPassword = this.passwordGenerator.generateTemporaryPassword();
      
      // Crear usuario con contraseña temporal
      const userId = await this.userService.createEmptyUser(
        formValue.email, 
        ['student' as UserRole], 
        temporaryPassword
      );
      
      const studentData: Student = {
        user_id: userId,
        full_name: formValue.full_name,
        institution_id: formValue.institution_id,
        goals: formValue.goals || [],
        level_cefr: formValue.level_cefr || 'A1',
        target_language: formValue.target_language || '',
        country: formValue.country || '',
        birth_date: formValue.birth_date ? new Date(formValue.birth_date) : new Date(),
        enrollment_date: formValue.enrollment_date ? new Date(formValue.enrollment_date) : new Date(),
        // Campos adicionales para job posting
        age: formValue.age,
        level_group: formValue.level_group,
        individual_duration_minutes: formValue.individual_duration_minutes,
        allergies_conditions: formValue.allergies_conditions,
        responsible_person: formValue.responsible_person,
        contact_phone: formValue.contact_phone,
        additional_notes: formValue.additional_notes
      };
      
      await this.studentService.createStudent(studentData);
      
      // Enviar email de bienvenida con credenciales
      try {
        const emailData: StudentWelcomeEmailData = {
          studentName: formValue.full_name,
          email: formValue.email,
          temporaryPassword: temporaryPassword,
          institutionName: 'My Tutors',
          loginUrl: `${window.location.origin}/login`
        };
        
        await this.emailService.sendStudentWelcomeEmail(emailData);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
      }

      const studentDetails: StudentDetails = {
        name: formValue.full_name,
        age: formValue.age,
        email: formValue.email,
        level_group: formValue.level_group,
        individual_duration_minutes: formValue.individual_duration_minutes,
        allergies_conditions: formValue.allergies_conditions,
        responsible_person: formValue.responsible_person,
        contact_phone: formValue.contact_phone,
        additional_notes: formValue.additional_notes,
        is_registered: true,
        user_id: userId,
        created_during_job_posting: true
      };

      const result: StudentSearchResult = {
        studentDetails,
        wasCreated: true,
        message: `Nuevo estudiante creado: ${formValue.full_name}. Se ha enviado un email con las credenciales.`
      };

      this.dialogRef.close(result);
      
    } catch (error) {
      console.error('Error creating student:', error);
      this.snackBar.open('Error al crear el estudiante. Intenta de nuevo.', 'Cerrar', {
        duration: 3000
      });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.studentForm.controls).forEach(key => {
      const control = this.studentForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.studentForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('email')) {
      return 'El email no tiene un formato válido';
    }
    if (control?.hasError('emailExists')) {
      return 'Este email ya está registrado. El estudiante ya existe.';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.getError('minlength')?.requiredLength} caracteres`;
    }
    return '';
  }

  // Datos para los select
  languages = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'Inglés' },
    { code: 'fr', name: 'Francés' },
    { code: 'de', name: 'Alemán' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Portugués' },
    { code: 'zh', name: 'Chino' },
    { code: 'ja', name: 'Japonés' },
    { code: 'ar', name: 'Árabe' },
    { code: 'ru', name: 'Ruso' }
  ];

  cefrLevels = [
    'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
  ];

  countries = [
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica',
    'Cuba', 'Ecuador', 'El Salvador', 'España', 'Guatemala', 'Honduras',
    'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Puerto Rico',
    'República Dominicana', 'Uruguay', 'Venezuela'
  ];
}
