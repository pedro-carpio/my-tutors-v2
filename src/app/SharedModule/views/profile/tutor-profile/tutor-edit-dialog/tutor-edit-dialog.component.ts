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
import { Tutor, ExperienceLevel, Language, UserLanguage, LevelCEFR } from '../../../../../types/firestore.types';
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
  private snackBar = inject(MatSnackBar);
  private auth = inject(Auth);
  private dialogRef = inject(MatDialogRef<TutorEditDialogComponent>);
  public data = inject<TutorEditDialogData>(MAT_DIALOG_DATA);

  tutorForm!: FormGroup;
  availableLanguages: Language[] = [];
  experienceLevels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  isLoading = false;

  ngOnInit(): void {
    this.initializeForm();
    this.loadLanguages();
    this.loadExistingTutorLanguages();
  }

  private initializeForm(): void {
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
        birth_language: [tutor.birth_language || ''],
        photo_url: [tutor.photo_url || '']
      }),
      
      // Información profesional
      professionalInfo: this.fb.group({
        experience_level: [tutor.experience_level || '', [Validators.required]],
        hourly_rate: [tutor.hourly_rate || null, [Validators.required, Validators.min(1)]],
        hourly_rate_currency: [tutor.hourly_rate_currency || 'USD'],
        max_hours_per_week: [tutor.max_hours_per_week || null, [Validators.required, Validators.min(1)]],
        bio: [tutor.bio || ''],
        linkedin_profile: [tutor.linkedin_profile || ''],
        timezone: [tutor.timezone || '']
      }),
      
      // Idiomas (array dinámico)
      languages: this.fb.array([])
    });

    // Inicializar arrays dinámicos
    this.initializeLanguages();
  }

  private loadLanguages(): void {
    this.languageService.getAllLanguages().subscribe(languages => {
      this.availableLanguages = languages;
    });
  }

  private initializeLanguages(): void {
    // Ya no cargamos idiomas desde this.data.tutor.languages
    // Se cargarán desde la base de datos en loadExistingTutorLanguages()
  }

  private loadExistingTutorLanguages(): void {
    if (this.data.tutor) {
      this.userLanguageService.getLanguagesByTutor(this.data.tutor.user_id).subscribe(languages => {
        const languagesArray = this.tutorForm.get('languages') as FormArray;
        // Limpiar el array existente
        languagesArray.clear();
        
        // Agregar los idiomas cargados desde la base de datos
        languages.forEach(lang => {
          languagesArray.push(this.createLanguageGroup({
            language_id: lang.language_id,
            level_cefr: lang.is_native ? 'native' : lang.level_cefr, // Si is_native es true, usar 'native' como level
            is_teaching: lang.is_teaching
          }));
        });
      });
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
