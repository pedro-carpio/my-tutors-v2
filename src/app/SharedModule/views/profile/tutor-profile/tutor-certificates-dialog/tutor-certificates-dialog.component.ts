import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TranslatePipe } from '../../../../../pipes/translate.pipe';
import { LanguageService } from '../../../../../services/language.service';
import { TutorService } from '../../../../../services/tutor.service';
import { 
  Tutor, 
  TeachingCertification, 
  LanguageCertification, 
  Language,
  LevelCEFR 
} from '../../../../../types/firestore.types';

export interface TutorCertificatesDialogData {
  tutor: Tutor;
  teachingCertifications: TeachingCertification[];
  languageCertifications: LanguageCertification[];
}

@Component({
  selector: 'app-tutor-certificates-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCardModule,
    MatDatepickerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './tutor-certificates-dialog.component.html',
  styleUrl: './tutor-certificates-dialog.component.scss'
})
export class TutorCertificatesDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private tutorService = inject(TutorService);
  private languageService = inject(LanguageService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<TutorCertificatesDialogComponent>);
  public data = inject<TutorCertificatesDialogData>(MAT_DIALOG_DATA);

  certificatesForm!: FormGroup;
  availableLanguages: Language[] = [];
  cefrLevels: LevelCEFR[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  isLoading = false;

  // Estados para manejar vista previa de imágenes
  imageLoadingStates = {
    teaching: {} as Record<number, boolean>,
    language: {} as Record<number, boolean>
  };
  
  imageErrorStates = {
    teaching: {} as Record<number, boolean>,
    language: {} as Record<number, boolean>
  };

  ngOnInit(): void {
    console.log('🎓 TutorCertificatesDialog: Inicializando con datos:', this.data);
    this.initializeForm();
    this.loadLanguages();
  }

  private initializeForm(): void {
    this.certificatesForm = this.fb.group({
      teachingCertifications: this.fb.array([]),
      languageCertifications: this.fb.array([])
    });

    // Inicializar certificaciones existentes
    this.initializeTeachingCertifications();
    this.initializeLanguageCertifications();
  }

  private initializeTeachingCertifications(): void {
    const teachingArray = this.teachingCertificationsArray;
    
    // Solo agregar certificaciones si existen datos previos
    if (this.data.teachingCertifications && this.data.teachingCertifications.length > 0) {
      this.data.teachingCertifications.forEach(cert => {
        teachingArray.push(this.createTeachingCertificationGroup(cert));
      });
    }
    // No agregamos certificación vacía por defecto
  }

  private initializeLanguageCertifications(): void {
    const languageArray = this.languageCertificationsArray;
    
    // Solo agregar certificaciones si existen datos previos
    if (this.data.languageCertifications && this.data.languageCertifications.length > 0) {
      this.data.languageCertifications.forEach(cert => {
        languageArray.push(this.createLanguageCertificationGroup(cert));
      });
    }
    // No agregamos certificación vacía por defecto
  }

  private loadLanguages(): void {
    this.languageService.getAllLanguages().subscribe(languages => {
      this.availableLanguages = languages;
      console.log('🌐 TutorCertificatesDialog: Idiomas cargados:', languages.length);
    });
  }

  // Getters para FormArrays
  get teachingCertificationsArray(): FormArray {
    return this.certificatesForm.get('teachingCertifications') as FormArray;
  }

  get languageCertificationsArray(): FormArray {
    return this.certificatesForm.get('languageCertifications') as FormArray;
  }

  // Métodos para crear grupos de formularios
  private createTeachingCertificationGroup(certification?: TeachingCertification): FormGroup {
    return this.fb.group({
      id: [certification?.id || ''],
      name: [certification?.name || '', [Validators.required]],
      issuer: [certification?.issuer || '', [Validators.required]],
      issue_date: [certification?.issue_date || ''],
      credential_id: [certification?.credential_id || ''],
      image_url: [certification?.image_url || ''],
      description: [certification?.description || '']
    });
  }

  private createLanguageCertificationGroup(certification?: LanguageCertification): FormGroup {
    return this.fb.group({
      id: [certification?.id || ''],
      language_code: [certification?.language_code || '', [Validators.required]],
      name: [certification?.name || '', [Validators.required]],
      issuer: [certification?.issuer || '', [Validators.required]],
      level_cefr: [certification?.level_cefr || 'B1', [Validators.required]],
      issue_date: [certification?.issue_date || ''],
      credential_id: [certification?.credential_id || ''],
      score: [certification?.score || null],
      image_url: [certification?.image_url || ''],
      description: [certification?.description || '']
    });
  }

  // Métodos para agregar certificaciones
  addTeachingCertification(): void {
    this.teachingCertificationsArray.push(this.createTeachingCertificationGroup());
    console.log('➕ Agregada nueva certificación de enseñanza');
  }

  addLanguageCertification(): void {
    this.languageCertificationsArray.push(this.createLanguageCertificationGroup());
    console.log('➕ Agregada nueva certificación de idioma');
  }

  // Métodos para remover certificaciones
  removeTeachingCertification(index: number): void {
    this.teachingCertificationsArray.removeAt(index);
    // Limpiar estados de imagen
    delete this.imageLoadingStates.teaching[index];
    delete this.imageErrorStates.teaching[index];
    console.log('🗑️ Removida certificación de enseñanza en índice:', index);
  }

  removeLanguageCertification(index: number): void {
    this.languageCertificationsArray.removeAt(index);
    // Limpiar estados de imagen
    delete this.imageLoadingStates.language[index];
    delete this.imageErrorStates.language[index];
    console.log('🗑️ Removida certificación de idioma en índice:', index);
  }

  // Métodos para manejo de vista previa de imágenes
  onImageUrlChange(event: Event, type: 'teaching' | 'language', index: number): void {
    const target = event.target as HTMLInputElement;
    const url = target.value;
    if (url) {
      this.imageLoadingStates[type][index] = true;
      this.imageErrorStates[type][index] = false;
    } else {
      this.imageLoadingStates[type][index] = false;
      this.imageErrorStates[type][index] = false;
    }
  }

  onImageLoad(type: 'teaching' | 'language', index: number): void {
    this.imageLoadingStates[type][index] = false;
    this.imageErrorStates[type][index] = false;
    console.log(`✅ Imagen cargada exitosamente - ${type}[${index}]`);
  }

  onImageError(type: 'teaching' | 'language', index: number): void {
    this.imageLoadingStates[type][index] = false;
    this.imageErrorStates[type][index] = true;
    console.log(`❌ Error al cargar imagen - ${type}[${index}]`);
  }

  // Método para validar que las certificaciones con contenido estén completas
  hasValidCertifications(): boolean {
    const formValue = this.certificatesForm.value;

    // Validar certificaciones de enseñanza
    if (formValue.teachingCertifications && formValue.teachingCertifications.length > 0) {
      for (const cert of formValue.teachingCertifications as Record<string, unknown>[]) {
        const hasContent = cert['name'] || cert['issuer'] || cert['credential_id'] || cert['image_url'] || cert['description'];
        
        if (hasContent) {
          // Si tiene contenido, debe tener los campos requeridos
          if (!cert['name'] || !cert['issuer']) {
            return false;
          }
        }
      }
    }

    // Validar certificaciones de idiomas
    if (formValue.languageCertifications && formValue.languageCertifications.length > 0) {
      for (const cert of formValue.languageCertifications as Record<string, unknown>[]) {
        const hasContent = cert['language_code'] || cert['name'] || cert['issuer'] || cert['credential_id'] || cert['image_url'] || cert['description'];
        
        if (hasContent) {
          // Si tiene contenido, debe tener los campos requeridos
          if (!cert['language_code'] || !cert['name'] || !cert['issuer']) {
            return false;
          }
        }
      }
    }

    // Permitir guardar si todas las certificaciones con contenido son válidas
    return true;
  }

  // Método para guardar certificaciones
  async onSave(): Promise<void> {
    // Validar solo las certificaciones que tienen contenido
    if (this.hasValidCertifications()) {
      this.isLoading = true;
      console.log('💾 Guardando certificaciones...');

      try {
        const formValue = this.certificatesForm.value;
        
        // Preparar datos para actualizar
        const updateData: Partial<Tutor> = {};

        // Procesar certificaciones de enseñanza
        if (formValue.teachingCertifications && formValue.teachingCertifications.length > 0) {
          const teachingCerts = (formValue.teachingCertifications as Record<string, unknown>[])
            .filter((cert: Record<string, unknown>) => cert['name'] && cert['issuer']) // Filtrar certificaciones válidas
            .map((cert: Record<string, unknown>) => ({
              ...cert,
              id: cert['id'] || this.generateId(),
              user_id: this.data.tutor.user_id
            })) as TeachingCertification[];
          
          if (teachingCerts.length > 0) {
            updateData.certifications = teachingCerts;
          }
        }

        // Procesar certificaciones de idiomas
        if (formValue.languageCertifications && formValue.languageCertifications.length > 0) {
          const languageCerts = (formValue.languageCertifications as Record<string, unknown>[])
            .filter((cert: Record<string, unknown>) => cert['language_code'] && cert['name'] && cert['issuer']) // Filtrar certificaciones válidas
            .map((cert: Record<string, unknown>) => ({
              ...cert,
              id: cert['id'] || this.generateId(),
              user_id: this.data.tutor.user_id
            })) as LanguageCertification[];

          if (languageCerts.length > 0) {
            updateData.language_certifications = languageCerts;
          }
        }

        // Actualizar perfil del tutor (puede estar vacío si no hay certificaciones válidas)
        await this.tutorService.updateTutor(this.data.tutor.user_id, updateData);
        
        this.snackBar.open('Certificaciones actualizadas exitosamente', 'Cerrar', {
          duration: 3000
        });

        console.log('✅ Certificaciones guardadas exitosamente');
        this.dialogRef.close(true);

      } catch (error) {
        console.error('❌ Error al guardar certificaciones:', error);
        this.snackBar.open('Error al guardar las certificaciones', 'Cerrar', {
          duration: 3000
        });
      } finally {
        this.isLoading = false;
      }
    } else {
      console.log('⚠️ Certificaciones incompletas');
      this.snackBar.open('Por favor, complete los campos requeridos de las certificaciones que está llenando', 'Cerrar', {
        duration: 4000
      });
    }
  }

  onCancel(): void {
    console.log('❌ Cancelando diálogo de certificaciones');
    this.dialogRef.close(false);
  }

  // Método auxiliar para generar IDs únicos
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
