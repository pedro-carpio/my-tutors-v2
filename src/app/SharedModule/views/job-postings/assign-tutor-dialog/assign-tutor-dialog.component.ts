import { Component, Inject, inject, OnInit } from '@angular/core';
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
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import { TutorService } from '../../../../services/tutor.service';
import { JobPostingService } from '../../../../services/job-posting.service';
import { EmailService } from '../../../../services/email.service';
import { JobPosting, Tutor, User } from '../../../../types/firestore.types';

export interface AssignTutorDialogData {
  jobPosting: JobPosting;
}

interface TutorWithUser extends Tutor {
  userData?: User;
  displayName: string;
}

@Component({
  selector: 'app-assign-tutor-dialog',
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
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule
  ],
  template: `
    <div class="assign-tutor-dialog">
      <div class="dialog-header">
        <div class="title-section">
          <mat-icon class="title-icon">person_add</mat-icon>
          <h2>Asignar Tutor</h2>
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
              <mat-icon>work</mat-icon>
              Información del Trabajo
            </mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="job-summary">
              <h3>{{ data.jobPosting.title }}</h3>
              <div class="details-grid">
                <div class="detail-item">
                  <strong>Programa:</strong>
                  <span>{{ data.jobPosting.program }}</span>
                </div>
                <div class="detail-item">
                  <strong>Fecha:</strong>
                  <span>{{ formatDate(data.jobPosting.class_date) }}</span>
                </div>
                <div class="detail-item">
                  <strong>Hora:</strong>
                  <span>{{ data.jobPosting.start_time }}</span>
                </div>
                <div class="detail-item">
                  <strong>Duración:</strong>
                  <span>{{ data.jobPosting.total_duration_minutes }} min</span>
                </div>
                <div class="detail-item">
                  <strong>Modalidad:</strong>
                  <span>{{ getModalityLabel(data.jobPosting.modality) }}</span>
                </div>
                <div class="detail-item">
                  <strong>Estudiantes:</strong>
                  <span>{{ data.jobPosting.students.length }}</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Selección de tutor -->
        <form [formGroup]="assignForm" class="assign-form">
          <mat-card class="tutor-selection-card">
            <mat-card-header>
              <mat-card-title>
                <mat-icon>person_search</mat-icon>
                Seleccionar Tutor
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <!-- Búsqueda de tutor -->
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Buscar tutor</mat-label>
                <mat-icon matPrefix>search</mat-icon>
                <input 
                  matInput 
                  formControlName="tutorSearch"
                  placeholder="Nombre, email o especialidad del tutor...">
              </mat-form-field>

              <!-- Lista de tutores disponibles -->
              <div class="tutors-list" *ngIf="filteredTutors$ | async as tutors">
                <div class="tutor-option" 
                     *ngFor="let tutor of tutors"
                     [class.selected]="selectedTutor?.user_id === tutor.user_id"
                     (click)="selectTutor(tutor)">
                  <div class="tutor-info">
                    <div class="tutor-avatar">
                      <mat-icon>person</mat-icon>
                    </div>
                    <div class="tutor-details">
                      <h4>{{ tutor.displayName }}</h4>
                      <p class="tutor-email">{{ tutor.userData?.email }}</p>
                      <div class="tutor-meta">
                        <mat-chip class="experience-chip">
                          {{ getExperienceLabel(tutor.experience_level) }}
                        </mat-chip>
                        <span class="hourly-rate">
                          \${{ tutor.hourly_rate }}/h {{ tutor.hourly_rate_currency || 'USD' }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="selection-indicator" *ngIf="selectedTutor?.user_id === tutor.user_id">
                    <mat-icon>check_circle</mat-icon>
                  </div>
                </div>

                <!-- Mensaje cuando no hay tutores -->
                <div class="no-tutors" *ngIf="tutors.length === 0">
                  <mat-icon>person_off</mat-icon>
                  <p>No se encontraron tutores disponibles</p>
                </div>
              </div>

              <!-- Detalles del tutor seleccionado -->
              <div class="selected-tutor-details" *ngIf="selectedTutor">
                <h4>Tutor Seleccionado</h4>
                <mat-card class="tutor-detail-card">
                  <mat-card-content>
                    <div class="tutor-summary">
                      <div class="tutor-header">
                        <mat-icon class="tutor-icon">person</mat-icon>
                        <div>
                          <h5>{{ selectedTutor.displayName }}</h5>
                          <p>{{ selectedTutor.userData?.email }}</p>
                        </div>
                      </div>
                      <div class="tutor-stats">
                        <div class="stat-item">
                          <strong>Experiencia:</strong>
                          <span>{{ getExperienceLabel(selectedTutor.experience_level) }}</span>
                        </div>
                        <div class="stat-item">
                          <strong>Tarifa:</strong>
                          <span>\${{ selectedTutor.hourly_rate }}/h</span>
                        </div>
                        <div class="stat-item">
                          <strong>Idioma nativo:</strong>
                          <span>{{ selectedTutor.birth_language }}</span>
                        </div>
                        <div class="stat-item" *ngIf="selectedTutor.bio">
                          <strong>Bio:</strong>
                          <span>{{ selectedTutor.bio }}</span>
                        </div>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>

              <!-- Opciones adicionales -->
              <div class="assignment-options" *ngIf="selectedTutor">
                <mat-checkbox formControlName="sendNotificationEmail">
                  Enviar email de notificación al tutor
                </mat-checkbox>
                
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Notas adicionales (opcional)</mat-label>
                  <textarea 
                    matInput 
                    formControlName="assignmentNotes"
                    placeholder="Instrucciones especiales o información adicional para el tutor..."
                    rows="3"
                    maxlength="500">
                  </textarea>
                  <mat-hint align="end">{{ assignForm.get('assignmentNotes')?.value?.length || 0 }}/500</mat-hint>
                </mat-form-field>
              </div>
            </mat-card-content>
          </mat-card>
        </form>

        <!-- Barra de progreso -->
        <mat-progress-bar 
          *ngIf="isAssigning" 
          mode="indeterminate"
          class="progress-bar">
        </mat-progress-bar>
      </div>

      <div class="dialog-actions" mat-dialog-actions>
        <button 
          mat-button 
          mat-dialog-close
          [disabled]="isAssigning">
          Cancelar
        </button>
        <button 
          mat-raised-button 
          color="primary"
          (click)="assignTutor()"
          [disabled]="!selectedTutor || isAssigning">
          <mat-icon *ngIf="!isAssigning">assignment_ind</mat-icon>
          <mat-icon *ngIf="isAssigning">hourglass_empty</mat-icon>
          {{ isAssigning ? 'Asignando...' : 'Asignar Tutor' }}
        </button>
      </div>
    </div>
  `,
  styleUrl: './assign-tutor-dialog.component.scss'
})
export class AssignTutorDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private tutorService = inject(TutorService);
  private jobPostingService = inject(JobPostingService);
  private emailService = inject(EmailService);

  assignForm: FormGroup;
  isAssigning = false;
  tutors: TutorWithUser[] = [];
  filteredTutors$: Observable<TutorWithUser[]> = of([]);
  selectedTutor: TutorWithUser | null = null;

  constructor(
    public dialogRef: MatDialogRef<AssignTutorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignTutorDialogData
  ) {
    this.assignForm = this.createForm();
  }

  async ngOnInit(): Promise<void> {
    await this.loadAvailableTutors();
    this.setupTutorSearch();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      tutorSearch: [''],
      sendNotificationEmail: [true],
      assignmentNotes: ['', [Validators.maxLength(500)]]
    });
  }

  private async loadAvailableTutors(): Promise<void> {
    try {
      // Obtener todos los tutores activos
      const tutors = await this.tutorService.getAllTutors().toPromise() || [];
      
      // Enriquecer con datos de usuario y crear nombre para mostrar
      this.tutors = tutors.map(tutor => ({
        ...tutor,
                      displayName: tutor.full_name || 'Tutor sin nombre'
      }));

      this.filteredTutors$ = of(this.tutors);
    } catch (error) {
      console.error('Error loading tutors:', error);
      this.snackBar.open('Error al cargar los tutores', 'Cerrar', { duration: 3000 });
    }
  }

  private setupTutorSearch(): void {
    this.filteredTutors$ = this.assignForm.get('tutorSearch')!.valueChanges.pipe(
      startWith(''),
      map(searchTerm => this.filterTutors(searchTerm || ''))
    );
  }

  private filterTutors(searchTerm: string): TutorWithUser[] {
    if (!searchTerm.trim()) {
      return this.tutors;
    }

    const term = searchTerm.toLowerCase();
    return this.tutors.filter(tutor => 
      tutor.displayName.toLowerCase().includes(term) ||
      tutor.userData?.email?.toLowerCase().includes(term) ||
      tutor.bio?.toLowerCase().includes(term) ||
      tutor.birth_language.toLowerCase().includes(term)
    );
  }

  selectTutor(tutor: TutorWithUser): void {
    this.selectedTutor = tutor;
  }

  async assignTutor(): Promise<void> {
    if (!this.selectedTutor) {
      this.snackBar.open('Debe seleccionar un tutor', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isAssigning = true;

    try {
      const formValue = this.assignForm.value;

      // Actualizar el job posting con el tutor asignado
      await this.jobPostingService.assignTutorToJobPosting(
        this.data.jobPosting.id,
        this.selectedTutor.user_id,
        formValue.assignmentNotes || ''
      );

      // Enviar email de notificación si está habilitado
      if (formValue.sendNotificationEmail && this.selectedTutor.userData?.email) {
        await this.sendAssignmentEmail();
      }

      this.snackBar.open('Tutor asignado correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al asignar tutor:', error);
      this.snackBar.open('Error al asignar el tutor', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isAssigning = false;
    }
  }

  private async sendAssignmentEmail(): Promise<void> {
    if (!this.selectedTutor?.userData?.email) return;

    try {
      const emailData = {
        tutorName: this.selectedTutor.displayName,
        tutorEmail: this.selectedTutor.userData.email,
        institutionName: 'Tu Institución', // Obtener del contexto
        institutionEmail: 'institucion@example.com', // Obtener del contexto
        jobTitle: this.data.jobPosting.title,
        classDate: this.formatDate(this.data.jobPosting.class_date),
        startTime: this.data.jobPosting.start_time,
        duration: this.data.jobPosting.total_duration_minutes,
        students: this.data.jobPosting.students.map(student => ({
          name: student.name,
          age: student.age,
          level: student.level_group
        })),
        modality: this.getModalityLabel(this.data.jobPosting.modality),
        location: this.data.jobPosting.location
      };

      await this.emailService.sendJobAssignmentEmailToTutor(emailData);
    } catch (error) {
      console.error('Error enviando email:', error);
      // No mostrar error al usuario, es funcionalidad secundaria
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    
    if (date instanceof Date) {
      return date.toLocaleDateString('es-ES');
    }
    
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('es-ES');
    }
    
    return date.toString();
  }

  getModalityLabel(modality: string): string {
    const labels: { [key: string]: string } = {
      'presencial': 'Presencial',
      'virtual': 'Virtual',
      'hibrida': 'Híbrida'
    };
    return labels[modality] || modality;
  }

  getExperienceLabel(experience: any): string {
    if (typeof experience === 'string') {
      const labels: { [key: string]: string } = {
        'beginner': 'Principiante',
        'intermediate': 'Intermedio',
        'advanced': 'Avanzado',
        'expert': 'Experto'
      };
      return labels[experience] || experience;
    }
    
    if (typeof experience === 'number') {
      return `${experience} años`;
    }
    
    return 'No especificado';
  }
}
