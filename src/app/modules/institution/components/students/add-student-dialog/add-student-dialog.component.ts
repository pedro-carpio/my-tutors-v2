import { Component, inject, Inject } from '@angular/core';
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
import { StudentService, UserService, InstitutionService, GoalService } from '../../../../../services';
import { I18nService, Language } from '../../../../../services/i18n.service';
import { Student, Goal, UserRole, LevelCEFR } from '../../../../../types/firestore.types';
import { debounceTime, distinctUntilChanged, switchMap, map, startWith } from 'rxjs/operators';
import { of, Observable, combineLatest } from 'rxjs';

@Component({
  selector: 'app-add-student-dialog',
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
    MatIconModule
  ],
  templateUrl: './add-student-dialog.component.html',
  styleUrls: ['./add-student-dialog.component.scss']
})
export class AddStudentDialogComponent {
  private dialogRef = inject(MatDialogRef<AddStudentDialogComponent>);
  private fb = inject(FormBuilder);
  private studentService = inject(StudentService);
  private userService = inject(UserService);
  private goalService = inject(GoalService);
  public i18nService = inject(I18nService);
  private snackBar = inject(MatSnackBar);

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
    
    // Establecer el institution_id automáticamente
    this.studentForm.patchValue({
      institution_id: this.data.institutionId
    });

    // Configurar validación de email en tiempo real
    this.setupEmailValidation();
  }

  studentForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email], [this.emailExistsValidator.bind(this)]],
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    institution_id: ['', Validators.required],
    level_cefr: ['A1'],
    target_language: [''],
    country: [''],
    birth_date: [''],
    enrollment_date: [new Date()],
    goals: [[]] // Array de IDs de objetivos seleccionados
  });

  private setupEmailValidation(): void {
    const emailControl = this.studentForm.get('email');
    if (emailControl) {
      emailControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(email => {
          if (email && this.isValidEmail(email)) {
            return this.userService.getUserByEmail(email);
          }
          return of([]);
        })
      ).subscribe(users => {
        if (users.length > 0) {
          emailControl.setErrors({ emailExists: true });
        }
      });
    }
  }

  private async emailExistsValidator(control: AbstractControl): Promise<{[key: string]: any} | null> {
    if (!control.value || !this.isValidEmail(control.value)) {
      return null;
    }

    try {
      const exists = await this.userService.emailExists(control.value);
      return exists ? { emailExists: true } : null;
    } catch (error) {
      return null;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

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

  // Función para comparar objetivos en el mat-select multiple
  compareGoals(goal1: Goal, goal2: Goal): boolean {
    return goal1 && goal2 ? goal1.name === goal2.name && goal1.lang === goal2.lang : goal1 === goal2;
  }

  // Función trackBy para optimizar el rendering de la lista
  trackByGoal(index: number, goal: Goal): string {
    return `${goal.name}-${goal.lang}`;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSubmit(): Promise<void> {
    if (this.studentForm.valid) {
      try {
        const formValue = this.studentForm.value;
        const userId = await this.userService.createEmptyUser(formValue.email, 'student' as UserRole);
        const studentData: Student = {
          user_id: userId,
          full_name: formValue.full_name,
          institution_id: formValue.institution_id,
          goals: formValue.goals || [], // Los objetivos ya vienen como array desde el selector múltiple
          level_cefr: formValue.level_cefr || 'A1',
          target_language: formValue.target_language || '',
          country: formValue.country || '',
          birth_date: formValue.birth_date ? new Date(formValue.birth_date) : undefined,
          enrollment_date: formValue.enrollment_date ? new Date(formValue.enrollment_date) : new Date()
        };
        console.log(studentData)
        
        await this.studentService.createStudent(studentData);
        
        this.snackBar.open(
          `Estudiante creado exitosamente. El usuario podrá iniciar sesión con su email y configurar su contraseña en el primer acceso.`, 
          'Cerrar', 
          { duration: 6000 }
        );
        
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error creating student:', error);
        this.snackBar.open('Error al crear el estudiante. Intenta de nuevo.', 'Cerrar', {
          duration: 3000
        });
      }
    } else {
      this.markFormGroupTouched();
    }
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
}
