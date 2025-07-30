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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ClassService } from '../../../../services/class.service';
import { JobPosting, TutorPostulation, Class, User } from '../../../../types/firestore.types';
import { Timestamp } from '@angular/fire/firestore';

export interface CreateClassDialogData {
  jobPosting: JobPosting;
  postulation: TutorPostulation;
  tutor: User;
}

@Component({
  selector: 'app-create-class-dialog',
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
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatChipsModule,
    MatCheckboxModule
  ],
  template: `
    <div class="create-class-dialog">
      <div class="dialog-header">
        <div class="title-section">
          <mat-icon class="title-icon">class</mat-icon>
          <h2>Crear Clase</h2>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content" mat-dialog-content>
        <!-- Información de la postulación -->
        <mat-card class="postulation-info-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>assignment_turned_in</mat-icon>
              Información de la Postulación
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="info-grid">
              <div class="info-item">
                <strong>Trabajo:</strong>
                <span>{{ data.jobPosting.title }}</span>
              </div>
              <div class="info-item">
                <strong>Tutor:</strong>
                <span>{{ data.tutor.email }}</span>
              </div>
              <div class="info-item">
                <strong>Programa:</strong>
                <span>{{ data.jobPosting.program }}</span>
              </div>
              <div class="info-item">
                <strong>Precio Acordado:</strong>
                <span>\${{ data.postulation.proposed_hourly_rate | number:'1.0-0' }}/hora</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Formulario de clase -->
        <form [formGroup]="classForm" class="class-form">
          <mat-card class="form-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>settings</mat-icon>
                Configuración de la Clase
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="form-row">
                <!-- Nombre de la clase -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nombre de la Clase</mat-label>
                  <input 
                    matInput 
                    formControlName="title"
                    placeholder="Ej: Matemáticas - Álgebra Básica">
                  <mat-error *ngIf="classForm.get('title')?.hasError('required')">
                    El nombre es requerido
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <!-- Descripción -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Descripción</mat-label>
                  <textarea 
                    matInput 
                    formControlName="description"
                    placeholder="Describe los objetivos y contenido de la clase..."
                    rows="3"
                    maxlength="500">
                  </textarea>
                  <mat-hint align="end">{{ classForm.get('description')?.value?.length || 0 }}/500</mat-hint>
                  <mat-error *ngIf="classForm.get('description')?.hasError('required')">
                    La descripción es requerida
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row two-columns">
                <!-- Fecha de inicio -->
                <mat-form-field appearance="outline">
                  <mat-label>Fecha de Inicio</mat-label>
                  <input 
                    matInput 
                    [matDatepicker]="startDatePicker"
                    formControlName="startDate"
                    [min]="minDate">
                  <mat-datepicker-toggle matIconSuffix [for]="startDatePicker"></mat-datepicker-toggle>
                  <mat-datepicker #startDatePicker></mat-datepicker>
                  <mat-error *ngIf="classForm.get('startDate')?.hasError('required')">
                    La fecha es requerida
                  </mat-error>
                </mat-form-field>

                <!-- Duración estimada -->
                <mat-form-field appearance="outline">
                  <mat-label>Duración (horas)</mat-label>
                  <input 
                    matInput 
                    type="number" 
                    formControlName="estimatedDuration"
                    placeholder="0"
                    min="1"
                    max="100">
                  <mat-hint>Duración total estimada</mat-hint>
                  <mat-error *ngIf="classForm.get('estimatedDuration')?.hasError('required')">
                    La duración es requerida
                  </mat-error>
                  <mat-error *ngIf="classForm.get('estimatedDuration')?.hasError('min')">
                    Mínimo 1 hora
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row two-columns">
                <!-- Modalidad -->
                <mat-form-field appearance="outline">
                  <mat-label>Modalidad</mat-label>
                  <mat-select formControlName="modality">
                    <mat-option value="online">En línea</mat-option>
                    <mat-option value="in-person">Presencial</mat-option>
                    <mat-option value="hybrid">Híbrido</mat-option>
                  </mat-select>
                  <mat-error *ngIf="classForm.get('modality')?.hasError('required')">
                    La modalidad es requerida
                  </mat-error>
                </mat-form-field>

                <!-- Tipo -->
                <mat-form-field appearance="outline">
                  <mat-label>Tipo</mat-label>
                  <mat-select formControlName="type">
                    <mat-option value="individual">Individual</mat-option>
                    <mat-option value="group">Grupal</mat-option>
                    <mat-option value="workshop">Taller</mat-option>
                  </mat-select>
                  <mat-error *ngIf="classForm.get('type')?.hasError('required')">
                    El tipo es requerido
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <!-- Objetivos de aprendizaje -->
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Objetivos de Aprendizaje</mat-label>
                  <textarea 
                    matInput 
                    formControlName="learningObjectives"
                    placeholder="Define qué aprenderán los estudiantes..."
                    rows="3"
                    maxlength="300">
                  </textarea>
                  <mat-hint align="end">{{ classForm.get('learningObjectives')?.value?.length || 0 }}/300</mat-hint>
                </mat-form-field>
              </div>

              <div class="form-row">
                <!-- Ubicación (si es presencial) -->
                <mat-form-field 
                  appearance="outline" 
                  class="full-width"
                  *ngIf="classForm.get('modality')?.value === 'in-person' || classForm.get('modality')?.value === 'hybrid'">
                  <mat-label>Ubicación</mat-label>
                  <input 
                    matInput 
                    formControlName="location"
                    placeholder="Dirección donde se realizarán las clases">
                  <mat-error *ngIf="classForm.get('location')?.hasError('required')">
                    La ubicación es requerida para clases presenciales
                  </mat-error>
                </mat-form-field>
              </div>

              <div class="form-row">
                <!-- Configuración automática -->
                <div class="checkbox-group">
                  <mat-checkbox formControlName="autoCreateSessions">
                    Crear sesiones automáticamente
                  </mat-checkbox>
                  <p class="checkbox-hint">
                    Se crearán sesiones semanales basadas en la duración estimada
                  </p>
                </div>
              </div>
            </mat-card-content>
          </mat-card>
        </form>

        <!-- Barra de progreso -->
        <mat-progress-bar 
          *ngIf="isCreating" 
          mode="indeterminate"
          class="progress-bar">
        </mat-progress-bar>
      </div>

      <div class="dialog-actions" mat-dialog-actions>
        <button 
          mat-button 
          mat-dialog-close
          [disabled]="isCreating">
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="primary"
          (click)="createClass()"
          [disabled]="classForm.invalid || isCreating">
          <mat-icon *ngIf="!isCreating">add</mat-icon>
          <mat-icon *ngIf="isCreating">hourglass_empty</mat-icon>
          {{ isCreating ? 'Creando...' : 'Crear Clase' }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './create-class-dialog.component.scss'
})
export class CreateClassDialogComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private classService = inject(ClassService);

  classForm: FormGroup;
  isCreating = false;
  minDate = new Date();

  constructor(
    public dialogRef: MatDialogRef<CreateClassDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CreateClassDialogData
  ) {
    this.classForm = this.createForm();
    this.setupFormValidation();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      title: [`${this.data.jobPosting.program} - ${this.data.jobPosting.title}`, [Validators.required]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      startDate: ['', [Validators.required]],
      estimatedDuration: [this.data.jobPosting.total_duration_minutes / 60 || 2, [Validators.required, Validators.min(1)]],
      modality: [this.data.jobPosting.modality, [Validators.required]],
      type: [this.data.jobPosting.class_type, [Validators.required]],
      learningObjectives: ['', [Validators.maxLength(300)]],
      location: [''],
      autoCreateSessions: [true]
    });
  }

  private setupFormValidation(): void {
    // Hacer obligatoria la ubicación para clases presenciales
    this.classForm.get('modality')?.valueChanges.subscribe(modality => {
      const locationControl = this.classForm.get('location');
      if (modality === 'in-person' || modality === 'hybrid') {
        locationControl?.setValidators([Validators.required]);
      } else {
        locationControl?.clearValidators();
      }
      locationControl?.updateValueAndValidity();
    });
  }

  async createClass(): Promise<void> {
    if (this.classForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isCreating = true;

    try {
      const formValue = this.classForm.value;
      
      const classData: Omit<Class, 'id'> = {
        course_id: this.data.jobPosting.id,
        scheduled_at: formValue.startDate,
        duration_minutes: Number(formValue.estimatedDuration) * 60,
        price_per_hour: this.data.postulation.proposed_hourly_rate,
        currency: this.data.postulation.currency || 'USD',
        status: 'scheduled',
        notes: `Clase creada desde postulación aceptada para: ${formValue.title}`,
        created_at: Timestamp.fromDate(new Date())
      };

      const classId = await this.classService.createClass(classData);

      // Si se seleccionó crear sesiones automáticamente
      if (formValue.autoCreateSessions) {
        await this.createAutoSessions(classId, formValue);
      }

      this.snackBar.open('Clase creada correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al crear clase:', error);
      this.snackBar.open('Error al crear la clase', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isCreating = false;
    }
  }

  private async createAutoSessions(classId: string, formValue: any): Promise<void> {
    // Lógica para crear sesiones automáticamente
    // Por ejemplo, crear sesiones semanales de 2 horas cada una
    const totalHours = formValue.estimatedDuration;
    const hoursPerSession = 2;
    const sessionsCount = Math.ceil(totalHours / hoursPerSession);
    
    const startDate = new Date(formValue.startDate);
    
    for (let i = 0; i < sessionsCount; i++) {
      const sessionDate = new Date(startDate);
      sessionDate.setDate(startDate.getDate() + (i * 7)); // Cada semana
      
      // Aquí llamarías al servicio para crear cada sesión
      // await this.sessionService.createSession({...});
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.classForm.controls).forEach(key => {
      const control = this.classForm.get(key);
      control?.markAsTouched();
    });
  }
}
