import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PostulantService } from '../../../../../services/postulant.service';
import { Postulant, TeachingCertification, LanguageCertification, Reference } from '../../../../../types/firestore.types';
import { ShareFormDialogComponent } from './share-form-dialog/share-form-dialog.component';

@Component({
  selector: 'app-tutor-postulation-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './tutor.component.html',
  styleUrl: './tutor.component.scss'
})
export class TutorPostulationFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private postulantService = inject(PostulantService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);

  currentPostulantId: string | null = null;
  hasSent: boolean = false;
  isLoading: boolean = false;

  // Formularios para cada paso
  step1Form: FormGroup = this.fb.group({
    full_name: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(200)]],
    phone: ['', [Validators.required, Validators.maxLength(20)]],
    has_whatsapp: [false],
    country: ['', Validators.required],
    linkedin_profile: ['', Validators.maxLength(200)]
  });

  step2Form: FormGroup = this.fb.group({
    native_language: ['', [Validators.required, Validators.maxLength(100)]],
    other_languages: this.fb.array([]),
    teaching_certifications: this.fb.array([]),
    language_certifications: this.fb.array([]),
    has_dialectal_variant: [false],
    dialectal_variant: ['']
  });

  step3Form: FormGroup = this.fb.group({
    knows_cervantes_education: [false],
    methodology_description: ['', Validators.maxLength(200)],
    adaptive_material_link: ['', Validators.maxLength(2083)],
    class_adaptation_description: ['', [Validators.required, Validators.maxLength(300)]]
  });

  step4Form: FormGroup = this.fb.group({
    teaching_experience_amount: [null, [Validators.required, Validators.max(70000)]],
    teaching_experience_unit: ['hours', Validators.required],
    references: this.fb.array([]),
    has_portfolio: [false],
    portfolio_link: ['', Validators.maxLength(200)],
    has_recorded_class: [false],
    recorded_class_link: ['', Validators.maxLength(2040)],
    has_curriculum: [false],
    curriculum_link: ['', Validators.maxLength(200)]
  });

  step5Form: FormGroup = this.fb.group({
    knows_zoom: [false],
    knows_airtm: [false],
    knows_crypto_platform: [false],
    crypto_platform_name: ['', Validators.maxLength(200)],
    has_hd_equipment: [false],
    internet_speed_test_link: ['', [Validators.required, Validators.maxLength(100)]],
    weekly_availability_description: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(300)]],
    hourly_rate_amount: [null, [Validators.required, Validators.max(1000)]],
    hourly_rate_currency: ['', Validators.required]
  });

  countries = [
    'Bolivia',
    'Peru', 
    'Ecuador',
    'España',
    'Otro'
  ];

  experienceUnits = [
    { value: 'hours', label: 'Horas' },
    { value: 'years', label: 'Años' }
  ];

  currencies = [
    'Bolivianos',
    'Dólares estadounidenses', 
    'Soles',
    'Euros'
  ];

  ngOnInit(): void {
    // Verificar si hay un UID en los parámetros de la URL
    this.route.queryParams.subscribe(params => {
      const uid = params['uid'];
      if (uid) {
        this.currentPostulantId = uid;
        this.loadPostulantData(uid);
      }
    });
  }

  private async loadPostulantData(postulantId: string): Promise<void> {
    this.isLoading = true;
    this.resetFormArrays();
    try {
      this.postulantService.getPostulantById(postulantId).subscribe({
        next: (postulant) => {
          if (postulant?.temporal) {
            this.populateFormsWithData(postulant);
          } else if (!postulant?.temporal) {
            this.hasSent = true;
          } else {
            this.snackBar.open('Los datos ya no están disponibles', 'Cerrar', { duration: 3000 });
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading postulant data:', error);
          this.snackBar.open('Error al cargar los datos guardados', 'Cerrar', { duration: 3000 });
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error loading postulant data:', error);
      this.snackBar.open('Error al cargar los datos guardados', 'Cerrar', { duration: 3000 });
      this.isLoading = false;
    }
  }

  private populateFormsWithData(postulant: Postulant): void {
    // Llenar Step 1
    this.step1Form.patchValue({
      full_name: postulant.full_name || '',
      email: postulant.email || '',
      phone: postulant.phone || '',
      has_whatsapp: postulant.has_whatsapp || false,
      country: postulant.country || '',
      linkedin_profile: postulant.linkedin_profile || ''
    });

    // Llenar Step 2
    this.step2Form.patchValue({
      native_language: postulant.native_language || '',
      has_dialectal_variant: postulant.has_dialectal_variant || false,
      dialectal_variant: postulant.dialectal_variant || ''
    });

    // Llenar arrays dinámicos
    if (postulant.other_languages) {
      postulant.other_languages.forEach(lang => this.addOtherLanguage(lang));
    }
    if (postulant.teaching_certifications) {
      postulant.teaching_certifications.forEach(cert => this.addTeachingCertification(cert));
    }
    if (postulant.language_certifications) {
      postulant.language_certifications.forEach(cert => this.addLanguageCertification(cert));
    }

    // Llenar Step 3
    this.step3Form.patchValue({
      knows_cervantes_education: postulant.knows_cervantes_education || false,
      methodology_description: postulant.methodology_description || '',
      adaptive_material_link: postulant.adaptive_material_link || '',
      class_adaptation_description: postulant.class_adaptation_description || ''
    });

    // Llenar Step 4
    this.step4Form.patchValue({
      teaching_experience_amount: postulant.teaching_experience_amount || null,
      teaching_experience_unit: postulant.teaching_experience_unit || 'hours',
      has_portfolio: postulant.has_portfolio || false,
      portfolio_link: postulant.portfolio_link || '',
      recorded_class_link: postulant.recorded_class_link || '',
      has_curriculum: postulant.has_curriculum || false,
      curriculum_link: postulant.curriculum_link || ''
    });

    if (postulant.references) {
      postulant.references.forEach(ref => this.addReference(ref));
    }

    // Llenar Step 5
    this.step5Form.patchValue({
      knows_zoom: postulant.knows_zoom || false,
      knows_airtm: postulant.knows_airtm || false,
      knows_crypto_platform: postulant.knows_crypto_platform || false,
      crypto_platform_name: postulant.crypto_platform_name || '',
      has_hd_equipment: postulant.has_hd_equipment || false,
      internet_speed_test_link: postulant.internet_speed_test_link || '',
      weekly_availability_description: postulant.weekly_availability_description || '',
      hourly_rate_amount: postulant.hourly_rate_amount || null,
      hourly_rate_currency: postulant.hourly_rate_currency || ''
    });
  }

  // Getters para FormArrays
  get otherLanguagesFormArray(): FormArray {
    return this.step2Form.get('other_languages') as FormArray;
  }

  get teachingCertificationsFormArray(): FormArray {
    return this.step2Form.get('teaching_certifications') as FormArray;
  }

  get languageCertificationsFormArray(): FormArray {
    return this.step2Form.get('language_certifications') as FormArray;
  }

  get referencesFormArray(): FormArray {
    return this.step4Form.get('references') as FormArray;
  }

  resetFormArrays(): void {
    this.otherLanguagesFormArray.clear();
    this.teachingCertificationsFormArray.clear();
    this.languageCertificationsFormArray.clear();
    this.referencesFormArray.clear();
  }

  // Métodos para otros idiomas
  addOtherLanguage(value: string = ''): void {
    this.otherLanguagesFormArray.push(this.fb.control(value, [Validators.required, Validators.maxLength(100)]));
  }

  removeOtherLanguage(index: number): void {
    this.otherLanguagesFormArray.removeAt(index);
  }

  // Métodos para certificaciones de enseñanza
  createTeachingCertificationGroup(cert?: TeachingCertification): FormGroup {
    return this.fb.group({
      name: [cert?.name || '', [Validators.required, Validators.maxLength(200)]],
      description: [cert?.description || '', [Validators.required, Validators.maxLength(300)]],
      link: [cert?.link || '', Validators.maxLength(200)]
    });
  }

  addTeachingCertification(cert?: TeachingCertification): void {
    this.teachingCertificationsFormArray.push(this.createTeachingCertificationGroup(cert));
  }

  removeTeachingCertification(index: number): void {
    this.teachingCertificationsFormArray.removeAt(index);
  }

  // Métodos para certificaciones de idioma
  createLanguageCertificationGroup(cert?: LanguageCertification): FormGroup {
    return this.fb.group({
      name: [cert?.name || '', [Validators.required, Validators.maxLength(200)]],
      link: [cert?.link || '', Validators.maxLength(200)]
    });
  }

  addLanguageCertification(cert?: LanguageCertification): void {
    this.languageCertificationsFormArray.push(this.createLanguageCertificationGroup(cert));
  }

  removeLanguageCertification(index: number): void {
    this.languageCertificationsFormArray.removeAt(index);
  }

  // Métodos para referencias
  createReferenceGroup(ref?: Reference): FormGroup {
    return this.fb.group({
      name: [ref?.name || '', [Validators.required, Validators.maxLength(200)]],
      contact: [ref?.contact || '', [Validators.required, Validators.maxLength(200)]]
    });
  }

  addReference(ref?: Reference): void {
    this.referencesFormArray.push(this.createReferenceGroup(ref));
  }

  removeReference(index: number): void {
    this.referencesFormArray.removeAt(index);
  }

  // Método para guardar y compartir
  async saveAndShare(): Promise<void> {
    this.isLoading = true;
    try {
      const postulantData = this.getFormData();
      postulantData.temporal = true; // Marcar como temporal para guardar
      let postulantId: string;
      if (this.currentPostulantId) {
        await this.postulantService.updatePostulant(this.currentPostulantId, postulantData);
        postulantId = this.currentPostulantId;
      } else {
        postulantId = await this.postulantService.createPostulant(postulantData);
        this.currentPostulantId = postulantId;
      }

      // Abrir dialog para compartir
      this.dialog.open(ShareFormDialogComponent, {
        width: '500px',
        data: { postulantId }
      });

    } catch (error) {
      console.error('Error saving postulant:', error);
      this.snackBar.open('Error al guardar la postulación', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  private getFormData(): Postulant {
    return {
      // Step 1
      ...this.step1Form.value,
      // Step 2
      ...this.step2Form.value,
      // Step 3
      ...this.step3Form.value,
      // Step 4
      ...this.step4Form.value,
      // Step 5
      ...this.step5Form.value
    };
  }

  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('email')) {
      return 'El email no tiene un formato válido';
    }
    if (control?.hasError('maxlength')) {
      return `Máximo ${control.getError('maxlength')?.requiredLength} caracteres`;
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.getError('minlength')?.requiredLength} caracteres`;
    }
    if (control?.hasError('max')) {
      return `Valor máximo: ${control.getError('max')?.max}`;
    }
    return '';
  }

  getArrayErrorMessage(formArray: FormArray, index: number, fieldName: string): string {
    const control = formArray.at(index).get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('maxlength')) {
      return `Máximo ${control.getError('maxlength')?.requiredLength} caracteres`;
    }
    return '';
  }

  async completePostulation(): Promise<void> {
    this.isLoading = true;
    try {
      const postulantData = this.getFormData();
      postulantData.temporal = false; // Marcar como no temporal al completar
      if (this.currentPostulantId) {
        await this.postulantService.updatePostulant(this.currentPostulantId, {temporal: false});
      }
      await this.postulantService.createPostulantFinished(postulantData);

      this.hasSent = true;
      this.snackBar.open('Postulación completada exitosamente', 'Cerrar', { duration: 3000 }); 
    } catch (error) {
      console.error('Error saving postulant:', error);
      this.snackBar.open('Error al completar la postulación', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
    }
  }

  startNewPostulation(): void {
    this.hasSent = false;
    this.currentPostulantId = null;
    
    // Resetear todos los formularios
    this.step1Form.reset({
      has_whatsapp: false,
      linkedin_profile: ''
    });
    
    this.step2Form.reset({
      has_dialectal_variant: false,
      dialectal_variant: ''
    });
    
    this.step3Form.reset({
      knows_cervantes_education: false,
      methodology_description: '',
      adaptive_material_link: '',
      class_adaptation_description: ''
    });
    
    this.step4Form.reset({
      teaching_experience_unit: 'hours',
      has_portfolio: false,
      portfolio_link: '',
      has_recorded_class: false,
      recorded_class_link: '',
      has_curriculum: false,
      curriculum_link: ''
    });
    
    this.step5Form.reset({
      knows_zoom: false,
      knows_airtm: false,
      knows_crypto_platform: false,
      crypto_platform_name: '',
      has_hd_equipment: false,
      hourly_rate_currency: ''
    });

    // Limpiar todos los FormArrays
    this.resetFormArrays();
  }
}
