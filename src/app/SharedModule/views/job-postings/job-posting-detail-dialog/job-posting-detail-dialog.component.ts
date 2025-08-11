import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { TutorPostulationService } from '../../../../services/tutor-postulation.service';
import { SessionService } from '../../../../services/session.service';
import { TimezoneService } from '../../../../services/timezone.service';
import { JobPosting, ClassType, ClassModality, JobPostingStatus, TutorPostulation, PostulationStatus, UserRole } from '../../../../types/firestore.types';

import { FieldValue, Timestamp } from '@angular/fire/firestore';

// Interface personalizada para Timestamp de Firebase
interface FirebaseTimestamp {
  toDate(): Date;
}

@Component({
  selector: 'app-job-posting-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    MatTabsModule,
    MatTableModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './job-posting-detail-dialog.component.html',
  styleUrls: ['./job-posting-detail-dialog.component.scss']
})
export class JobPostingDetailDialogComponent implements OnInit, OnDestroy {
  private tutorPostulationService = inject(TutorPostulationService);
  private sessionService = inject(SessionService);
  private timezoneService = inject(TimezoneService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Datos inyectados
  public data = inject(MAT_DIALOG_DATA) as { jobPosting: JobPosting; userRole?: UserRole };
  public dialogRef = inject(MatDialogRef<JobPostingDetailDialogComponent>);

  // Propiedades para mostrar información de timezone
  userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  localClassTime = '';
  utcClassTime = '';

  // Datos
  postulations: TutorPostulation[] = [];
  isLoadingPostulations = false;
  currentUserRole: UserRole | null = null;

  // Columnas de la tabla de postulaciones
  postulationColumns: string[] = ['tutor', 'proposed_rate', 'status', 'postulated_at', 'actions'];

  constructor() {
    this.currentUserRole = this.data.userRole || null;
  }

  ngOnInit(): void {
    this.calculateLocalClassTime();
    
    if (this.canViewPostulations()) {
      this.loadPostulations();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  canViewPostulations(): boolean {
    return (this.currentUserRole === 'institution' || this.currentUserRole === 'admin') &&
           this.jobPosting.status === 'published';
  }

  /**
   * Calcula y formatea la hora local de la clase para el usuario
   */
  private calculateLocalClassTime(): void {
    const jobPosting = this.jobPosting;
    
    // Si tenemos la fecha UTC calculada, usarla
    if (jobPosting.class_datetime_utc) {
      console.log('🕐 Using UTC datetime from job posting:', jobPosting.class_datetime_utc);
      
      // Convertir la fecha UTC a la zona horaria del usuario
      const utcDate = new Date(jobPosting.class_datetime_utc);
      this.utcClassTime = utcDate.toISOString();
      
      // Mostrar en timezone local del usuario
      const localDate = new Date(utcDate.getTime());
      this.localClassTime = localDate.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
    } else if (jobPosting.class_date && jobPosting.start_time) {
      // Fallback: construir la fecha desde class_date y start_time
      console.log('🕐 Constructing datetime from class_date and start_time');
      
      const classDateStr = jobPosting.class_date.toISOString().split('T')[0];
      const localDateTimeStr = `${classDateStr}T${jobPosting.start_time}:00`;
      const localDateTime = new Date(localDateTimeStr);
      
      this.localClassTime = localDateTime.toLocaleString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
      });
      
      this.utcClassTime = localDateTime.toISOString();
    }
    
    console.log('🕐 Class time info calculated:', {
      userTimezone: this.userTimezone,
      localClassTime: this.localClassTime,
      utcClassTime: this.utcClassTime
    });
  }

  private loadPostulations(): void {
    this.isLoadingPostulations = true;
    
    this.tutorPostulationService.getPostulationsByJobPosting(this.jobPosting.id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (postulations) => {
        this.postulations = postulations;
        this.isLoadingPostulations = false;
      },
      error: (error) => {
        console.error('Error loading postulations:', error);
        this.isLoadingPostulations = false;
        this.showError('Error al cargar las postulaciones');
      }
    });
  }

