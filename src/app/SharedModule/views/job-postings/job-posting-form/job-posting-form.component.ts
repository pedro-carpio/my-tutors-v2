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
import { SessionService, JobPostingService, LanguageService, InstitutionService } from '../../../../services';
import { LocationService } from '../../../../services/location.service';
import { TimezoneService, LocationTimezoneInfo } from '../../../../services/timezone.service';
import { 
  JobPosting, 
  ClassType, 
  ClassModality, 
  FrequencyType, 
  StudentDetails,
  Language,
  InstitutionCountry,
  InstitutionState,
  StudentLevelGroup
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
  private languageService = inject(LanguageService);
  private institutionService = inject(InstitutionService);
  private locationService = inject(LocationService);
  private timezoneService = inject(TimezoneService);
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
  tutorRequirementsForm!: FormGroup;
  studentsForm!: FormGroup;
  reviewForm!: FormGroup;

  // Opciones para selects
  classTypes: ClassType[] = ['prueba', 'regular', 'recurrente', 'intensiva'];
  modalities: ClassModality[] = ['presencial', 'virtual', 'hibrida'];
  frequencies: FrequencyType[] = ['unica', 'semanal', 'diario', 'otro'];
  
  // Opciones para requisitos del tutor
  experienceLevels: string[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  currencies: string[] = ['USD', 'EUR', 'BOB', 'MXN', 'COP', 'PEN'];
  
  // Idiomas disponibles (desde LanguageService)
  availableLanguages: Language[] = [];
  isLoadingLanguages = false;

  // Países y estados disponibles
  availableCountries: InstitutionCountry[] = [];
  availableStates: InstitutionState[] = [];

  // ✅ NUEVO: Propiedades para manejo de timezones en job postings
  showJobLocationTimezone = false;
  availableJobTimezones: {timezone: string; display_name: string; utc_offset: string; dst_aware: boolean}[] = [];
  jobLocationHasMultipleTimezones = false;
  institutionTimezoneInfo: LocationTimezoneInfo | null = null; // Información de timezone almacenada de la institución

  // Datos dinámicos desde la institución
  institutionPrograms: string[] = [];
  institutionClassTypes: ClassType[] = [];
  institutionCountries: InstitutionCountry[] = [];
  institutionLevelGroups: StudentLevelGroup[] = [];
  institutionOfferedLanguages: string[] = []; // Idiomas que ofrece la institución
  isLoadingInstitutionData = false;

  // Horas disponibles
  timeOptions: string[] = [];

  ngOnInit(): void {
    this.initializeTimeOptions();
    this.initializeForms();
    this.loadAvailableLanguages();
    this.loadAvailableCountries();
    this.loadInstitutionData();
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
      location_country: [''], // País donde se realizará la clase presencial/híbrida
      location_state: [''], // Estado donde se realizará la clase presencial/híbrida
      video_call_link: [''],
      hourly_rate: [null, [Validators.min(0)]],
      currency: ['USD'],
      // ✅ NUEVO: Campo de timezone específico para el job posting
      job_timezone: [''] // Timezone específico para esta clase/job
    });

    // Formulario de requisitos del tutor
    this.tutorRequirementsForm = this.fb.group({
      required_languages: [[], [Validators.required]],
      target_language: ['', [Validators.required]],
      required_experience_level: [''],
      max_hourly_rate: [null, [Validators.min(0)]]
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
      const locationCountryControl = this.classDetailsForm.get('location_country');
      const platformControl = this.classDetailsForm.get('platform_link');

      if (modality === 'presencial' || modality === 'hibrida') {
        locationControl?.setValidators([Validators.required]);
        locationCountryControl?.setValidators([Validators.required]);
      } else {
        locationControl?.clearValidators();
        locationCountryControl?.clearValidators();
        // Limpiar valores de ubicación para clases virtuales
        locationControl?.setValue('');
        locationCountryControl?.setValue('');
        this.classDetailsForm.get('location_state')?.setValue('');
      }

      if (modality === 'virtual' || modality === 'hibrida') {
        platformControl?.setValidators([Validators.required]);
      } else {
        platformControl?.clearValidators();
      }

      locationControl?.updateValueAndValidity();
      locationCountryControl?.updateValueAndValidity();
      platformControl?.updateValueAndValidity();
    });

    // Watcher para cambios en el país de ubicación
    this.classDetailsForm.get('location_country')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((countryCode: string) => {
      this.loadStatesForJobLocation(countryCode);
      
      // Limpiar el estado si el nuevo país no tiene estados
      if (!this.locationService.hasStates(countryCode)) {
        this.classDetailsForm.get('location_state')?.setValue('');
      }
      
      // ✅ NUEVO: Actualizar información de timezone cuando cambia el país de ubicación
      if (countryCode) {
        this.updateJobLocationTimezone(countryCode, undefined);
      } else {
        this.clearJobLocationTimezone();
      }
    });

    // ✅ NUEVO: Watcher para cambios en el estado de ubicación
    this.classDetailsForm.get('location_state')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((stateCode: string) => {
      const countryCode = this.classDetailsForm.get('location_country')?.value;
      if (countryCode && stateCode) {
        console.log('🗺️ JobPostingForm: Estado de ubicación cambiado:', stateCode);
        this.updateJobLocationTimezone(countryCode, stateCode);
      }
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

    // Validación cuando cambia el idioma objetivo
    this.tutorRequirementsForm.get('target_language')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((targetLanguage: string) => {
      this.updateRequiredLanguagesWithTarget(targetLanguage);
    });

    // Validación cuando cambian los idiomas requeridos
    this.tutorRequirementsForm.get('required_languages')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((requiredLanguages: string[]) => {
      this.ensureTargetLanguageInRequired(requiredLanguages);
    });
  }

  // Método para actualizar idiomas requeridos cuando cambia el idioma objetivo
  private updateRequiredLanguagesWithTarget(targetLanguage: string): void {
    if (!targetLanguage) return;

    const requiredLanguagesControl = this.tutorRequirementsForm.get('required_languages');
    const currentRequiredLanguages: string[] = requiredLanguagesControl?.value || [];

    // Verificar si el idioma objetivo ya está en los requeridos
    const targetLanguageInfo = this.getLanguageByCode(targetLanguage) || this.getLanguageByName(targetLanguage);
    
    if (targetLanguageInfo) {
      // Verificar si ya existe el idioma (por código o nombre)
      const alreadyExists = currentRequiredLanguages.some(reqLang => {
        const reqLangInfo = this.getLanguageByCode(reqLang) || this.getLanguageByName(reqLang);
        return reqLangInfo?.code === targetLanguageInfo.code;
      });

      if (!alreadyExists) {
        // Agregar el idioma objetivo a los idiomas requeridos
        const updatedRequiredLanguages = [...currentRequiredLanguages, targetLanguage];
        requiredLanguagesControl?.setValue(updatedRequiredLanguages);
        
        console.log('🎯 Target language automatically added to required languages:', {
          targetLanguage,
          updatedRequiredLanguages
        });
        
        // Limpiar duplicados después de agregar
        setTimeout(() => this.cleanRequiredLanguagesDuplicates(), 0);
      } else {
        console.log('ℹ️ Target language already exists in required languages:', {
          targetLanguage,
          currentRequiredLanguages
        });
      }
    }
  }

  // Método para asegurar que el idioma objetivo esté siempre en los requeridos
  private ensureTargetLanguageInRequired(requiredLanguages: string[]): void {
    const targetLanguageControl = this.tutorRequirementsForm.get('target_language');
    const targetLanguage = targetLanguageControl?.value;
    
    if (!targetLanguage || !requiredLanguages) return;

    const targetLanguageInfo = this.getLanguageByCode(targetLanguage) || this.getLanguageByName(targetLanguage);
    
    if (targetLanguageInfo) {
      // Verificar si el idioma objetivo está presente en los idiomas requeridos
      const targetExists = requiredLanguages.some(reqLang => {
        const reqLangInfo = this.getLanguageByCode(reqLang) || this.getLanguageByName(reqLang);
        return reqLangInfo?.code === targetLanguageInfo.code;
      });

      // Si no está presente, agregarlo silenciosamente
      if (!targetExists) {
        const updatedRequiredLanguages = [...requiredLanguages, targetLanguage];
        const requiredLanguagesControl = this.tutorRequirementsForm.get('required_languages');
        
        // Actualizar sin disparar el evento para evitar loop infinito
        requiredLanguagesControl?.setValue(updatedRequiredLanguages, { emitEvent: false });
        
        console.log('🔄 Target language re-added to required languages:', {
          targetLanguage,
          updatedRequiredLanguages
        });
      }
    }
  }

  // Método para limpiar duplicados en idiomas requeridos (basado en códigos ISO)
  cleanRequiredLanguagesDuplicates(): void {
    const requiredLanguagesControl = this.tutorRequirementsForm.get('required_languages');
    const currentRequiredLanguages: string[] = requiredLanguagesControl?.value || [];

    if (currentRequiredLanguages.length === 0) return;

    const uniqueLanguages: string[] = [];
    const seenCodes = new Set<string>();

    for (const langIdentifier of currentRequiredLanguages) {
      const langInfo = this.getLanguageByCode(langIdentifier) || this.getLanguageByName(langIdentifier);
      
      if (langInfo && !seenCodes.has(langInfo.code)) {
        seenCodes.add(langInfo.code);
        uniqueLanguages.push(langIdentifier);
      } else if (!langInfo && !uniqueLanguages.includes(langIdentifier)) {
        // Si no se encuentra en la base de datos, mantener como está (para compatibilidad)
        uniqueLanguages.push(langIdentifier);
      }
    }

    // Solo actualizar si hay cambios
    if (uniqueLanguages.length !== currentRequiredLanguages.length) {
      requiredLanguagesControl?.setValue(uniqueLanguages, { emitEvent: false });
      
      console.log('🧹 Cleaned duplicate languages from required languages:', {
        before: currentRequiredLanguages,
        after: uniqueLanguages,
        removedDuplicates: currentRequiredLanguages.length - uniqueLanguages.length
      });
    }
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

  // Método para cargar países disponibles
  private loadAvailableCountries(): void {
    this.locationService.getAvailableCountries().subscribe(countries => {
      this.availableCountries = countries;
    });
  }

  // Método para cargar estados según el país seleccionado para la ubicación del job
  private loadStatesForJobLocation(countryCode: string): void {
    this.locationService.getStatesByCountryCode(countryCode).subscribe(states => {
      this.availableStates = states;
    });
  }

  // Método para verificar si el país seleccionado tiene estados
  hasStatesForJob(): boolean {
    const selectedCountry = this.classDetailsForm.get('location_country')?.value;
    return selectedCountry ? this.locationService.hasStatesSync(selectedCountry) : false;
  }

  // ✅ NUEVO: Métodos para manejo de timezone en job postings

  /**
   * Actualiza la información de timezone basada en la ubicación del job posting
   */
  private updateJobLocationTimezone(countryCode: string, stateCode?: string): void {
    console.log(`🕐 JobPostingForm: Actualizando timezone para ubicación ${countryCode}${stateCode ? '/' + stateCode : ''}`);
    
    // Verificar si el TimezoneService soporta esta ubicación
    if (!this.timezoneService?.isCountrySupported?.(countryCode)) {
      console.warn(`🕐 País ${countryCode} no soportado para timezones en job postings`);
      this.clearJobLocationTimezone();
      return;
    }

    const timezonesInfo = this.timezoneService.getTimezonesForLocation(countryCode, stateCode);
    if (timezonesInfo) {
      this.jobLocationHasMultipleTimezones = timezonesInfo.multiple_timezones;
      this.availableJobTimezones = timezonesInfo.timezone_info;
      
      // Si hay múltiples timezones, mostrar selector manual
      if (timezonesInfo.multiple_timezones) {
        console.log(`🕐 ${countryCode}${stateCode ? '/' + stateCode : ''} tiene múltiples timezones para job posting`);
        this.showJobLocationTimezone = true;
        // No setear automáticamente el timezone, esperar selección manual
        if (!this.classDetailsForm.get('job_timezone')?.value) {
          this.classDetailsForm.get('job_timezone')?.setValue('');
        }
      } else {
        // Si hay solo una timezone, asignarla automáticamente
        this.showJobLocationTimezone = false;
        this.classDetailsForm.get('job_timezone')?.setValue(timezonesInfo.timezones[0]);
        console.log(`🕐 Timezone automática asignada para job posting: ${timezonesInfo.timezones[0]}`);
      }
    } else {
      this.clearJobLocationTimezone();
    }
  }

  /**
   * Limpia la información de timezone del job posting
   */
  private clearJobLocationTimezone(): void {
    this.showJobLocationTimezone = false;
    this.availableJobTimezones = [];
    this.jobLocationHasMultipleTimezones = false;
    this.classDetailsForm.get('job_timezone')?.setValue('');
  }

  /**
   * Verifica si se debe mostrar el selector de timezone para el job posting
   */
  shouldShowJobTimezoneSelector(): boolean {
    return this.showJobLocationTimezone && this.availableJobTimezones.length > 0;
  }

  /**
   * Obtiene las opciones de timezone disponibles para el job posting
   */
  getJobTimezoneOptions(): {timezone: string; display_name: string; utc_offset: string; dst_aware: boolean}[] {
    return this.availableJobTimezones;
  }

  /**
   * Maneja la selección manual de timezone para el job posting
   */
  onJobTimezoneChange(selectedTimezone: string): void {
    console.log(`🕐 Timezone seleccionado para job posting: ${selectedTimezone}`);
    this.classDetailsForm.get('job_timezone')?.setValue(selectedTimezone);
  }

  // Método para cargar idiomas disponibles desde el LanguageService
  private loadAvailableLanguages(): void {
    this.isLoadingLanguages = true;
    
    this.languageService.getAllLanguages().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (languages: Language[]) => {
        this.availableLanguages = languages.filter(lang => lang.is_active !== false);
        console.log('🌐 Available languages loaded:', this.availableLanguages.length);
        this.isLoadingLanguages = false;
      },
      error: (error) => {
        console.error('Error loading languages:', error);
        this.isLoadingLanguages = false;
      }
    });
  }

  // Método para cargar datos de configuración académica desde la institución
  private loadInstitutionData(): void {
    const userId = this.currentUser?.uid;
    if (!userId) {
      console.log('⚠️ No hay usuario autenticado, usando opciones por defecto');
      return;
    }

    this.isLoadingInstitutionData = true;
    console.log('🏢 Cargando datos de institución para formulario...');

    this.institutionService.getInstitution(userId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (institution) => {
        if (institution) {
          // Cargar programas educativos
          this.institutionPrograms = institution.educational_programs || [];
          
          // Cargar tipos de clase (combinar con opciones por defecto)
          this.institutionClassTypes = institution.class_types || [];
          if (this.institutionClassTypes.length > 0) {
            this.classTypes = this.institutionClassTypes;
          }
          
          // Cargar países de estudiantes
          this.institutionCountries = institution.student_countries || [];
          
          // Cargar grupos de estudiantes
          this.institutionLevelGroups = (institution.student_level_groups || [])
            .filter(group => group.is_active !== false);
          
          // Cargar idiomas que ofrece la institución para el campo "idioma objetivo"
          this.institutionOfferedLanguages = institution.languages_offered || [];

          console.log('✅ Datos de institución cargados:', {
            programs: this.institutionPrograms.length,
            classTypes: this.institutionClassTypes.length,
            countries: this.institutionCountries.length,
            levelGroups: this.institutionLevelGroups.length,
            offeredLanguages: this.institutionOfferedLanguages.length
          });
        } else {
          console.log('⚠️ No se encontraron datos de institución, usando opciones por defecto');
        }
        
        this.isLoadingInstitutionData = false;
      },
      error: (error) => {
        console.error('❌ Error cargando datos de institución:', error);
        this.isLoadingInstitutionData = false;
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
      location_country: jobPosting.location_country || '',
      location_state: jobPosting.location_state || '',
      video_call_link: jobPosting.video_call_link || '',
      hourly_rate: jobPosting.hourly_rate || null,
      currency: jobPosting.currency || 'USD'
    });

    // Cargar estados si hay un país seleccionado
    if (jobPosting.location_country) {
      this.loadStatesForJobLocation(jobPosting.location_country);
    }

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

  isTutorRequirementsValid(): boolean {
    return this.tutorRequirementsForm.valid;
  }

  isStudentsValid(): boolean {
    return this.studentsForm.valid && this.studentsArray.length > 0;
  }

  isFormValid(): boolean {
    return this.basicInfoForm.valid && 
           this.classDetailsForm.valid && 
           this.tutorRequirementsForm.valid &&
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
    const tutorRequirements = this.tutorRequirementsForm.value;
    const students = this.studentsForm.value.students;
    const reviewData = this.reviewForm.value;

    // Obtener la zona horaria del usuario
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      ...basicInfo,
      ...classDetails,
      ...tutorRequirements,
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

  // Métodos para trabajar con idiomas
  getLanguageName(language: Language): string {
    return this.languageService.getLocalizedLanguageName(language);
  }

  getLanguageByCode(code: string): Language | undefined {
    return this.availableLanguages.find(lang => lang.code === code);
  }

  getLanguageByName(name: string): Language | undefined {
    const normalizedName = name.toLowerCase();
    return this.availableLanguages.find(lang => 
      lang.name.toLowerCase() === normalizedName ||
      lang.name_es?.toLowerCase() === normalizedName ||
      lang.name_en?.toLowerCase() === normalizedName
    );
  }

  // Método para obtener idiomas objetivo disponibles (desde languages_offered de la institución)
  getAvailableTargetLanguages(): Language[] {
    if (this.institutionOfferedLanguages.length === 0) {
      // Si la institución no tiene idiomas configurados, usar todos los disponibles
      return this.availableLanguages;
    }

    // Filtrar solo los idiomas que la institución ofrece
    return this.availableLanguages.filter(language => 
      this.institutionOfferedLanguages.includes(language.code) ||
      this.institutionOfferedLanguages.includes(language.name) ||
      this.institutionOfferedLanguages.includes(language.name_es || '') ||
      this.institutionOfferedLanguages.includes(language.name_en || '')
    );
  }

  // Método para obtener idiomas requeridos disponibles (todos del LanguageService)
  getAvailableRequiredLanguages(): Language[] {
    return this.availableLanguages;
  }

  logout(): void {
    this.sessionService.logout();
  }
}
