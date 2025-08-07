import { Component, inject, Inject, OnInit } from '@angular/core';
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
import { TutorService } from '../../../../../services/tutor.service';
import { LanguageService } from '../../../../../services/language.service';
import { UserLanguageService } from '../../../../../services/tutor-language.service';
import { Tutor, ExperienceLevel, Language } from '../../../../../types/firestore.types';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';

export interface TutorEditDialogData {
  tutor: Tutor;
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

  tutorForm!: FormGroup;
  availableLanguages: Language[] = [];
  experienceLevels: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  isLoading = false;

  constructor(
    private dialogRef: MatDialogRef<TutorEditDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: TutorEditDialogData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadLanguages();
  }

  private initializeForm(): void {
    const tutor = this.data.tutor;
    
    this.tutorForm = this.fb.group({
      // Información básica
      basicInfo: this.fb.group({
        full_name: [tutor.full_name, [Validators.required]],
        phone: [tutor.phone],
        birth_date: [tutor.birth_date],
        country: [tutor.country, [Validators.required]],
        birth_language: [tutor.birth_language],
        photo_url: [tutor.photo_url]
      }),
      
      // Información profesional
      professionalInfo: this.fb.group({
        experience_level: [tutor.experience_level, [Validators.required]],
        hourly_rate: [tutor.hourly_rate, [Validators.required, Validators.min(1)]],
        hourly_rate_currency: [tutor.hourly_rate_currency || 'USD'],
        max_hours_per_week: [tutor.max_hours_per_week, [Validators.required, Validators.min(1)]],
        bio: [tutor.bio],
        linkedin_profile: [tutor.linkedin_profile],
        timezone: [tutor.timezone]
      }),
      
      // Idiomas (array dinámico)
      languages: this.fb.array([]),
      
      // Certificaciones (array dinámico)
      certifications: this.fb.array([]),
      
      // Disponibilidad (array dinámico)
      availability: this.fb.array([])
    });

    // Inicializar arrays dinámicos
    this.initializeLanguages();
    this.initializeCertifications();
    this.initializeAvailability();
  }

  private loadLanguages(): void {
    this.languageService.getAllLanguages().subscribe(languages => {
      this.availableLanguages = languages;
    });
  }

  private initializeLanguages(): void {
    const languagesArray = this.tutorForm.get('languages') as FormArray;
    if (this.data.tutor.languages) {
      this.data.tutor.languages.forEach(lang => {
        languagesArray.push(this.createLanguageGroup(lang));
      });
    }
  }

  private initializeCertifications(): void {
    const certificationsArray = this.tutorForm.get('certifications') as FormArray;
    if (this.data.tutor.certifications) {
      this.data.tutor.certifications.forEach(cert => {
        certificationsArray.push(this.createCertificationGroup(cert));
      });
    }
  }

  private initializeAvailability(): void {
    const availabilityArray = this.tutorForm.get('availability') as FormArray;
    if (this.data.tutor.availability) {
      this.data.tutor.availability.forEach(avail => {
        availabilityArray.push(this.createAvailabilityGroup(avail));
      });
    }
  }

  // Getters para FormArrays
  get languagesArray(): FormArray {
    return this.tutorForm.get('languages') as FormArray;
  }

  get certificationsArray(): FormArray {
    return this.tutorForm.get('certifications') as FormArray;
  }

  get availabilityArray(): FormArray {
    return this.tutorForm.get('availability') as FormArray;
  }

  // Métodos para crear grupos de formularios
  private createLanguageGroup(language?: any): FormGroup {
    return this.fb.group({
      language_id: [language?.language_id || '', [Validators.required]],
      level_cefr: [language?.level_cefr || 'A1', [Validators.required]],
      is_native: [language?.is_native || false],
      is_teaching: [language?.is_teaching || true]
    });
  }

  private createCertificationGroup(certification?: any): FormGroup {
    return this.fb.group({
      name: [certification?.name || '', [Validators.required]],
      issuer: [certification?.issuer || ''],
      issue_date: [certification?.issue_date || null],
      expiry_date: [certification?.expiry_date || null],
      credential_id: [certification?.credential_id || '']
    });
  }

  private createAvailabilityGroup(availability?: any): FormGroup {
    return this.fb.group({
      week_day: [availability?.week_day || '', [Validators.required]],
      hours: [availability?.hours?.join(',') || '', [Validators.required]],
      timezone: [availability?.timezone || '']
    });
  }

  // Métodos para agregar elementos a arrays
  addLanguage(): void {
    this.languagesArray.push(this.createLanguageGroup());
  }

  addCertification(): void {
    this.certificationsArray.push(this.createCertificationGroup());
  }

  addAvailability(): void {
    this.availabilityArray.push(this.createAvailabilityGroup());
  }

  // Métodos para remover elementos de arrays
  removeLanguage(index: number): void {
    this.languagesArray.removeAt(index);
  }

  removeCertification(index: number): void {
    this.certificationsArray.removeAt(index);
  }

  removeAvailability(index: number): void {
    this.availabilityArray.removeAt(index);
  }

  async onSave(): Promise<void> {
    if (this.tutorForm.valid) {
      this.isLoading = true;
      
      try {
        const formValue = this.tutorForm.value;
        
        // Preparar datos del tutor
        const tutorData: Partial<Tutor> = {
          ...formValue.basicInfo,
          ...formValue.professionalInfo
        };

        // Procesar disponibilidad
        if (formValue.availability?.length > 0) {
          tutorData.availability = formValue.availability.map((avail: any) => ({
            ...avail,
            hours: avail.hours.split(',').map((h: string) => parseInt(h.trim())).filter((h: number) => !isNaN(h))
          }));
        }

        // Actualizar tutor
        await this.tutorService.updateTutor(this.data.tutor.user_id, tutorData);

        // TODO: Actualizar idiomas y certificaciones en sus respectivos servicios

        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', {
          duration: 3000
        });

        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error updating tutor:', error);
        this.snackBar.open('Error al actualizar el perfil', 'Cerrar', {
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
}