  acceptPostulation(postulation: TutorPostulation): void {
    if (!postulation.id) return;

    this.tutorPostulationService.acceptPostulation(postulation.id, 'Postulación aceptada').then(() => {
      this.showSuccess('Postulación aceptada exitosamente');
      this.loadPostulations();
    }).catch(error => {
      console.error('Error accepting postulation:', error);
      this.showError('Error al aceptar la postulación');
    });
  }

  rejectPostulation(postulation: TutorPostulation): void {
    if (!postulation.id) return;

    this.tutorPostulationService.rejectPostulation(postulation.id, 'Postulación rechazada').then(() => {
      this.showSuccess('Postulación rechazada');
      this.loadPostulations();
    }).catch(error => {
      console.error('Error rejecting postulation:', error);
      this.showError('Error al rechazar la postulación');
    });
  }

  get jobPosting(): JobPosting {
    return this.data.jobPosting;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getStatusColor(status: JobPostingStatus): string {
    const colors = {
      draft: 'accent',
      published: 'primary',
      assigned: 'warn',
      completed: 'primary',
      cancelled: ''
    };
    return colors[status] || '';
  }

  getModalityIcon(modality: ClassModality): string {
    const icons = {
      presencial: 'location_on',
      virtual: 'videocam',
      hibrida: 'swap_horiz'
    };
    return icons[modality] || 'help';
  }

  getClassTypeIcon(classType: ClassType): string {
    const icons = {
      prueba: 'quiz',
      regular: 'school',
      recurrente: 'repeat',
      intensiva: 'flash_on'
    };
    return icons[classType] || 'class';
  }

  formatTimestampDate(timestamp: FieldValue | Timestamp | Date | string | null | undefined): Date | null {
    if (timestamp && typeof (timestamp as Timestamp).toDate === 'function') {
      return (timestamp as Timestamp).toDate();
    } else if (timestamp instanceof Date) {
      return timestamp;
    } else if (typeof timestamp === 'string') {
      return new Date(timestamp);
    }
    return null;
  }

  formatDate(value: string | Date | FirebaseTimestamp | null | undefined): string {
    if (!value) return '';
    
    // Si es un Timestamp de Firestore
    if (value && typeof (value as FirebaseTimestamp).toDate === 'function') {
      return (value as FirebaseTimestamp).toDate().toLocaleDateString();
    }
    
    // Si ya es un Date
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Si es un string, intentar convertir
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    return value.toString();
  }

  formatDateTime(value: Date | string | FirebaseTimestamp | null | undefined): string {
    if (!value) return '';
    
    // Si es un Timestamp de Firestore
    if (value && typeof (value as FirebaseTimestamp).toDate === 'function') {
      return (value as FirebaseTimestamp).toDate().toLocaleString();
    }
    
    // Si ya es un Date
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    // Si es un string, intentar convertir
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    
    return value.toString();
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString;
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${remainingMinutes}min`;
    }
  }

  getStudentAge(age: number): string {
    if (!age) return '';
    return `${age} años`;
  }

  getPostulationStatusColor(status: PostulationStatus): string {
    const colors = {
      pending: 'accent',
      accepted: 'primary',
      rejected: 'warn',
      withdrawn: ''
    };
    return colors[status] || '';
  }

  getPostulationStatusText(status: PostulationStatus): string {
    const translations = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
      withdrawn: 'Retirada'
    };
    return translations[status] || status;
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  createClass(postulation: TutorPostulation): void {
    // TODO: Implementar diálogo de creación de clase
    console.log('Create class from postulation:', postulation);
    this.showSuccess('Funcionalidad de crear clase en desarrollo');
    
    /*
    // Necesitamos obtener los datos del tutor para el diálogo
    // Por ahora, vamos a simular estos datos o usar un servicio para obtenerlos
    
    const dialogRef = this.dialog.open(CreateClassDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        jobPosting: this.jobPosting,
        postulation: postulation,
        tutor: { 
          name: 'Tutor', // Aquí deberías obtener el nombre real del tutor
          email: 'tutor@example.com' // Y otros datos del tutor
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.showSuccess('Clase creada exitosamente');
        // Opcionalmente, cerrar este diálogo o actualizar la vista
      }
    });
    */
  }
}
