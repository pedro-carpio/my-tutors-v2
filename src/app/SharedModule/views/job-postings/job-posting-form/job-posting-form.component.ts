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

// ✅ NUEVO: Extensión temporal para retrocompatibilidad durante migración
interface JobPostingWithLegacyFields extends JobPosting {
  class_date?: any; // Campos antiguos para migración
  start_time?: string;
}

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

  // ✅ NUEVO: Propiedades para manejo de timezones basados en países de estudiantes
  studentCountriesTimezones: {timezone: string; display_name: string; utc_offset: string}[] = [];
  showStudentCountriesTimezoneSelector = false;
  
  // ✅ NUEVO: Propiedades para manejo de timezones en job postings
  showJobLocationTimezone = false;
  availableJobTimezones: {timezone: string; display_name: string; utc_offset: string}[] = [];
  jobLocationHasMultipleTimezones = false;
  institutionTimezoneInfo: LocationTimezoneInfo | null = null; // Información de timezone almacenada de la institución

  // ✅ NUEVO: Propiedades para manejo de timezones por estudiante
  studentTimezoneStates: Record<number, {code: string; name: string}[]> = {};
  studentTimezoneInfo: Record<number, {
    showSelector: boolean;
    availableTimezones: {timezone: string; display_name: string; utc_offset: string}[];
    hasMultipleTimezones: boolean;
  }> = {};

  // Datos dinámicos desde la institución
  institutionPrograms: string[] = [];
  institutionClassTypes: ClassType[] = [];
  institutionCountries: InstitutionCountry[] = [];
  institutionLevelGroups: StudentLevelGroup[] = [];
  institutionOfferedLanguages: string[] = []; // Idiomas que ofrece la institución
  isLoadingInstitutionData = false;

  ngOnInit(): void {
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
      class_datetime: ['', [Validators.required]], // ✅ NUEVO: Campo combinado de fecha y hora
      total_duration_minutes: [60, [Validators.required, Validators.min(30), Validators.max(480)]],
      frequency: ['unica', [Validators.required]],
      frequency_other: [''],
      is_divided_by_students: [false],
      location: [''],
      location_country: [''], // ✅ CORREGIDO: No requerido por defecto, se hará dinámico
      location_state: [''], // Estado obligatorio si el país lo requiere
      video_call_link: [''],
      hourly_rate: ['', [Validators.min(0)]], // ✅ CORREGIDO: Inicia vacío en lugar de null
      currency: [''], // ✅ CORREGIDO: Inicia vacío en lugar de USD
      // ✅ NUEVO: Campo de timezone específico para el job posting (siempre obligatorio)
      job_timezone: ['', [Validators.required]] // Timezone específico para esta clase/job
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
      const locationStateControl = this.classDetailsForm.get('location_state');
      const videoCallLinkControl = this.classDetailsForm.get('video_call_link'); // ✅ CORREGIDO: nombre correcto del campo

      if (modality === 'presencial' || modality === 'hibrida') {
        locationControl?.setValidators([Validators.required]);
        locationCountryControl?.setValidators([Validators.required]); // ✅ NUEVO: País requerido para presencial/híbrida
      } else {
        locationControl?.clearValidators();
        locationCountryControl?.clearValidators(); // ✅ NUEVO: País no requerido para virtual
        // Limpiar valores de ubicación específica para clases virtuales
        locationControl?.setValue('');
        locationCountryControl?.setValue('');
        locationStateControl?.setValue('');
      }

      if (modality === 'virtual' || modality === 'hibrida') {
        videoCallLinkControl?.setValidators([Validators.required]); // ✅ CORREGIDO: validación del campo correcto
      } else {
        videoCallLinkControl?.clearValidators();
        videoCallLinkControl?.setValue(''); // Limpiar para modalidades no virtuales
      }

      locationControl?.updateValueAndValidity();
      locationCountryControl?.updateValueAndValidity();
      locationStateControl?.updateValueAndValidity();
      videoCallLinkControl?.updateValueAndValidity(); // ✅ CORREGIDO: campo correcto
      this.classDetailsForm.get('job_timezone')?.updateValueAndValidity();
    });

    // ✅ NUEVO: Watcher para cambios en el país de ubicación con validación dinámica de estado
    this.classDetailsForm.get('location_country')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((countryCode: string) => {
      this.loadStatesForJobLocation(countryCode);
      
      const locationStateControl = this.classDetailsForm.get('location_state');
      
      // Validar estado si el país requiere estados
      if (countryCode && this.locationService.hasStates(countryCode)) {
        locationStateControl?.setValidators([Validators.required]);
      } else {
        locationStateControl?.clearValidators();
        locationStateControl?.setValue('');
      }
      
      locationStateControl?.updateValueAndValidity();
      
      // ✅ Actualizar información de timezone cuando cambia el país de ubicación
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

    // ✅ NUEVO: Watcher para cambios en la tarifa - manejar moneda automáticamente
    this.classDetailsForm.get('hourly_rate')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((rate: number | null) => {
      const currencyControl = this.classDetailsForm.get('currency');
      
      if (rate !== null && rate !== undefined && rate > 0) {
        // Si se ingresa una tarifa, establecer USD por defecto si no hay moneda seleccionada
        if (!currencyControl?.value) {
          currencyControl?.setValue('USD');
        }
      } else {
        // Si la tarifa está vacía o es 0, limpiar la moneda
        currencyControl?.setValue('');
      }
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

  // ✅ NUEVO: Método para verificar si el estado es obligatorio
  isStateRequiredForJob(): boolean {
    const selectedCountry = this.classDetailsForm.get('location_country')?.value;
    return selectedCountry && this.locationService.hasStates(selectedCountry);
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
      // ✅ REMOVIDO: Eliminar referencias a dst_aware y convertir formato
      this.availableJobTimezones = timezonesInfo.timezone_info.map(tz => ({
        timezone: tz.timezone,
        display_name: tz.display_name,
        utc_offset: tz.utc_offset.split('/')[0] // Solo el primer offset, sin DST
      }));
      
      // Si hay múltiples timezones, mostrar selector manual y requerir selección
      if (timezonesInfo.multiple_timezones) {
        console.log(`🕐 ${countryCode}${stateCode ? '/' + stateCode : ''} tiene múltiples timezones para job posting`);
        this.showJobLocationTimezone = true;
        // Limpiar timezone actual para forzar nueva selección
        this.classDetailsForm.get('job_timezone')?.setValue('');
        // Asegurar que sea obligatorio
        this.classDetailsForm.get('job_timezone')?.setValidators([Validators.required]);
      } else {
        // Si hay solo una timezone, asignarla automáticamente
        this.showJobLocationTimezone = false;
        const automaticTimezone = timezonesInfo.timezones[0];
        this.classDetailsForm.get('job_timezone')?.setValue(automaticTimezone);
        console.log(`🕐 Timezone automática asignada para job posting: ${automaticTimezone}`);
        // Mantener como obligatorio pero ya tiene valor
        this.classDetailsForm.get('job_timezone')?.setValidators([Validators.required]);
      }
      
      // Actualizar validaciones
      this.classDetailsForm.get('job_timezone')?.updateValueAndValidity();
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
    // Mantener como obligatorio incluso cuando se limpia
    this.classDetailsForm.get('job_timezone')?.setValidators([Validators.required]);
    this.classDetailsForm.get('job_timezone')?.updateValueAndValidity();
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
  getJobTimezoneOptions(): {timezone: string; display_name: string; utc_offset: string}[] {
    return this.availableJobTimezones;
  }

  /**
   * Obtiene el timezone seleccionado para mostrar en los hints de fecha/hora
   */
  getSelectedJobTimezone(): string {
    const selectedTimezone = this.classDetailsForm.get('job_timezone')?.value;
    if (selectedTimezone && this.availableJobTimezones.length > 0) {
      const timezoneInfo = this.availableJobTimezones.find(tz => tz.timezone === selectedTimezone);
      return timezoneInfo ? `${timezoneInfo.display_name} (${timezoneInfo.utc_offset})` : selectedTimezone;
    }
    return '';
  }

  // ✅ NUEVO: Métodos para manejar timezones basados en países de estudiantes

  /**
   * Carga los timezones basados en los países de estudiantes de la institución
   */
  private loadStudentCountriesTimezones(): void {
    console.log('🕐 Cargando timezones basados en países de estudiantes...');
    console.log('🏢 Países de estudiantes configurados:', this.institutionCountries);
    
    // ⚠️ TEMPORAL: Si no hay países configurados, usar países de ejemplo para testing
    let countriesToProcess = this.institutionCountries;
    if (!countriesToProcess || countriesToProcess.length === 0) {
      console.log('⚠️ No hay países de estudiantes configurados, usando países de ejemplo');
      countriesToProcess = [
        { code: 'BO', name: 'Bolivia' },
        { code: 'US', name: 'Estados Unidos' }
      ];
    }

    const allTimezones: {timezone: string; display_name: string; utc_offset: string}[] = [];
    const seenTimezones = new Set<string>();

    // Procesar países de estudiantes específicos
    for (const country of countriesToProcess) {
      console.log(`🕐 Procesando país: ${country.code} (${country.name})`);
      
      // Obtener información de timezone para el país
      let timezonesInfo = null;
      
      if (country.code === 'US') {
        // ✅ CORREGIDO: Para EE.UU., obtener estados desde la propiedad 'states' del país
        const usCountry = this.institutionCountries.find(c => c.code === 'US');
        const usStates = usCountry?.states || [];
        
        console.log(`🗺️ Estados de EE.UU. configurados:`, usStates);
        
        // Si hay estados específicos configurados, usar solo esos
        if (usStates.length > 0) {
          const usTimezones: {timezone: string; display_name: string; utc_offset: string}[] = [];
          // ✅ CORREGIDO: Usar TimezoneService para obtener información de estados específicos
          
          for (const state of usStates) {
            console.log(`🏛️ Procesando estado: ${state.code} (${state.name})`);
            const stateTimezoneInfo = this.timezoneService.getTimezonesForLocation('US', state.code);
            
            if (stateTimezoneInfo && stateTimezoneInfo.timezone_info) {
              for (const tzInfo of stateTimezoneInfo.timezone_info) {
                // Verificar que no esté duplicado
                if (!usTimezones.some(tz => tz.timezone === tzInfo.timezone)) {
                  usTimezones.push({
                    timezone: tzInfo.timezone,
                    display_name: `${tzInfo.display_name} (${state.name})`,
                    utc_offset: tzInfo.utc_offset // Sin split porque ya no hay DST
                  });
                  console.log(`🕐 Agregando timezone para ${state.code}: ${tzInfo.display_name}`);
                }
              }
            } else {
              console.warn(`⚠️ No se encontró timezone para estado: ${state.code} (${state.name})`);
            }
          }
          
          timezonesInfo = {
            country_code: 'US',
            timezones: usTimezones.map(tz => tz.timezone),
            multiple_timezones: usTimezones.length > 1,
            timezone_info: usTimezones
          };
        } else {
          console.log('⚠️ No hay estados específicos configurados para US');
          timezonesInfo = null;
        }
      } else {
        // Para otros países, obtener del servicio de timezone
        const originalInfo = this.timezoneService.getTimezonesForLocation(country.code);
        if (originalInfo && originalInfo.timezone_info) {
          // ✅ REMOVIDO: Ya no necesitamos remover referencias a dst_aware porque el servicio no las incluye
          timezonesInfo = {
            country_code: country.code,
            timezones: originalInfo.timezones,
            multiple_timezones: originalInfo.multiple_timezones,
            timezone_info: originalInfo.timezone_info.map(tz => ({
              timezone: tz.timezone,
              display_name: tz.display_name,
              utc_offset: tz.utc_offset // Ya simplificado sin DST
            }))
          };
        }
      }
      
      console.log(`🕐 Timezones obtenidos para ${country.code}:`, timezonesInfo);
      
      if (timezonesInfo && timezonesInfo.timezone_info) {
        for (const tzInfo of timezonesInfo.timezone_info) {
          console.log(`🕐 Procesando timezone: ${tzInfo.timezone} - ${tzInfo.display_name}`);
          if (!seenTimezones.has(tzInfo.timezone)) {
            seenTimezones.add(tzInfo.timezone);
            allTimezones.push({
              timezone: tzInfo.timezone,
              display_name: tzInfo.display_name,
              utc_offset: tzInfo.utc_offset
            });
          }
        }
      }
    }

    // Ordenar por offset UTC
    allTimezones.sort((a, b) => {
      const offsetA = this.parseUtcOffset(a.utc_offset);
      const offsetB = this.parseUtcOffset(b.utc_offset);
      return offsetA - offsetB;
    });

    this.studentCountriesTimezones = allTimezones;
    this.showStudentCountriesTimezoneSelector = allTimezones.length > 0;
    
    console.log(`🕐 ${allTimezones.length} timezones únicos cargados:`, 
                allTimezones.map(tz => `${tz.display_name} (${tz.utc_offset})`));
  }

  /**
   * Parsea un offset UTC para ordenamiento
   */
  private parseUtcOffset(offset: string): number {
    // Extrae el primer valor numérico del offset (ej: "UTC-5/-4" -> -5)
    const match = offset.match(/UTC([+-]?\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Verifica si se debe mostrar el selector de timezone de países de estudiantes
   */
  shouldShowStudentCountriesTimezoneSelector(): boolean {
    return this.showStudentCountriesTimezoneSelector && this.studentCountriesTimezones.length > 0;
  }

  /**
   * Obtiene las opciones de timezone de países de estudiantes
   */
  getStudentCountriesTimezoneOptions(): {timezone: string; display_name: string; utc_offset: string}[] {
    return this.studentCountriesTimezones;
  }

  /**
   * ✅ NUEVO: Verifica si se debe mostrar el campo de moneda
   */
  shouldShowCurrencyField(): boolean {
    const hourlyRate = this.classDetailsForm.get('hourly_rate')?.value;
    return hourlyRate !== null && hourlyRate !== undefined && hourlyRate !== '' && parseFloat(hourlyRate) > 0;
  }

  /**
   * ✅ NUEVO: Obtiene el valor de la tarifa como string para mostrar
   */
  getHourlyRateDisplay(): string {
    const rate = this.classDetailsForm.get('hourly_rate')?.value;
    if (rate === null || rate === undefined || rate === '') {
      return '';
    }
    return rate.toString();
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
        // Invalidar cache de idiomas para que se recomputen
        this._lastTargetLanguagesCheck = '';
        this._lastRequiredLanguagesCheck = '';
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
          
          // ✅ NUEVO: Cargar timezones basados en países de estudiantes
          this.loadStudentCountriesTimezones();
          
          // Cargar grupos de estudiantes
          this.institutionLevelGroups = (institution.student_level_groups || [])
            .filter(group => group.is_active !== false);
          
          // Cargar idiomas que ofrece la institución para el campo "idioma objetivo"
          this.institutionOfferedLanguages = institution.languages_offered || [];
          // Invalidar cache de idiomas para que se recomputen
          this._lastTargetLanguagesCheck = '';

          console.log('✅ Datos de institución cargados:', {
            programs: this.institutionPrograms.length,
            classTypes: this.institutionClassTypes.length,
            countries: this.institutionCountries.length,
            levelGroups: this.institutionLevelGroups.length,
            offeredLanguages: this.institutionOfferedLanguages.length,
            offeredLanguagesDetail: this.institutionOfferedLanguages
          });

          console.log('🌐 Idiomas disponibles y ofrecidos:', {
            totalAvailable: this.availableLanguages.length,
            availableLanguages: this.availableLanguages.map(l => ({ code: l.code, name: l.name })),
            institutionOffered: this.institutionOfferedLanguages,
            targetLanguages: this.availableTargetLanguages.length,
            requiredLanguages: this.availableRequiredLanguages.length
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
      next: (jobPosting: JobPostingWithLegacyFields | undefined) => {
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

  private populateForms(jobPosting: JobPostingWithLegacyFields): void {
    // Información básica
    this.basicInfoForm.patchValue({
      title: jobPosting.title,
      program: jobPosting.program,
      class_type: jobPosting.class_type,
      modality: jobPosting.modality,
      additional_comment: jobPosting.additional_comment || ''
    });

    // Convertir la fecha y hora combinada si es un Timestamp de Firestore
    let classDateTime: Date | null = null;
    if (jobPosting.class_datetime) {
      if (typeof (jobPosting.class_datetime as any).toDate === 'function') {
        // Es un Timestamp de Firestore
        classDateTime = (jobPosting.class_datetime as any).toDate();
      } else if (jobPosting.class_datetime instanceof Date) {
        // Ya es un Date
        classDateTime = jobPosting.class_datetime;
      } else if (typeof jobPosting.class_datetime === 'string') {
        // Es un string, convertir a Date
        classDateTime = new Date(jobPosting.class_datetime);
      }
    } else if (jobPosting.class_date && jobPosting.start_time) {
      // Migración desde campos separados (retrocompatibilidad)
      let classDate: Date | null = null;
      if (typeof (jobPosting.class_date as any).toDate === 'function') {
        classDate = (jobPosting.class_date as any).toDate();
      } else if (jobPosting.class_date instanceof Date) {
        classDate = jobPosting.class_date;
      } else if (typeof jobPosting.class_date === 'string') {
        classDate = new Date(jobPosting.class_date);
      }
      
      if (classDate && jobPosting.start_time) {
        const [hours, minutes] = jobPosting.start_time.split(':').map(num => parseInt(num, 10));
        classDateTime = new Date(classDate);
        classDateTime.setHours(hours, minutes, 0, 0);
      }
    }

    // Detalles de clase
    this.classDetailsForm.patchValue({
      class_datetime: classDateTime, // ✅ NUEVO: Campo combinado de fecha y hora
      total_duration_minutes: jobPosting.total_duration_minutes,
      frequency: jobPosting.frequency,
      frequency_other: jobPosting.frequency_other || '',
      is_divided_by_students: jobPosting.is_divided_by_students,
      location: jobPosting.location || '',
      location_country: jobPosting.location_country || '',
      location_state: jobPosting.location_state || '',
      video_call_link: jobPosting.video_call_link || '',
      hourly_rate: jobPosting.hourly_rate || null,
      currency: jobPosting.currency || 'USD',
      job_timezone: jobPosting.job_timezone || '' // ✅ Timezone del job posting
    });

    // Cargar estados si hay un país seleccionado
    if (jobPosting.location_country) {
      this.loadStatesForJobLocation(jobPosting.location_country);
    }

    // Estudiantes
    this.setStudents(jobPosting.students);
    
    // ✅ NUEVO: Requisitos del tutor
    this.tutorRequirementsForm.patchValue({
      required_languages: jobPosting.required_languages || [],
      target_language: jobPosting.target_language || '',
      required_experience_level: jobPosting.required_experience_level || '',
      max_hourly_rate: jobPosting.max_hourly_rate || null
    });
  }

  // Gestión de estudiantes
  get studentsArray(): FormArray {
    return this.studentsForm.get('students') as FormArray;
  }

  addStudent(): void {
    const studentIndex = this.studentsArray.length; // Obtener el índice antes de agregar
    
    const studentGroup = this.fb.group({
      name: ['', [Validators.required]],
      age: [null, [Validators.required, Validators.min(3), Validators.max(100)]],
      level_group: ['', [Validators.required]],
      individual_duration_minutes: [null, [Validators.min(15)]],
      allergies_conditions: [''],
      responsible_person: ['', [Validators.required]],
      contact_phone: ['', [Validators.required]],
      additional_notes: [''],
      // ✅ NUEVOS CAMPOS: Configuración de timezone del estudiante
      use_job_timezone: [true],
      timezone_country: [''],
      timezone_state: [''],
      student_timezone: [''],
      // Campos para gestión de estudiantes registrados
      is_registered: [false],
      user_id: [''],
      created_during_job_posting: [false]
    });

    // Configurar validadores dinámicos para timezone
    this.setupStudentTimezoneValidations(studentGroup, studentIndex);

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
        const studentIndex = this.studentsArray.length; // Obtener el índice antes de agregar
        
        const studentGroup = this.fb.group({
          name: [result.studentDetails.name, [Validators.required]],
          age: [result.studentDetails.age, [Validators.required, Validators.min(3), Validators.max(100)]],
          level_group: [result.studentDetails.level_group, [Validators.required]],
          individual_duration_minutes: [result.studentDetails.individual_duration_minutes || null, [Validators.min(15)]],
          allergies_conditions: [result.studentDetails.allergies_conditions || ''],
          responsible_person: [result.studentDetails.responsible_person, [Validators.required]],
          contact_phone: [result.studentDetails.contact_phone, [Validators.required]],
          additional_notes: [result.studentDetails.additional_notes || ''],
          use_job_timezone: [true],
          timezone_country: [''],
          timezone_state: [''],
          student_timezone: [''],
          // Campos para gestión de estudiantes registrados
          is_registered: [result.studentDetails.is_registered || false],
          user_id: [result.studentDetails.user_id || ''],
          created_during_job_posting: [result.studentDetails.created_during_job_posting || false]
        });

        // Configurar validadores dinámicos para timezone
        this.setupStudentTimezoneValidations(studentGroup, studentIndex);

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
    const studentGroups = students.map((student, index) => {
      const group = this.fb.group({
        name: [student.name, [Validators.required]],
        age: [student.age, [Validators.required, Validators.min(3), Validators.max(100)]],
        level_group: [student.level_group, [Validators.required]],
        individual_duration_minutes: [student.individual_duration_minutes || null, [Validators.min(15)]],
        allergies_conditions: [student.allergies_conditions || ''],
        responsible_person: [student.responsible_person, [Validators.required]],
        contact_phone: [student.contact_phone, [Validators.required]],
        additional_notes: [student.additional_notes || ''],
        use_job_timezone: [true],
        timezone_country: [''],
        timezone_state: [''],
        student_timezone: [''],
        // Campos para gestión de estudiantes registrados
        is_registered: [student.is_registered || false],
        user_id: [student.user_id || ''],
        created_during_job_posting: [student.created_during_job_posting || false]
      });

      // Configurar validadores dinámicos para timezone
      this.setupStudentTimezoneValidations(group, index);
      return group;
    });

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

    // ✅ NUEVO: Construir datos con el nuevo campo datetime
    const jobPostingData: any = {
      ...basicInfo,
      ...tutorRequirements,
      students,
      institution_id: this.currentUser?.uid || '',
      timezone: userTimezone,
      status: reviewData.save_as_draft ? 'draft' : 'published',
      created_by: this.currentUser?.uid || '',
      created_at: new Date() as any,
      updated_at: new Date() as any
    };

    // Procesar campos de fecha y hora
    if (classDetails.class_datetime) {
      jobPostingData.class_datetime = classDetails.class_datetime;
      
      // También generar campos legacy para retrocompatibilidad
      const dateTime = new Date(classDetails.class_datetime);
      jobPostingData.class_date = new Date(dateTime.getFullYear(), dateTime.getMonth(), dateTime.getDate());
      jobPostingData.start_time = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
    }

    // Agregar resto de campos de class details
    jobPostingData.total_duration_minutes = classDetails.total_duration_minutes;
    jobPostingData.frequency = classDetails.frequency;
    jobPostingData.frequency_other = classDetails.frequency_other;
    jobPostingData.is_divided_by_students = classDetails.is_divided_by_students;
    jobPostingData.location = classDetails.location;
    jobPostingData.location_country = classDetails.location_country;
    jobPostingData.location_state = classDetails.location_state;
    jobPostingData.video_call_link = classDetails.video_call_link;
    jobPostingData.hourly_rate = classDetails.hourly_rate;
    jobPostingData.currency = classDetails.currency;
    jobPostingData.job_timezone = classDetails.job_timezone;

    return jobPostingData;
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

  // ✅ NUEVO: Método para formatear fecha y hora combinadas
  formatDateTime(value: any): string {
    if (!value) return '';
    
    // Si es un Timestamp de Firestore
    if (value && typeof value.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
    
    // Si ya es un Date
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    // Si es un string, intentar convertir
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    
    return value.toString();
  }

  // ✅ NUEVO: Método para obtener el timezone seleccionado para mostrar
  getSelectedTimezone(): string {
    const selectedTimezone = this.classDetailsForm.get('job_timezone')?.value;
    if (selectedTimezone && this.studentCountriesTimezones.length > 0) {
      const timezoneInfo = this.studentCountriesTimezones.find(tz => tz.timezone === selectedTimezone);
      return timezoneInfo ? timezoneInfo.display_name : selectedTimezone;
    }
    return '';
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

  // Propiedades computadas para idiomas (evita ciclos infinitos de detección de cambios)
  private _cachedTargetLanguages: Language[] = [];
  private _cachedRequiredLanguages: Language[] = [];
  private _lastTargetLanguagesCheck = '';
  private _lastRequiredLanguagesCheck = '';

  // Getter para idiomas objetivo disponibles (desde languages_offered de la institución)
  get availableTargetLanguages(): Language[] {
    // Crear checksum para detectar cambios
    const checksum = `${this.availableLanguages.length}-${this.institutionOfferedLanguages.join(',')}-${this.isLoadingLanguages}-${this.isLoadingInstitutionData}`;
    
    // Si no ha cambiado nada, devolver cache
    if (this._lastTargetLanguagesCheck === checksum) {
      return this._cachedTargetLanguages;
    }

    console.log('🎯 Computing available target languages:', {
      institutionOfferedLanguages: this.institutionOfferedLanguages,
      availableLanguages: this.availableLanguages.length,
      isLoadingLanguages: this.isLoadingLanguages,
      isLoadingInstitutionData: this.isLoadingInstitutionData
    });

    // Si aún se están cargando los datos, devolver array vacío
    if (this.isLoadingLanguages || this.isLoadingInstitutionData) {
      this._cachedTargetLanguages = [];
      this._lastTargetLanguagesCheck = checksum;
      return this._cachedTargetLanguages;
    }

    // Si no hay idiomas disponibles, devolver array vacío
    if (this.availableLanguages.length === 0) {
      this._cachedTargetLanguages = [];
      this._lastTargetLanguagesCheck = checksum;
      return this._cachedTargetLanguages;
    }

    if (this.institutionOfferedLanguages.length === 0) {
      // Si la institución no tiene idiomas configurados, usar todos los disponibles
      this._cachedTargetLanguages = this.availableLanguages;
      this._lastTargetLanguagesCheck = checksum;
      return this._cachedTargetLanguages;
    }

    // Filtrar solo los idiomas que la institución ofrece
    const filtered = this.availableLanguages.filter(language => 
      this.institutionOfferedLanguages.includes(language.code) ||
      this.institutionOfferedLanguages.includes(language.name) ||
      this.institutionOfferedLanguages.includes(language.name_es || '') ||
      this.institutionOfferedLanguages.includes(language.name_en || '')
    );

    console.log('🎯 Filtered target languages:', filtered.length, '(', filtered.map(l => l.name).join(', '), ')');
    
    this._cachedTargetLanguages = filtered;
    this._lastTargetLanguagesCheck = checksum;
    return this._cachedTargetLanguages;
  }

  // Getter para idiomas requeridos disponibles (todos del LanguageService)
  get availableRequiredLanguages(): Language[] {
    // Crear checksum para detectar cambios
    const checksum = `${this.availableLanguages.length}-${this.isLoadingLanguages}`;
    
    // Si no ha cambiado nada, devolver cache
    if (this._lastRequiredLanguagesCheck === checksum) {
      return this._cachedRequiredLanguages;
    }

    console.log('📋 Computing available required languages:', {
      availableLanguages: this.availableLanguages.length,
      isLoadingLanguages: this.isLoadingLanguages
    });

    // Si aún se están cargando los datos, devolver array vacío
    if (this.isLoadingLanguages) {
      this._cachedRequiredLanguages = [];
      this._lastRequiredLanguagesCheck = checksum;
      return this._cachedRequiredLanguages;
    }

    // Si no hay idiomas disponibles, devolver array vacío
    if (this.availableLanguages.length === 0) {
      this._cachedRequiredLanguages = [];
      this._lastRequiredLanguagesCheck = checksum;
      return this._cachedRequiredLanguages;
    }

    // Devolver todos los idiomas disponibles para los requerimientos
    this._cachedRequiredLanguages = this.availableLanguages;
    this._lastRequiredLanguagesCheck = checksum;
    return this._cachedRequiredLanguages;
  }
  
  /**
   * Configurar validaciones dinámicas para timezone del estudiante
   */
  private setupStudentTimezoneValidations(studentGroup: FormGroup, studentIndex: number): void {
    studentGroup.get('use_job_timezone')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe((useJobTimezone: boolean) => {
      const countryControl = studentGroup.get('timezone_country');
      const stateControl = studentGroup.get('timezone_state');
      const timezoneControl = studentGroup.get('student_timezone');

      if (!useJobTimezone) {
        console.log(`🕐 Estudiante ${studentIndex}: Configurando timezone manual`);
        
        // Si no usa la timezone del trabajo, hacer campos requeridos
        countryControl?.setValidators([Validators.required]);
        // El estado será obligatorio dinámicamente según el país
        // El timezone será obligatorio dinámicamente según la ubicación
        
        // Inicializar con los valores del trabajo si están disponibles y no hay valores previos
        const jobCountry = this.classDetailsForm.get('location_country')?.value;
        const jobState = this.classDetailsForm.get('location_state')?.value;
        const jobTimezone = this.classDetailsForm.get('job_timezone')?.value;
        
        if (!countryControl?.value && jobCountry) {
          console.log(`🕐 Inicializando país del estudiante ${studentIndex} con valor del job: ${jobCountry}`);
          countryControl?.setValue(jobCountry);
          
          // Cargar estados y timezones para el país inicial
          setTimeout(() => {
            this.loadStatesForStudentTimezone(studentIndex, jobCountry);
            this.loadTimezonesForStudentLocation(studentIndex, jobCountry, jobState);
          }, 0);
        }
        
        if (!stateControl?.value && jobState && this.locationService.hasStates(jobCountry)) {
          console.log(`🕐 Inicializando estado del estudiante ${studentIndex} con valor del job: ${jobState}`);
          stateControl?.setValue(jobState);
        }
        
        if (!timezoneControl?.value && jobTimezone) {
          console.log(`🕐 Inicializando timezone del estudiante ${studentIndex} con valor del job: ${jobTimezone}`);
          timezoneControl?.setValue(jobTimezone);
        }
      } else {
        console.log(`🕐 Estudiante ${studentIndex}: Usando timezone del job`);
        
        // Si usa la timezone del trabajo, limpiar validaciones
        countryControl?.clearValidators();
        stateControl?.clearValidators();
        timezoneControl?.clearValidators();
        
        // Limpiar valores para evitar confusión
        countryControl?.setValue('');
        stateControl?.setValue('');
        timezoneControl?.setValue('');
        
        // Limpiar información de timezone específica del estudiante
        if (this.studentTimezoneInfo[studentIndex]) {
          this.clearStudentLocationTimezone(studentIndex);
        }
      }

      countryControl?.updateValueAndValidity();
      stateControl?.updateValueAndValidity();
      timezoneControl?.updateValueAndValidity();
    });
  }

  /**
   * Maneja el cambio de país para timezone del estudiante
   */
  onStudentTimezoneCountryChange(studentIndex: number, countryCode: string): void {
    console.log(`🗺️ Estudiante ${studentIndex}: País cambiado a ${countryCode}`);
    
    const studentGroup = this.studentsArray.at(studentIndex) as FormGroup;
    const stateControl = studentGroup.get('timezone_state');
    
    // Cargar estados para este país
    this.loadStatesForStudentTimezone(studentIndex, countryCode);
    
    // Configurar validación dinámica del estado
    if (countryCode && this.locationService.hasStates(countryCode)) {
      stateControl?.setValidators([Validators.required]);
      console.log(`🗺️ Estado requerido para estudiante ${studentIndex} en país ${countryCode}`);
    } else {
      stateControl?.clearValidators();
      stateControl?.setValue('');
      console.log(`🗺️ Estado no requerido para estudiante ${studentIndex} en país ${countryCode}`);
    }
    stateControl?.updateValueAndValidity();
    
    // Cargar opciones de timezone para este país
    this.loadTimezonesForStudentLocation(studentIndex, countryCode);
  }

  /**
   * Maneja el cambio de estado para timezone del estudiante
   */
  onStudentTimezoneStateChange(studentIndex: number, stateCode: string): void {
    console.log(`🗺️ Estudiante ${studentIndex}: Estado cambiado a ${stateCode}`);
    
    const studentGroup = this.studentsArray.at(studentIndex) as FormGroup;
    const countryCode = studentGroup.get('timezone_country')?.value;
    
    if (countryCode && stateCode) {
      // Cargar opciones de timezone para este país/estado
      this.loadTimezonesForStudentLocation(studentIndex, countryCode, stateCode);
    }
  }

  /**
   * Carga los estados disponibles para el timezone del estudiante
   */
  private loadStatesForStudentTimezone(studentIndex: number, countryCode: string): void {
    if (!this.studentTimezoneStates[studentIndex]) {
      this.studentTimezoneStates[studentIndex] = [];
    }
    
    if (this.locationService.hasStates(countryCode)) {
      // Cargar estados específicamente para este estudiante
      this.locationService.getStatesByCountryCode(countryCode).subscribe(states => {
        this.studentTimezoneStates[studentIndex] = states;
        console.log(`🗺️ Estados cargados para estudiante ${studentIndex}:`, states.length);
      });
    } else {
      this.studentTimezoneStates[studentIndex] = [];
    }
  }

  /**
   * Carga las opciones de timezone para la ubicación del estudiante
   */
  private loadTimezonesForStudentLocation(studentIndex: number, countryCode: string, stateCode?: string): void {
    if (!countryCode) {
      this.clearStudentLocationTimezone(studentIndex);
      return;
    }

    console.log(`🕐 Cargando timezones para estudiante ${studentIndex}: ${countryCode}${stateCode ? '/' + stateCode : ''}`);

    const timezonesInfo = this.timezoneService.getTimezonesForLocation(countryCode, stateCode);
    if (timezonesInfo) {
      // Inicializar objeto si no existe
      if (!this.studentTimezoneInfo[studentIndex]) {
        this.studentTimezoneInfo[studentIndex] = {
          showSelector: false,
          availableTimezones: [],
          hasMultipleTimezones: false
        };
      }
      
      this.studentTimezoneInfo[studentIndex].hasMultipleTimezones = timezonesInfo.multiple_timezones;
      // ✅ REMOVIDO: Eliminar referencias a dst_aware y convertir formato
      this.studentTimezoneInfo[studentIndex].availableTimezones = timezonesInfo.timezone_info.map(tz => ({
        timezone: tz.timezone,
        display_name: tz.display_name,
        utc_offset: tz.utc_offset.split('/')[0] // Solo el primer offset, sin DST
      }));
      
      const studentGroup = this.studentsArray.at(studentIndex) as FormGroup;
      
      // Si hay múltiples timezones, mostrar selector manual y requerir selección
      if (timezonesInfo.multiple_timezones) {
        console.log(`🕐 Estudiante ${studentIndex}: Múltiples timezones disponibles, mostrando selector`);
        this.studentTimezoneInfo[studentIndex].showSelector = true;
        // Limpiar timezone actual para forzar nueva selección si no hay valor
        if (!studentGroup.get('student_timezone')?.value) {
          studentGroup.get('student_timezone')?.setValue('');
        }
        // Asegurar que sea obligatorio
        studentGroup.get('student_timezone')?.setValidators([Validators.required]);
      } else {
        // Si hay solo una timezone, asignarla automáticamente
        console.log(`🕐 Estudiante ${studentIndex}: Una sola timezone, asignando automáticamente: ${timezonesInfo.timezones[0]}`);
        this.studentTimezoneInfo[studentIndex].showSelector = false;
        studentGroup.get('student_timezone')?.setValue(timezonesInfo.timezones[0]);
        // Mantener como obligatorio pero ya tiene valor
        studentGroup.get('student_timezone')?.setValidators([Validators.required]);
      }
      
      // Actualizar validaciones
      studentGroup.get('student_timezone')?.updateValueAndValidity();
      
    } else {
      console.warn(`🕐 No se encontró información de timezone para estudiante ${studentIndex}: ${countryCode}${stateCode ? '/' + stateCode : ''}`);
      this.clearStudentLocationTimezone(studentIndex);
    }
  }

  /**
   * Limpia la información de timezone del estudiante
   */
  private clearStudentLocationTimezone(studentIndex: number): void {
    if (this.studentTimezoneInfo[studentIndex]) {
      this.studentTimezoneInfo[studentIndex].showSelector = false;
      this.studentTimezoneInfo[studentIndex].availableTimezones = [];
      this.studentTimezoneInfo[studentIndex].hasMultipleTimezones = false;
    }
    
    const studentGroup = this.studentsArray.at(studentIndex) as FormGroup;
    studentGroup.get('student_timezone')?.setValue('');
  }

  /**
   * Verifica si el estudiante tiene estados disponibles
   */
  getStudentHasStates(studentIndex: number): boolean {
    const studentGroup = this.studentsArray.at(studentIndex) as FormGroup;
    const countryCode = studentGroup.get('timezone_country')?.value;
    return countryCode && this.locationService.hasStates(countryCode);
  }

  /**
   * Obtiene los estados disponibles para el estudiante
   */
  getStudentAvailableStates(studentIndex: number): {code: string; name: string}[] {
    return this.studentTimezoneStates[studentIndex] || [];
  }

  /**
   * Verifica si se debe mostrar el selector de timezone para el estudiante
   */
  getStudentShouldShowTimezoneSelector(studentIndex: number): boolean {
    return this.studentTimezoneInfo[studentIndex]?.showSelector || false;
  }

  /**
   * Obtiene las opciones de timezone disponibles para el estudiante
   */
  getStudentTimezoneOptions(studentIndex: number): {timezone: string; display_name: string; utc_offset: string}[] {
    return this.studentTimezoneInfo[studentIndex]?.availableTimezones || [];
  }

  /**
   * Verifica si la ubicación del estudiante tiene múltiples timezones
   */
  getStudentLocationHasMultipleTimezones(studentIndex: number): boolean {
    return this.studentTimezoneInfo[studentIndex]?.hasMultipleTimezones || false;
  }

  logout(): void {
    this.sessionService.logout();
  }
}
