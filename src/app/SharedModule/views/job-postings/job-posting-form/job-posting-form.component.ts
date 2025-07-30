import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// Angular Material
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

// Componentes internos
import { ToolbarComponent } from '../../../toolbar/toolbar.component';
import { LayoutComponent } from '../../../layout/layout.component';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { StudentSelectionDialogComponent, StudentSearchResult } from '../student-selection-dialog/student-selection-dialog.component';

// Servicios y tipos
import { SessionService, JobPostingService } from '../../../../services';
import { 
  JobPosting, 
  ClassType, 
  ClassModality, 
  FrequencyType, 
  StudentDetails 
} from '../../../../types/firestore.types';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-job-posting-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatChipsModule,
    MatAutocompleteModule,
    MatDialogModule,
    ToolbarComponent,
    LayoutComponent,
    TranslatePipe
  ],
  templateUrl: './job-posting-form.component.html',
  styleUrls: ['./job-posting-form.component.scss']
})
export class JobPostingFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private sessionService = inject(SessionService);
  private jobPostingService = inject(JobPostingService);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Estado del componente
  isLoading = false;
  isEditMode = false;
  jobPostingId: string | null = null;
  currentUser = this.sessionService.currentUser;

  // Formularios
  basicInfoForm!: FormGroup;
  classDetailsForm!: FormGroup;
  studentsForm!: FormGroup;
  reviewForm!: FormGroup;

  // Opciones para selects
  classTypes: ClassType[] = ['prueba', 'regular', 'recurrente', 'intensiva'];
  modalities: ClassModality[] = ['presencial', 'virtual', 'hibrida'];
  frequencies: FrequencyType[] = ['unica', 'semanal', 'diario', 'otro'];

  // Horas disponibles
  timeOptions: string[] = [];

  ngOnInit(): void {
    this.initializeTimeOptions();
    this.initializeForms();
    this.checkEditMode();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeTimeOptions(): void {
    // Generar opciones de hora de 8:00 a 22:00 cada 30 minutos
    for (let hour = 8; hour <= 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        this.timeOptions.push(timeString);
      }
    }
  }

  private initializeForms(): void {
    // Formulario de información básica
    this.basicInfoForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      program: ['', [Validators.required]],
      class_type: ['', [Validators.required]],
      modality: ['', [Validators.required]],
      additional_comment: ['']
    });

    // Formulario de detalles de clase
    this.classDetailsForm = this.fb.group({
      class_date: ['', [Validators.required]],
      start_time: ['', [Validators.required]],
      total_duration_minutes: [60, [Validators.required, Validators.min(30), Validators.max(480)]],
      frequency: ['unica', [Validators.required]],
      frequency_other: [''],
      is_divided_by_students: [false],
      location: [''],
      video_call_link: [''],
      hourly_rate: [null, [Validators.min(0)]],
      currency: ['USD']
    });

    // Formulario de estudiantes
    this.studentsForm = this.fb.group({
      students: this.fb.array([], [Validators.required, Validators.minLength(1)])
    });

    // Formulario de revisión
    this.reviewForm = this.fb.group({
      save_as_draft: [false]
    });

    // Watchers para validaciones dinámicas
    this.setupDynamicValidations();
  }

  private setupDynamicValidations(): void {
    // Validaciones según modalidad
    this.classDetailsForm.get('modality')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((modality: ClassModality) => {
      const locationControl = this.classDetailsForm.get('location');
      const platformControl = this.classDetailsForm.get('platform_link');

      if (modality === 'presencial' || modality === 'hibrida') {
        locationControl?.setValidators([Validators.required]);
      } else {
        locationControl?.clearValidators();
      }

      if (modality === 'virtual' || modality === 'hibrida') {
        platformControl?.setValidators([Validators.required]);
      } else {
        platformControl?.clearValidators();
      }

      locationControl?.updateValueAndValidity();
      platformControl?.updateValueAndValidity();
    });

    // Validaciones según frecuencia
    this.classDetailsForm.get('frequency')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((frequency: FrequencyType) => {
      const frequencyOtherControl = this.classDetailsForm.get('frequency_other');
      
      if (frequency === 'otro') {
        frequencyOtherControl?.setValidators([Validators.required]);
      } else {
        frequencyOtherControl?.clearValidators();
      }
      
      frequencyOtherControl?.updateValueAndValidity();
    });
  }

  private checkEditMode(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.jobPostingId = params['id'];
        this.loadJobPosting(params['id']);
      }
    });
  }

  private loadJobPosting(id: string): void {
    this.isLoading = true;
    
    this.jobPostingService.getJobPosting(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (jobPosting: JobPosting | undefined) => {
        if (jobPosting) {
          this.populateForms(jobPosting);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading job posting:', error);
        this.isLoading = false;
      }
    });
  }

  private populateForms(jobPosting: JobPosting): void {
    // Información básica
    this.basicInfoForm.patchValue({
      title: jobPosting.title,
      program: jobPosting.program,
      class_type: jobPosting.class_type,
      modality: jobPosting.modality,
      additional_comment: jobPosting.additional_comment || ''
    });

    // Convertir la fecha si es un Timestamp de Firestore
    let classDate: Date | null = null;
    if (jobPosting.class_date) {
      if (typeof (jobPosting.class_date as any).toDate === 'function') {
        // Es un Timestamp de Firestore
        classDate = (jobPosting.class_date as any).toDate();
      } else if (jobPosting.class_date instanceof Date) {
        // Ya es un Date
        classDate = jobPosting.class_date;
      } else if (typeof jobPosting.class_date === 'string') {
        // Es un string, convertir a Date
        classDate = new Date(jobPosting.class_date);
      }
    }

    // Detalles de clase
    this.classDetailsForm.patchValue({
      class_date: classDate,
      start_time: jobPosting.start_time,
      total_duration_minutes: jobPosting.total_duration_minutes,
      frequency: jobPosting.frequency,
      frequency_other: jobPosting.frequency_other || '',
      is_divided_by_students: jobPosting.is_divided_by_students,
      location: jobPosting.location || '',
      video_call_link: jobPosting.video_call_link || '',
      hourly_rate: jobPosting.hourly_rate || null,
      currency: jobPosting.currency || 'USD'
    });

    // Estudiantes
    this.setStudents(jobPosting.students);
  }

  // Gestión de estudiantes
  get studentsArray(): FormArray {
    return this.studentsForm.get('students') as FormArray;
  }

  addStudent(): void {
    const studentGroup = this.fb.group({
      name: ['', [Validators.required]],
      age: [null, [Validators.required, Validators.min(3), Validators.max(100)]],
      level_group: ['', [Validators.required]],
      individual_duration_minutes: [null, [Validators.min(15)]],
      allergies_conditions: [''],
      responsible_person: ['', [Validators.required]],
      contact_phone: ['', [Validators.required]],
      additional_notes: [''],
      // Campos para gestión de estudiantes registrados
      is_registered: [false],
      user_id: [''],
      created_during_job_posting: [false]
    });

    this.studentsArray.push(studentGroup);
  }

  addRegisteredStudent(): void {
    const dialogRef = this.dialog.open(StudentSelectionDialogComponent, {
      data: { institutionId: this.currentUser?.uid || '' },
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe((result: StudentSearchResult) => {
      if (result) {
        const studentGroup = this.fb.group({
          name: [result.studentDetails.name, [Validators.required]],
          age: [result.studentDetails.age, [Validators.required, Validators.min(3), Validators.max(100)]],
          level_group: [result.studentDetails.level_group, [Validators.required]],
          individual_duration_minutes: [result.studentDetails.individual_duration_minutes || null, [Validators.min(15)]],
          allergies_conditions: [result.studentDetails.allergies_conditions || ''],
          responsible_person: [result.studentDetails.responsible_person, [Validators.required]],
          contact_phone: [result.studentDetails.contact_phone, [Validators.required]],
          additional_notes: [result.studentDetails.additional_notes || ''],
          // Campos para gestión de estudiantes registrados
          is_registered: [result.studentDetails.is_registered || false],
          user_id: [result.studentDetails.user_id || ''],
          created_during_job_posting: [result.studentDetails.created_during_job_posting || false]
        });

        this.studentsArray.push(studentGroup);

        // Mostrar mensaje de resultado
        if (result.message) {
          console.log(result.message);
        }
      }
    });
  }

  removeStudent(index: number): void {
    this.studentsArray.removeAt(index);
  }

  private setStudents(students: StudentDetails[]): void {
    const studentGroups = students.map(student => 
      this.fb.group({
        name: [student.name, [Validators.required]],
        age: [student.age, [Validators.required, Validators.min(3), Validators.max(100)]],
        level_group: [student.level_group, [Validators.required]],
        individual_duration_minutes: [student.individual_duration_minutes || null, [Validators.min(15)]],
        allergies_conditions: [student.allergies_conditions || ''],
        responsible_person: [student.responsible_person, [Validators.required]],
        contact_phone: [student.contact_phone, [Validators.required]],
        additional_notes: [student.additional_notes || ''],
        // Campos para gestión de estudiantes registrados
        is_registered: [student.is_registered || false],
        user_id: [student.user_id || ''],
        created_during_job_posting: [student.created_during_job_posting || false]
      })
    );

    const studentsFormArray = this.fb.array(studentGroups);
    this.studentsForm.setControl('students', studentsFormArray);
  }

  // Validaciones de formularios
  isBasicInfoValid(): boolean {
    return this.basicInfoForm.valid;
  }

  isClassDetailsValid(): boolean {
    return this.classDetailsForm.valid;
  }

  isStudentsValid(): boolean {
    return this.studentsForm.valid && this.studentsArray.length > 0;
  }

  isFormValid(): boolean {
    return this.basicInfoForm.valid && 
           this.classDetailsForm.valid && 
           this.studentsForm.valid;
  }

  // Método principal de guardado
  async onSubmit(): Promise<void> {
    if (!this.isFormValid()) {
      console.error('Form is not valid');
      return;
    }

    this.isLoading = true;

    try {
      const jobPostingData = this.buildJobPostingData();
      
      if (this.isEditMode && this.jobPostingId) {
        await this.jobPostingService.updateJobPosting(this.jobPostingId, jobPostingData);
      } else {
        await this.jobPostingService.createJobPosting(jobPostingData);
      }

      // Navegar de vuelta a la lista
      this.router.navigate(['/job-postings']);
      
    } catch (error) {
      console.error('Error saving job posting:', error);
    } finally {
      this.isLoading = false;
    }
  }

  private buildJobPostingData(): Omit<JobPosting, 'id'> {
    const basicInfo = this.basicInfoForm.value;
    const classDetails = this.classDetailsForm.value;
    const students = this.studentsForm.value.students;
    const reviewData = this.reviewForm.value;

    // Obtener la zona horaria del usuario
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      ...basicInfo,
      ...classDetails,
      students,
      institution_id: this.currentUser?.uid || '',
      timezone: userTimezone, // Agregar zona horaria
      status: reviewData.save_as_draft ? 'draft' : 'published',
      created_by: this.currentUser?.uid || '',
      created_at: new Date() as any,
      updated_at: new Date() as any
    };
  }

  // Métodos de navegación
  onCancel(): void {
    this.router.navigate(['/job-postings']);
  }

  // Métodos de utilidad
  getFormControlError(form: FormGroup, controlName: string): string {
    const control = form.get(controlName);
    if (control?.hasError('required')) {
      return 'Este campo es obligatorio';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `Valor mínimo: ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `Valor máximo: ${control.errors?.['max'].max}`;
    }
    return '';
  }

  formatDate(value: any): string {
    if (!value) return '';
    
    // Si es un Timestamp de Firestore
    if (value && typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString();
    }
    
    // Si ya es un Date
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Si es un string, intentar convertir
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    return value.toString();
  }

  logout(): void {
    this.sessionService.logout();
  }
}
