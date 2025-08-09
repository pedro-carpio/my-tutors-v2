import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { Auth } from '@angular/fire/auth';
import { TutorService } from '../../../../../services/tutor.service';
import { LanguageService } from '../../../../../services/language.service';
import { UserLanguageService } from '../../../../../services/tutor-language.service';
import { LocationService } from '../../../../../services/location.service';
import { TimezoneService } from '../../../../../services/timezone.service';
import { Tutor, ExperienceLevel, Language, LevelCEFR, InstitutionState } from '../../../../../types/firestore.types';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';
import { Timestamp } from '@angular/fire/firestore';

export interface TutorEditDialogData {
  tutor: Tutor | null;
}

@Component({
  selector: 'app-tutor-edit-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatChipsModule,
    MatDatepickerModule,
    MatStepperModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDividerModule,
    TranslatePipe
  ],
  templateUrl: './tutor-edit-dialog.component.html',
  styleUrl: './tutor-edit-dialog.component.scss'
})
export class TutorEditDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tutorService = inject(TutorService);
  private languageService = inject(LanguageService);
  private userLanguageService = inject(UserLanguageService);
  private locationService = inject(LocationService);
  private timezoneService = inject(TimezoneService);
  private snackBar = inject(MatSnackBar);
  private auth = inject(Auth);
  private dialogRef = inject(MatDialogRef<TutorEditDialogComponent>);
  public data = inject<TutorEditDialogData>(MAT_DIALOG_DATA);

  tutorForm!: FormGroup;
  availableLanguages: Language[] = [];
  availableCountries: {code: string; name: string}[] = []; // ✅ NUEVO: Propiedad en lugar de getter
  availableStates: InstitutionState[] = [];
  experienceLevels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  isLoading = false;

  // ✅ NUEVO: Propiedades para manejo de timezones
  showManualTimezone = false;
  availableTimezones: {timezone: string; display_name: string; utc_offset: string; dst_aware: boolean}[] = [];
  selectedLocationHasMultipleTimezones = false;

  constructor() {
    // Constructor simplificado - logging reducido para mejor performance
    console.log('🔧 TutorEditDialog: Iniciado');
  }

  ngOnInit(): void {
    try {
      console.log('🔧 TutorEditDialog: Iniciando');
      
      this.initializeForm();
      this.loadLanguages();
      this.loadCountries();
      
      // Cargar idiomas del tutor al final para evitar problemas de timing
      setTimeout(() => {
        this.loadExistingTutorLanguages();
      }, 100);
      
      console.log('✅ TutorEditDialog: Inicializado correctamente');
    } catch (error) {
      console.error('🚨 Error en ngOnInit del TutorEditDialog:', error);
    }
  }

  private initializeForm(): void {
    try {
      const tutor = this.data.tutor || {} as Partial<Tutor>; // Use empty object with Tutor type if null
      
      // Convertir birth_date de Timestamp a Date si es necesario
      let birthDate: Date | null = null;
      if (tutor.birth_date) {
        try {
          // Si es un Timestamp de Firebase, convertirlo a Date
          if (typeof (tutor.birth_date as unknown as {toDate?: () => Date}).toDate === 'function') {
            birthDate = (tutor.birth_date as unknown as {toDate: () => Date}).toDate();
          } else if (tutor.birth_date instanceof Date) {
            birthDate = tutor.birth_date;
          } else if (typeof tutor.birth_date === 'string') {
            birthDate = new Date(tutor.birth_date);
          }
        } catch (error) {
          console.warn('Error converting birth_date:', error);
          // Si hay error, intentar convertir como string o usar Date actual
          if (typeof tutor.birth_date === 'string') {
            birthDate = new Date(tutor.birth_date);
          }
        }
      }
      
      this.tutorForm = this.fb.group({
        // Información básica
        basicInfo: this.fb.group({
          full_name: [tutor.full_name || '', [Validators.required]],
          phone: [tutor.phone || ''],
          birth_date: [birthDate],
          country: [tutor.country || '', [Validators.required]],
          state: [tutor.state || ''], // Campo opcional para estado/provincia
          birth_language: [tutor.birth_language || ''],
          photo_url: [tutor.photo_url || ''],
          timezone: [tutor.timezone || ''] // ✅ NUEVO: Movido desde professionalInfo
        }),
        
        // Información profesional
        professionalInfo: this.fb.group({
          experience_level: [tutor.experience_level || '', [Validators.required]],
          hourly_rate: [tutor.hourly_rate || null, [Validators.required, Validators.min(1)]],
          hourly_rate_currency: [tutor.hourly_rate_currency || 'USD'],
          max_hours_per_week: [tutor.max_hours_per_week || null, [Validators.required, Validators.min(1)]],
          bio: [tutor.bio || ''],
          linkedin_profile: [tutor.linkedin_profile || '']
        }),
        
        // Idiomas (array dinámico)
        languages: this.fb.array([])
      });

      // Inicializar arrays dinámicos
      this.initializeLanguages();

      // Setup country/state watchers
      this.setupLocationWatchers();
      
    } catch (error) {
      console.error('🚨 TutorEditDialog: Error en initializeForm:', error);
      throw error; // Re-lanzar el error para que se capture en ngOnInit
    }
  }

  private loadLanguages(): void {
    try {
      this.languageService.getAllLanguages().subscribe({
        next: (languages) => {
          this.availableLanguages = languages;
        },
        error: (error) => {
          console.error('🚨 TutorEditDialog: Error cargando idiomas:', error);
          this.availableLanguages = []; // Fallback a array vacío
        }
      });
    } catch (error) {
      console.error('🚨 TutorEditDialog: Error en loadLanguages:', error);
      this.availableLanguages = []; // Fallback a array vacío
    }
  }

  private loadCountries(): void {
    try {
      // Cargar países disponibles de forma síncrona
      try {
        const countries = this.locationService.getCountries();
        if (countries && Array.isArray(countries)) {
          this.availableCountries = countries;
        } else {
          console.warn('🚨 TutorEditDialog: getCountries() no devolvió un array válido:', countries);
          this.availableCountries = [];
        }
      } catch (countriesError) {
        console.error('🚨 TutorEditDialog: Error obteniendo países:', countriesError);
        this.availableCountries = [];
      }
      
      // Cargar estados si ya hay un país seleccionado
      const selectedCountry = this.tutorForm.get('basicInfo.country')?.value;
      
      if (selectedCountry) {
        this.loadStatesForCountry(selectedCountry);
      }
      
    } catch (error) {
      console.error('🚨 TutorEditDialog: Error en loadCountries:', error);
      this.availableCountries = []; // Fallback a array vacío
    }
  }

  private loadStatesForCountry(countryCode: string): void {
    try {
      console.log('🔧 TutorEditDialog: Cargando estados para país:', countryCode);
      
      // Usar directamente getCountries() para obtener estados de manera síncrona
      const countries = this.locationService.getCountries();
      const country = countries.find(c => c.code === countryCode);
      
      if (country && country.states) {
        console.log('✅ TutorEditDialog: Estados encontrados:', country.states.length);
        this.availableStates = country.states;
      } else {
        console.log('� TutorEditDialog: No hay estados para este país:', countryCode);
        this.availableStates = [];
      }
    } catch (error) {
      console.error('🚨 TutorEditDialog: Error en loadStatesForCountry:', error);
      this.availableStates = []; // Fallback a array vacío
    }
  }

  private setupLocationWatchers(): void {
    try {
      console.log('🔧 Configurando watchers de ubicación...');
      
      // Observar cambios en el país para actualizar estados y timezone
      this.tutorForm.get('basicInfo.country')?.valueChanges.subscribe(countryCode => {
        console.log('🔧 País cambiado a:', countryCode);
        
        if (countryCode) {
          this.loadStatesForCountry(countryCode);
          
          // Limpiar el estado seleccionado si el nuevo país no tiene estados
          const countries = this.locationService.getCountries();
          const country = countries.find(c => c.code === countryCode);
          const hasStates = !!(country?.states && country.states.length > 0);
          
          if (!hasStates) {
            console.log('🔧 País no tiene estados, limpiando selección de estado');
            this.tutorForm.get('basicInfo.state')?.setValue('');
          }
          
          // ✅ NUEVO: Actualizar timezone cuando cambia el país
          this.updateTimezoneInfo(countryCode, undefined);
        }
      });

      // ✅ NUEVO: Observar cambios en el estado para actualizar timezone
      this.tutorForm.get('basicInfo.state')?.valueChanges.subscribe(stateCode => {
        console.log('🔧 Estado cambiado a:', stateCode);
        
        const countryCode = this.tutorForm.get('basicInfo.country')?.value;
        if (countryCode) {
          this.updateTimezoneInfo(countryCode, stateCode);
        }
      });
      
      console.log('🔧 Watchers configurados correctamente');
    } catch (error) {
      console.error('🚨 Error configurando watchers:', error);
    }
  }

  // ✅ NUEVO: Método para actualizar la información de timezone
  private updateTimezoneInfo(countryCode: string, stateCode?: string): void {
    try {
      console.log('🔧 Actualizando timezone info para:', { countryCode, stateCode });
      
      if (!countryCode) {
        console.warn('🔧 No se proporcionó código de país');
        return;
      }
      
      console.log('🔧 Verificando si el país es soportado para timezones...');
      if (!this.timezoneService.isCountrySupported(countryCode)) {
        console.warn(`🕐 País ${countryCode} no soportado para timezones`);
        // Limpiar timezone si no es soportado
        this.tutorForm.get('basicInfo.timezone')?.setValue('');
        this.showManualTimezone = false;
        this.availableTimezones = [];
        return;
      }
      
      console.log(`✅ País ${countryCode} es soportado para timezones`);

      const timezonesInfo = this.timezoneService.getTimezonesForLocation(countryCode, stateCode);
      console.log('🔧 Información de timezones obtenida:', timezonesInfo);
      
      if (timezonesInfo) {
        console.log(`🕐 Actualizando timezone para tutor: ${timezonesInfo.timezones}`, timezonesInfo);
        
        this.selectedLocationHasMultipleTimezones = timezonesInfo.multiple_timezones;
        this.availableTimezones = timezonesInfo.timezone_info;
        
        // ✅ NUEVO: Si hay múltiples timezones, mostrar selector manual
        if (timezonesInfo.multiple_timezones) {
          console.log(`🕐 ${countryCode}${stateCode ? '/' + stateCode : ''} tiene múltiples timezones, mostrando selector`);
          this.showManualTimezone = true;
          // No setear automáticamente el timezone, esperar selección manual
          if (!this.tutorForm.get('basicInfo.timezone')?.value) {
            this.tutorForm.get('basicInfo.timezone')?.setValue('');
          }
        } else {
          // Si hay solo una timezone, asignarla automáticamente
          console.log(`🕐 ${countryCode}${stateCode ? '/' + stateCode : ''} tiene una sola timezone: ${timezonesInfo.timezones[0]}`);
          this.showManualTimezone = false;
          this.tutorForm.get('basicInfo.timezone')?.setValue(timezonesInfo.timezones[0]);
        }
      } else {
        console.warn(`🕐 No se encontró información de timezone para ${countryCode}${stateCode ? '/' + stateCode : ''}`);
        this.showManualTimezone = false;
        this.availableTimezones = [];
        this.tutorForm.get('basicInfo.timezone')?.setValue('');
      }
    } catch (error) {
      console.error('🚨 Error actualizando timezone info:', error);
      this.showManualTimezone = false;
      this.availableTimezones = [];
    }
  }

  // ✅ OPTIMIZADO: Propiedad calculada en lugar de método para evitar re-ejecuciones
  get hasStates(): boolean {
    try {
      const selectedCountry = this.tutorForm?.get('basicInfo.country')?.value;
      if (!selectedCountry) {
        return false;
      }
      
      // Usar directamente getCountries() para verificar si tiene estados
      const countries = this.locationService.getCountries();
      const country = countries.find(c => c.code === selectedCountry);
      const hasStates = !!(country?.states && country.states.length > 0);
      
      return hasStates;
    } catch (error) {
      console.error('🚨 TutorEditDialog: Error en hasStates getter:', error);
      return false; // Fallback seguro
    }
  }

  // ✅ NUEVO: Método para verificar si se debe mostrar selector de timezone
  shouldShowTimezoneSelector(): boolean {
    try {
      return this.showManualTimezone && this.availableTimezones && this.availableTimezones.length > 0;
    } catch (error) {
      console.error('🚨 TutorEditDialog: Error en shouldShowTimezoneSelector():', error);
      return false; // Fallback seguro
    }
  }

  // ✅ NUEVO: Método para obtener las opciones de timezone disponibles
  getTimezoneOptions(): {timezone: string; display_name: string; utc_offset: string; dst_aware: boolean}[] {
    try {
      return this.availableTimezones || [];
    } catch (error) {
      console.error('🚨 TutorEditDialog: Error en getTimezoneOptions():', error);
      return []; // Fallback seguro
    }
  }

  // ✅ NUEVO: Método para manejar la selección manual de timezone
  onTimezoneChange(selectedTimezone: string): void {
    console.log(`🕐 Timezone seleccionado manualmente: ${selectedTimezone}`);
    this.tutorForm.get('basicInfo.timezone')?.setValue(selectedTimezone);
  }

  // ✅ NUEVO: Función trackBy para optimizar el rendering de países
  trackByCountryCode(index: number, country: {code: string; name: string}): string {
    return country.code;
  }

  // ✅ NUEVO: Función trackBy para optimizar el rendering de estados
  trackByStateCode(index: number, state: InstitutionState): string {
    return state.code;
  }

  private initializeLanguages(): void {
    // Ya no cargamos idiomas desde this.data.tutor.languages
    // Se cargarán desde la base de datos en loadExistingTutorLanguages()
  }

  private loadExistingTutorLanguages(): void {
    try {
      if (!this.data.tutor || !this.data.tutor.user_id) {
        console.warn('🔧 No hay tutor o user_id disponible, saltando carga de idiomas');
        return;
      }
      
      this.userLanguageService.getLanguagesByTutor(this.data.tutor.user_id).subscribe({
        next: (languages) => {
          try {
            const languagesArray = this.tutorForm.get('languages') as FormArray;
            // Limpiar el array existente
            languagesArray.clear();
            
            // Agregar los idiomas cargados desde la base de datos
            if (languages && languages.length > 0) {
              languages.forEach(lang => {
                languagesArray.push(this.createLanguageGroup({
                  language_id: lang.language_id,
                  level_cefr: lang.is_native ? 'native' : lang.level_cefr, // Si is_native es true, usar 'native' como level
                  is_teaching: lang.is_teaching
                }));
              });
            }
            
          } catch (error) {
            console.error('🚨 Error procesando idiomas del tutor:', error);
          }
        },
        error: (error) => {
          console.error('🚨 Error obteniendo idiomas del tutor:', error);
        }
      });
    } catch (error) {
      console.error('🚨 Error en loadExistingTutorLanguages:', error);
    }
  }

  // Getters para FormArrays
  get languagesArray(): FormArray {
    return this.tutorForm.get('languages') as FormArray;
  }

  // Métodos para crear grupos de formularios
  private createLanguageGroup(language?: Record<string, unknown>): FormGroup {
    return this.fb.group({
      language_id: [(language?.['language_id'] as string) || '', [Validators.required]],
      level_cefr: [(language?.['level_cefr'] as string) || 'A1', [Validators.required]],
      is_teaching: [(language?.['is_teaching'] as boolean) || false]
    });
  }

  // Métodos para agregar elementos a arrays
  addLanguage(): void {
    this.languagesArray.push(this.createLanguageGroup());
  }

  // Métodos para remover elementos de arrays
  removeLanguage(index: number): void {
    this.languagesArray.removeAt(index);
  }

  async onSave(): Promise<void> {
    if (this.tutorForm.valid) {
      this.isLoading = true;
      
      try {
        // Get current user ID
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }

        const formValue = this.tutorForm.value;
        
        // Preparar datos del tutor
        const tutorData: Partial<Tutor> = {
          ...formValue.basicInfo,
          ...formValue.professionalInfo
        };

        // ✅ NUEVO: Generar información de timezone basada en país/estado
        const timezonesInfo = this.timezoneService.getTimezonesForLocation(
          formValue.basicInfo.country, 
          formValue.basicInfo.state
        );

        if (timezonesInfo) {
          tutorData.timezone = timezonesInfo.timezones[0]; // TODO: Introducir aqui la logica de un elemento en caso de que un pais/estado tenga multiples zonas horarias
          console.log('🕐 Información de timezone agregada al tutor:', timezonesInfo);
        }

        let tutorUserId: string;

        if (this.data.tutor) {
          // Actualizar tutor existente
          tutorUserId = this.data.tutor.user_id;
          await this.tutorService.updateTutor(tutorUserId, tutorData);
          this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', {
            duration: 3000
          });
        } else {
          // Crear nuevo tutor - incluir user_id
          const newTutorData = {
            ...tutorData,
            user_id: currentUser.uid
          } as Tutor;
          
          tutorUserId = currentUser.uid;
          await this.tutorService.createTutor(newTutorData);
          this.snackBar.open('Perfil de tutor creado exitosamente', 'Cerrar', {
            duration: 3000
          });
        }

        // Actualizar idiomas del tutor
        await this.updateTutorLanguages(tutorUserId, formValue.languages);

        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error saving tutor profile:', error);
        const message = this.data.tutor ? 'Error al actualizar el perfil' : 'Error al crear el perfil';
        this.snackBar.open(message, 'Cerrar', {
          duration: 3000
        });
      } finally {
        this.isLoading = false;
      }
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private async updateTutorLanguages(tutorUserId: string, languages: {
    language_id: string;
    level_cefr: string;
    is_teaching: boolean;
  }[]): Promise<void> {
    try {
      // Eliminar todos los idiomas existentes del tutor
      await this.userLanguageService.removeAllLanguagesForTutor(tutorUserId);

      // Agregar los nuevos idiomas configurados
      const languagePromises = languages.map(lang => 
        this.userLanguageService.createUserLanguage({
          user_id: tutorUserId, // Usar user_id en lugar de tutor_id
          language_id: lang.language_id,
          level_cefr: lang.level_cefr as LevelCEFR, // Hacer cast al tipo correcto
          is_native: lang.level_cefr === 'native', // Determinar is_native basándose en level_cefr
          is_teaching: lang.is_teaching || false,
          created_at: Timestamp.now() // Agregar created_at con el timestamp actual
        })
      );

      await Promise.all(languagePromises);
      console.log('✅ Idiomas del tutor actualizados correctamente');
    } catch (error) {
      console.error('❌ Error al actualizar idiomas del tutor:', error);
      throw error;
    }
  }
}
