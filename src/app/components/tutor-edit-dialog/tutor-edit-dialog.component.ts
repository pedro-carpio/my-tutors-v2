import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Auth } from '@angular/fire/auth';
import { TutorService } from '../../services/tutor.service';
import { LanguageService } from '../../services/language.service';
import { I18nService } from '../../services/i18n.service';
import { Language } from '../../types/firestore.types';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-tutor-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './tutor-edit-dialog.component.html',
  styleUrls: ['./tutor-edit-dialog.component.scss']
})
export class TutorEditDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<TutorEditDialogComponent>);
  private tutorService = inject(TutorService);
  private languageService = inject(LanguageService);
  private i18n = inject(I18nService);
  private auth = inject(Auth);

  tutorForm!: FormGroup;
  availableLanguages: Language[] = [];
  weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  experienceLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
  currencies = ['USD', 'EUR', 'COP', 'MXN'];

  ngOnInit() {
    this.loadAvailableLanguages();
    this.initializeForm();
  }

  private loadAvailableLanguages() {
    this.languageService.getAllLanguages().subscribe((languages: Language[]) => {
      this.availableLanguages = languages;
    });
  }

  private initializeForm() {
    this.tutorForm = this.fb.group({
      basicInfo: this.fb.group({
        fullName: ['', Validators.required],
        phone: [''],
        country: [''],
        birthDate: [''],
        birthLanguage: [''],
        photoUrl: ['']
      }),
      professionalInfo: this.fb.group({
        experienceLevel: [''],
        hourlyRate: [0, [Validators.min(0)]],
        currency: ['USD'],
        maxHoursPerWeek: [0, [Validators.min(0)]],
        biography: [''],
        linkedinProfile: [''],
        timezone: ['']
      }),
      languages: this.fb.array([]),
      certifications: this.fb.array([]),
      availability: this.fb.array([])
    });
  }

  get languagesArray(): FormArray {
    return this.tutorForm.get('languages') as FormArray;
  }

  get certificationsArray(): FormArray {
    return this.tutorForm.get('certifications') as FormArray;
  }

  get availabilityArray(): FormArray {
    return this.tutorForm.get('availability') as FormArray;
  }

  addLanguage() {
    const languageGroup = this.fb.group({
      language: ['', Validators.required],
      level: ['', Validators.required]
    });
    this.languagesArray.push(languageGroup);
  }

  removeLanguage(index: number) {
    this.languagesArray.removeAt(index);
  }

  addCertification() {
    const certificationGroup = this.fb.group({
      name: ['', Validators.required],
      issuer: ['']
    });
    this.certificationsArray.push(certificationGroup);
  }

  removeCertification(index: number) {
    this.certificationsArray.removeAt(index);
  }

  addAvailability() {
    const availabilityGroup = this.fb.group({
      weekDay: ['', Validators.required],
      hours: ['', Validators.required]
    });
    this.availabilityArray.push(availabilityGroup);
  }

  removeAvailability(index: number) {
    this.availabilityArray.removeAt(index);
  }

  // Helper method to get localized language name
  getLocalizedLanguageName(language: Language): string {
    return this.languageService.getLocalizedLanguageName(language);
  }

  async onSave(): Promise<void> {
    if (this.tutorForm.valid) {
      try {
        // Get current user ID
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }

        const formData = this.tutorForm.value;
        await this.tutorService.updateTutor(currentUser.uid, formData);
        this.dialogRef.close(true);
      } catch (error: unknown) {
        console.error('Error updating tutor profile:', error);
      }
    }
  }

  onCancel() {
    this.dialogRef.close(false);
  }
}
