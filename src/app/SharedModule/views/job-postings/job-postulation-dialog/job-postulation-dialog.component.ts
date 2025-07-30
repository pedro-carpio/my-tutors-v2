import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { TutorPostulationService } from '../../../../services/tutor-postulation.service';
import { JobPosting, TutorPostulation } from '../../../../types/firestore.types';
import { Timestamp } from '@angular/fire/firestore';

export interface JobPostulationDialogData {
  jobPosting: JobPosting;
  currentUserId: string;
}

@Component({
  selector: 'app-job-postulation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatChipsModule
  ],
  template: `
    <div class="postulation-dialog">
      <div class="dialog-header">
        <div class="title-section">
          <mat-icon class="title-icon">work</mat-icon>
          <h2>Postular a Trabajo</h2>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content" mat-dialog-content>
        <!-- Información del trabajo -->
        <mat-card class="job-info-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>info</mat-icon>
              Información del Trabajo
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="job-summary">
              <h3>{{ data.jobPosting.title }}</h3>
              <p class="subject-info">
                <mat-icon>subject</mat-icon>
                {{ data.jobPosting.program }}
              </p>
              <div class="details-grid">
                <div class="detail-item">
                  <strong>Modalidad:</strong>
                  <span>{{ getModalityLabel(data.jobPosting.modality) }}</span>
                </div>
                <div class="detail-item">
                  <strong>Tipo:</strong>
                  <span>{{ getTypeLabel(data.jobPosting.class_type) }}</span>
                </div>
                <div class="detail-item">
                  <strong>Duración:</strong>
                  <span>{{ data.jobPosting.total_duration_minutes }} minutos</span>
                </div>
                <div class="detail-item">
                  <strong>Estudiantes:</strong>
                  <span>{{ data.jobPosting.students.length }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Formulario de postulación -->
        <form [formGroup]="postulationForm" class="postulation-form">
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person</mat-icon>
                Tu Postulación
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <!-- Carta de Presentación -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Carta de Presentación</mat-label>
                <textarea 
                  matInput 
                  formControlName="coverLetter"
                  placeholder="Describe por qué eres el tutor ideal para este trabajo..."
                  rows="6"
                  maxlength="1000">
                </textarea>
                <mat-hint align="end">{{ postulationForm.get('coverLetter')?.value?.length || 0 }}/1000</mat-hint>
                <mat-error *ngIf="postulationForm.get('coverLetter')?.hasError('required')">
                  La carta de presentación es requerida
                </mat-error>
                <mat-error *ngIf="postulationForm.get('coverLetter')?.hasError('minlength')">
                  Mínimo 50 caracteres
                </mat-error>
              </mat-form-field>

              <!-- Metodología de Enseñanza -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Metodología de Enseñanza</mat-label>
                <textarea 
                  matInput 
                  formControlName="teachingApproach"
                  placeholder="Describe tu metodología y enfoque para enseñar esta materia..."
                  rows="4"
                  maxlength="500">
                </textarea>
                <mat-hint align="end">{{ postulationForm.get('teachingApproach')?.value?.length || 0 }}/500</mat-hint>
                <mat-error *ngIf="postulationForm.get('teachingApproach')?.hasError('required')">
                  La metodología es requerida
                </mat-error>
              </mat-form-field>

              <!-- Experiencia Relevante -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Experiencia Relevante</mat-label>
                <textarea 
                  matInput 
                  formControlName="relevantExperience"
                  placeholder="Menciona tu experiencia relacionada con esta materia..."
                  rows="3"
                  maxlength="300">
                </textarea>
                <mat-hint align="end">{{ postulationForm.get('relevantExperience')?.value?.length || 0 }}/300</mat-hint>
              </mat-form-field>

              <!-- Disponibilidad -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Disponibilidad</mat-label>
                <mat-select formControlName="availability" multiple>
                  <mat-option value="morning">Mañana (8:00 - 12:00)</mat-option>
                  <mat-option value="afternoon">Tarde (12:00 - 18:00)</mat-option>
                  <mat-option value="evening">Noche (18:00 - 22:00)</mat-option>
                  <mat-option value="weekend">Fines de semana</mat-option>
                </mat-select>
                <mat-error *ngIf="postulationForm.get('availability')?.hasError('required')">
                  Selecciona al menos una opción de disponibilidad
                </mat-error>
              </mat-form-field>

              <!-- Precio Propuesto -->
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Precio Propuesto (\$)</mat-label>
                <input 
                  matInput 
                  type="number" 
                  formControlName="proposedPrice"
                  placeholder="0"
                  min="0"
                  max="200">
                <mat-hint>Precio por hora en USD</mat-hint>
                <mat-error *ngIf="postulationForm.get('proposedPrice')?.hasError('required')">
                  El precio es requerido
                </mat-error>
                <mat-error *ngIf="postulationForm.get('proposedPrice')?.hasError('min')">
                  El precio debe ser mayor a 0
                </mat-error>
                <mat-error *ngIf="postulationForm.get('proposedPrice')?.hasError('max')">
                  El precio no puede exceder el presupuesto
                </mat-error>
              </mat-form-field>

              <!-- Comentarios Adicionales -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Comentarios Adicionales (Opcional)</mat-label>
                <textarea 
                  matInput 
                  formControlName="additionalComments"
                  placeholder="Cualquier información adicional que quieras compartir..."
                  rows="2"
                  maxlength="200">
                </textarea>
                <mat-hint align="end">{{ postulationForm.get('additionalComments')?.value?.length || 0 }}/200</mat-hint>
              </mat-form-field>
            </mat-card-content>
          </mat-card>
        </form>

        <!-- Barra de progreso -->
        <mat-progress-bar 
          *ngIf="isSubmitting" 
          mode="indeterminate"
          class="progress-bar">
        </mat-progress-bar>
      </div>

      <div class="dialog-actions" mat-dialog-actions>
        <button 
          mat-button 
          mat-dialog-close
          [disabled]="isSubmitting">
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="primary"
          (click)="submitPostulation()"
          [disabled]="postulationForm.invalid || isSubmitting">
          <mat-icon *ngIf="!isSubmitting">send</mat-icon>
          <mat-icon *ngIf="isSubmitting">hourglass_empty</mat-icon>
          {{ isSubmitting ? 'Enviando...' : 'Enviar Postulación' }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './job-postulation-dialog.component.scss'
})
export class JobPostulationDialogComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private tutorPostulationService = inject(TutorPostulationService);

  postulationForm: FormGroup;
  isSubmitting = false;

  constructor(
    public dialogRef: MatDialogRef<JobPostulationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: JobPostulationDialogData
  ) {
    this.postulationForm = this.createForm();
  }

  private createForm(): FormGroup {
    // Calculamos un precio máximo basado en la duración y un rate promedio
    const maxPrice = (this.data.jobPosting.total_duration_minutes / 60) * 100; // $100/hora como máximo
    
    return this.fb.group({
      coverLetter: ['', [Validators.required, Validators.minLength(50), Validators.maxLength(1000)]],
      teachingApproach: ['', [Validators.required, Validators.maxLength(500)]],
      relevantExperience: ['', [Validators.maxLength(300)]],
      availability: [[], [Validators.required]],
      proposedPrice: ['', [
        Validators.required, 
        Validators.min(1), 
        Validators.max(maxPrice)
      ]],
      additionalComments: ['', [Validators.maxLength(200)]]
    });
  }

  async submitPostulation(): Promise<void> {
    if (this.postulationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      const formValue = this.postulationForm.value;
      
      const postulationData: Omit<TutorPostulation, 'id'> = {
        job_posting_id: this.data.jobPosting.id!,
        tutor_id: this.data.currentUserId,
        institution_id: this.data.jobPosting.institution_id,
        proposed_hourly_rate: Number(formValue.proposedPrice),
        currency: 'USD',
        cover_letter: formValue.coverLetter,
        teaching_approach: formValue.teachingApproach,
        availability_confirmation: formValue.availability.length > 0,
        status: 'pending',
        postulated_at: Timestamp.fromDate(new Date()),
        created_at: Timestamp.fromDate(new Date()),
        updated_at: Timestamp.fromDate(new Date())
      };

      await this.tutorPostulationService.createPostulation(postulationData);

      this.snackBar.open('Postulación enviada correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al enviar postulación:', error);
      this.snackBar.open('Error al enviar la postulación', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.postulationForm.controls).forEach(key => {
      const control = this.postulationForm.get(key);
      control?.markAsTouched();
    });
  }

  getModalityLabel(modality: string): string {
    const labels: { [key: string]: string } = {
      'online': 'En línea',
      'in-person': 'Presencial',
      'hybrid': 'Híbrido'
    };
    return labels[modality] || modality;
  }

  getTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'individual': 'Individual',
      'group': 'Grupal',
      'workshop': 'Taller'
    };
    return labels[type] || type;
  }
}
