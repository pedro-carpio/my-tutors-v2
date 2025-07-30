import { Component, Inject, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TutorPostulationService } from '../../../../services/tutor-postulation.service';
import { UserService } from '../../../../services/user.service';
import { CreateClassDialogComponent } from '../create-class-dialog/create-class-dialog.component';
import { JobPosting, TutorPostulation, User, PostulationStatus } from '../../../../types/firestore.types';

export interface PostulationsListDialogData {
  jobPosting: JobPosting;
}

interface PostulationWithTutor extends TutorPostulation {
  tutorData?: User;
  displayName: string;
}

@Component({
  selector: 'app-postulations-list-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTabsModule,
    MatMenuModule,
    MatTooltipModule
  ],
  template: `
    <div class="postulations-dialog">
      <div class="dialog-header">
        <div class="title-section">
          <mat-icon class="title-icon">assignment</mat-icon>
          <div>
            <h2>Postulaciones</h2>
            <p class="job-title">{{ data.jobPosting.title }}</p>
          </div>
        </div>
        <button mat-icon-button mat-dialog-close class="close-button">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="dialog-content" mat-dialog-content>
        <!-- Información del trabajo -->
        <mat-card class="job-summary-card">
          <mat-card-content>
            <div class="job-info-grid">
              <div class="info-item">
                <mat-icon>event</mat-icon>
                <span>{{ formatDate(data.jobPosting.class_date) }} - {{ data.jobPosting.start_time }}</span>
              </div>
              <div class="info-item">
                <mat-icon>schedule</mat-icon>
                <span>{{ data.jobPosting.total_duration_minutes }} minutos</span>
              </div>
              <div class="info-item">
                <mat-icon>{{ getModalityIcon(data.jobPosting.modality) }}</mat-icon>
                <span>{{ getModalityLabel(data.jobPosting.modality) }}</span>
              </div>
              <div class="info-item">
                <mat-icon>group</mat-icon>
                <span>{{ data.jobPosting.students.length }} estudiantes</span>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Pestañas de postulaciones -->
        <mat-tab-group class="postulations-tabs">
          <mat-tab [label]="'Todas (' + allPostulations.length + ')'">
            <div class="tab-content">
              <div class="postulations-content" *ngIf="!isLoading">
                <div class="postulations-table" *ngIf="allPostulations.length > 0">
                  <mat-table [dataSource]="allPostulations" class="postulations-mat-table">
                    
                    <!-- Columna de tutor -->
                    <ng-container matColumnDef="tutor">
                      <mat-header-cell *matHeaderCellDef>Tutor</mat-header-cell>
                      <mat-cell *matCellDef="let postulation">
                        <div class="tutor-info">
                          <div class="tutor-avatar">
                            <mat-icon>person</mat-icon>
                          </div>
                          <div class="tutor-details">
                            <div class="tutor-name">{{ postulation.displayName }}</div>
                            <div class="tutor-email">{{ postulation.tutorData?.email }}</div>
                          </div>
                        </div>
                      </mat-cell>
                    </ng-container>

                    <!-- Columna de tarifa propuesta -->
                    <ng-container matColumnDef="proposed_rate">
                      <mat-header-cell *matHeaderCellDef>Tarifa/hora</mat-header-cell>
                      <mat-cell *matCellDef="let postulation">
                        <div class="rate-info">
                          <strong>\${{ postulation.proposed_hourly_rate }}</strong>
                          <span class="currency">{{ postulation.currency }}</span>
                        </div>
                      </mat-cell>
                    </ng-container>

                    <!-- Columna de estado -->
                    <ng-container matColumnDef="status">
                      <mat-header-cell *matHeaderCellDef>Estado</mat-header-cell>
                      <mat-cell *matCellDef="let postulation">
                        <mat-chip 
                          [color]="getStatusColor(postulation.status)"
                          [class]="'status-' + postulation.status">
                          {{ getStatusText(postulation.status) }}
                        </mat-chip>
                      </mat-cell>
                    </ng-container>

                    <!-- Columna de fecha -->
                    <ng-container matColumnDef="postulated_at">
                      <mat-header-cell *matHeaderCellDef>Fecha</mat-header-cell>
                      <mat-cell *matCellDef="let postulation">
                        {{ formatDateTime(postulation.postulated_at) }}
                      </mat-cell>
                    </ng-container>

                    <!-- Columna de acciones -->
                    <ng-container matColumnDef="actions">
                      <mat-header-cell *matHeaderCellDef>Acciones</mat-header-cell>
                      <mat-cell *matCellDef="let postulation">
                        <div class="action-buttons">
                          <!-- Acciones para postulaciones pendientes -->
                          <ng-container *ngIf="postulation.status === 'pending'">
                            <button 
                              mat-icon-button 
                              color="primary"
                              (click)="acceptPostulation(postulation)"
                              matTooltip="Aceptar postulación">
                              <mat-icon>check</mat-icon>
                            </button>
                            <button 
                              mat-icon-button 
                              color="warn"
                              (click)="rejectPostulation(postulation)"
                              matTooltip="Rechazar postulación">
                              <mat-icon>close</mat-icon>
                            </button>
                          </ng-container>
                          
                          <!-- Acciones para postulaciones aceptadas -->
                          <ng-container *ngIf="postulation.status === 'accepted'">
                            <button 
                              mat-raised-button 
                              color="primary"
                              (click)="createClass(postulation)"
                              matTooltip="Crear clase">
                              <mat-icon>add</mat-icon>
                              Crear Clase
                            </button>
                          </ng-container>

                          <!-- Menú de opciones adicionales -->
                          <button 
                            mat-icon-button 
                            [matMenuTriggerFor]="postulationMenu"
                            matTooltip="Más opciones">
                            <mat-icon>more_vert</mat-icon>
                          </button>
                          <mat-menu #postulationMenu="matMenu">
                            <button mat-menu-item (click)="viewPostulationDetails(postulation)">
                              <mat-icon>info</mat-icon>
                              Ver detalles
                            </button>
                            <button mat-menu-item (click)="contactTutor(postulation)">
                              <mat-icon>email</mat-icon>
                              Contactar tutor
                            </button>
                          </mat-menu>
                        </div>
                      </mat-cell>
                    </ng-container>

                    <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
                    <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
                  </mat-table>
                </div>

                <!-- Mensaje cuando no hay postulaciones -->
                <div class="no-postulations" *ngIf="allPostulations.length === 0">
                  <mat-icon>assignment_late</mat-icon>
                  <h3>No hay postulaciones</h3>
                  <p>Aún no se han recibido postulaciones para esta oferta de trabajo.</p>
                </div>
              </div>

              <!-- Loading -->
              <div class="loading-container" *ngIf="isLoading">
                <mat-spinner></mat-spinner>
                <p>Cargando postulaciones...</p>
              </div>
            </div>
          </mat-tab>

          <mat-tab [label]="'Pendientes (' + pendingPostulations.length + ')'">
            <div class="tab-content">
              <div class="postulations-table" *ngIf="pendingPostulations.length > 0">
                <mat-table [dataSource]="pendingPostulations" class="postulations-mat-table">
                  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
                  <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
                </mat-table>
              </div>
              <div class="no-postulations" *ngIf="pendingPostulations.length === 0">
                <mat-icon>hourglass_empty</mat-icon>
                <h3>No hay postulaciones pendientes</h3>
                <p>Todas las postulaciones han sido procesadas.</p>
              </div>
            </div>
          </mat-tab>

          <mat-tab [label]="'Aceptadas (' + acceptedPostulations.length + ')'">
            <div class="tab-content">
              <div class="postulations-table" *ngIf="acceptedPostulations.length > 0">
                <mat-table [dataSource]="acceptedPostulations" class="postulations-mat-table">
                  <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
                  <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
                </mat-table>
              </div>
              <div class="no-postulations" *ngIf="acceptedPostulations.length === 0">
                <mat-icon>check_circle_outline</mat-icon>
                <h3>No hay postulaciones aceptadas</h3>
                <p>Aún no has aceptado ninguna postulación.</p>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </div>

      <div class="dialog-actions" mat-dialog-actions>
        <button mat-button mat-dialog-close>
          Cerrar
        </button>
        <button 
          mat-raised-button 
          color="primary"
          *ngIf="acceptedPostulations.length > 0"
          (click)="createClassFromFirstAccepted()">
          <mat-icon>class</mat-icon>
          Crear Clase
        </button>
      </div>
    </div>
  `,
  styleUrl: './postulations-list-dialog.component.scss'
})
export class PostulationsListDialogComponent implements OnInit, OnDestroy {
  private tutorPostulationService = inject(TutorPostulationService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  isLoading = false;
  allPostulations: PostulationWithTutor[] = [];
  pendingPostulations: PostulationWithTutor[] = [];
  acceptedPostulations: PostulationWithTutor[] = [];

  displayedColumns: string[] = ['tutor', 'proposed_rate', 'status', 'postulated_at', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<PostulationsListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PostulationsListDialogData
  ) {}

  ngOnInit(): void {
    this.loadPostulations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadPostulations(): Promise<void> {
    this.isLoading = true;

    try {
      this.tutorPostulationService.getPostulationsByJobPosting(this.data.jobPosting.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: async (postulations) => {
            // Enriquecer postulaciones con datos del tutor
            this.allPostulations = await Promise.all(
              postulations.map(async (postulation) => {
                const tutorData = postulation.tutor_id ? 
                  await this.userService.getUser(postulation.tutor_id).toPromise() : 
                  undefined;

                return {
                  ...postulation,
                  tutorData,
                  displayName: tutorData?.email || 'Tutor sin nombre'
                };
              })
            );

            this.filterPostulationsByStatus();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading postulations:', error);
            this.snackBar.open('Error al cargar las postulaciones', 'Cerrar', { duration: 3000 });
            this.isLoading = false;
          }
        });
    } catch (error) {
      console.error('Error in loadPostulations:', error);
      this.isLoading = false;
    }
  }

  private filterPostulationsByStatus(): void {
    this.pendingPostulations = this.allPostulations.filter(p => p.status === 'pending');
    this.acceptedPostulations = this.allPostulations.filter(p => p.status === 'accepted');
  }

  async acceptPostulation(postulation: PostulationWithTutor): Promise<void> {
    if (!postulation.id) return;

    try {
      await this.tutorPostulationService.acceptPostulation(postulation.id, 'Postulación aceptada');
      this.snackBar.open('Postulación aceptada correctamente', 'Cerrar', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      this.loadPostulations(); // Recargar para actualizar estados
    } catch (error) {
      console.error('Error accepting postulation:', error);
      this.snackBar.open('Error al aceptar la postulación', 'Cerrar', { duration: 3000 });
    }
  }

  async rejectPostulation(postulation: PostulationWithTutor): Promise<void> {
    if (!postulation.id) return;

    try {
      await this.tutorPostulationService.rejectPostulation(postulation.id, 'Postulación rechazada');
      this.snackBar.open('Postulación rechazada correctamente', 'Cerrar', { 
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      this.loadPostulations(); // Recargar para actualizar estados
    } catch (error) {
      console.error('Error rejecting postulation:', error);
      this.snackBar.open('Error al rechazar la postulación', 'Cerrar', { duration: 3000 });
    }
  }

  createClass(postulation: PostulationWithTutor): void {
    if (!postulation.tutorData) {
      this.snackBar.open('No se pueden obtener los datos del tutor', 'Cerrar', { duration: 3000 });
      return;
    }

    const dialogRef = this.dialog.open(CreateClassDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        jobPosting: this.data.jobPosting,
        postulation: postulation,
        tutor: postulation.tutorData
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Clase creada exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.dialogRef.close(true);
      }
    });
  }

  createClassFromFirstAccepted(): void {
    if (this.acceptedPostulations.length > 0) {
      this.createClass(this.acceptedPostulations[0]);
    }
  }

  viewPostulationDetails(postulation: PostulationWithTutor): void {
    // TODO: Implementar vista detallada de postulación
    console.log('View details for postulation:', postulation);
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
  }

  contactTutor(postulation: PostulationWithTutor): void {
    // TODO: Implementar contacto con tutor
    console.log('Contact tutor:', postulation);
    this.snackBar.open('Funcionalidad en desarrollo', 'Cerrar', { duration: 2000 });
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

  formatDateTime(date: any): string {
    if (!date) return '';
    
    // Si es un Timestamp de Firestore
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('es-ES') + ' ' + 
             date.toDate().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    
    if (date instanceof Date) {
      return date.toLocaleDateString('es-ES') + ' ' + 
             date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    
    if (typeof date === 'string') {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString('es-ES') + ' ' + 
             dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toString();
  }

  getModalityIcon(modality: string): string {
    const icons: { [key: string]: string } = {
      'presencial': 'location_on',
      'virtual': 'videocam',
      'hibrida': 'swap_horiz'
    };
    return icons[modality] || 'help';
  }

  getModalityLabel(modality: string): string {
    const labels: { [key: string]: string } = {
      'presencial': 'Presencial',
      'virtual': 'Virtual',
      'hibrida': 'Híbrida'
    };
    return labels[modality] || modality;
  }

  getStatusColor(status: PostulationStatus): string {
    const colors = {
      pending: 'accent',
      accepted: 'primary',
      rejected: 'warn',
      withdrawn: ''
    };
    return colors[status] || '';
  }

  getStatusText(status: PostulationStatus): string {
    const texts = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      withdrawn: 'Retirada'
    };
    return texts[status] || status;
  }
}
