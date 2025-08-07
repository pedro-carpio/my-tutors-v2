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
import { MatStepperModule } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Auth } from '@angular/fire/auth';
import { InstitutionService } from '../../../../../services/institution.service';
import { Institution } from '../../../../../types/firestore.types';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';

export interface InstitutionEditDialogData {
  institution: Institution;
}

@Component({
  selector: 'app-institution-edit-dialog',
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
    MatStepperModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './institution-edit-dialog.component.html',
  styleUrl: './institution-edit-dialog.component.scss'
})
export class InstitutionEditDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private institutionService = inject(InstitutionService);
  private snackBar = inject(MatSnackBar);
  private auth = inject(Auth);
  private dialogRef = inject(MatDialogRef<InstitutionEditDialogComponent>);
  public data = inject<InstitutionEditDialogData>(MAT_DIALOG_DATA);

  institutionForm!: FormGroup;
  availableLanguages: string[] = [
    'Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués',
    'Chino', 'Japonés', 'Coreano', 'Árabe', 'Ruso', 'Holandés'
  ];
  isLoading = false;

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const institution = this.data.institution;
    
    this.institutionForm = this.fb.group({
      // Información básica
      basicInfo: this.fb.group({
        name: [institution.name || '', [Validators.required]],
        country: [institution.country || '', [Validators.required]],
        phone: [institution.phone || '', [Validators.required]],
        contact_email: [institution.contact_email || ''],
        website_url: [institution.website_url || ''],
        contact_person: [institution.contact_person || ''],
        address: [institution.address || ''],
        logo_url: [institution.logo_url || '']
      }),
      
      // Descripción y servicios
      services: this.fb.group({
        description: [institution.description || ''],
        subscription_plan: [institution.subscription_plan || ''],
        max_tutors: [institution.max_tutors || null],
        max_students: [institution.max_students || null]
      }),
      
      // Idiomas ofrecidos (array dinámico)
      languages_offered: this.fb.array([])
    });

    // Inicializar idiomas ofrecidos
    this.initializeLanguagesOffered();
    
    // Debug: Log form status
    this.institutionForm.statusChanges.subscribe(status => {
      console.log('Form status changed:', status);
      console.log('Basic info errors:', this.institutionForm.get('basicInfo')?.errors);
      console.log('Services errors:', this.institutionForm.get('services')?.errors);
    });
  }

  private initializeLanguagesOffered(): void {
    const languagesArray = this.institutionForm.get('languages_offered') as FormArray;
    if (this.data.institution.languages_offered) {
      this.data.institution.languages_offered.forEach(language => {
        languagesArray.push(this.fb.control(language, [Validators.required]));
      });
    }
  }

  // Getter para FormArray de idiomas
  get languagesOfferedArray(): FormArray {
    return this.institutionForm.get('languages_offered') as FormArray;
  }

  // Getter para verificar si el formulario es válido
  get isFormValid(): boolean {
    const basicInfoValid = this.institutionForm.get('basicInfo')?.valid ?? false;
    const servicesValid = this.institutionForm.get('services')?.valid ?? false;
    // Los idiomas son opcionales, pero si hay alguno, debe ser válido
    const languagesValid = this.languagesOfferedArray.length === 0 || this.languagesOfferedArray.valid;
    
    console.log('Form validation:', { basicInfoValid, servicesValid, languagesValid, languagesLength: this.languagesOfferedArray.length });
    
    return basicInfoValid && servicesValid && languagesValid;
  }

  // Métodos para gestionar idiomas
  addLanguage(): void {
    this.languagesOfferedArray.push(this.fb.control('', [Validators.required]));
  }

  removeLanguage(index: number): void {
    this.languagesOfferedArray.removeAt(index);
  }

  async onSave(): Promise<void> {
    if (this.isFormValid) {
      this.isLoading = true;
      
      try {
        // Get current user ID
        const currentUser = this.auth.currentUser;
        if (!currentUser) {
          throw new Error('Usuario no autenticado');
        }

        const formValue = this.institutionForm.value;
        
        // Preparar datos de la institución
        const institutionData: Partial<Institution> = {
          ...formValue.basicInfo,
          ...formValue.services,
          languages_offered: formValue.languages_offered.filter((lang: string) => lang.trim() !== '')
        };

        // Actualizar institución usando el ID real del usuario
        await this.institutionService.updateInstitution(currentUser.uid, institutionData);

        this.snackBar.open('Perfil actualizado exitosamente', 'Cerrar', {
          duration: 3000
        });

        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error updating institution profile:', error);
        this.snackBar.open('Error al actualizar el perfil', 'Cerrar', {
          duration: 3000
        });
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log('Form is invalid:', {
        basicInfo: this.institutionForm.get('basicInfo')?.errors,
        services: this.institutionForm.get('services')?.errors,
        languages: this.languagesOfferedArray.errors
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Debug method - remove in production
  debugFormState(): void {
    console.log('=== FORM DEBUG STATE ===');
    console.log('Form valid:', this.institutionForm.valid);
    console.log('Form value:', this.institutionForm.value);
    console.log('Form errors:', this.institutionForm.errors);
    
    console.log('Basic Info valid:', this.institutionForm.get('basicInfo')?.valid);
    console.log('Basic Info errors:', this.institutionForm.get('basicInfo')?.errors);
    console.log('Basic Info value:', this.institutionForm.get('basicInfo')?.value);
    
    console.log('Services valid:', this.institutionForm.get('services')?.valid);
    console.log('Services errors:', this.institutionForm.get('services')?.errors);
    console.log('Services value:', this.institutionForm.get('services')?.value);
    
    console.log('Languages valid:', this.languagesOfferedArray.valid);
    console.log('Languages errors:', this.languagesOfferedArray.errors);
    console.log('Languages value:', this.languagesOfferedArray.value);
    console.log('Languages length:', this.languagesOfferedArray.length);
    
    console.log('isFormValid getter:', this.isFormValid);
    console.log('=== END DEBUG ===');
  }
}
