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
    
    let date: Date | null = null;
    
    // Si es un Timestamp de Firestore
    if (value && typeof (value as FirebaseTimestamp).toDate === 'function') {
      date = (value as FirebaseTimestamp).toDate();
    } else if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      date = new Date(value);
      if (isNaN(date.getTime())) {
        return value.toString();
      }
    }
    
    if (!date) return '';
    
    return this.formatDateTimeWithTimezone(date);
  }

  private formatDateTimeWithTimezone(date: Date): string {
    const jobPosting = this.jobPosting;
    
    // Si hay job_timezone, mostrar información adicional
    if (jobPosting.job_timezone) {
      // Si es una fecha UTC y coincide con class_datetime_utc
      if (jobPosting.class_datetime_utc) {
        const utcDate = new Date(jobPosting.class_datetime_utc);
        if (Math.abs(utcDate.getTime() - date.getTime()) < 60000) { // Misma fecha aprox.
          const jobTimezoneConversion = this.timezoneService.convertFromUTC(
            utcDate, 
            jobPosting.job_timezone
          );
          
          if (jobTimezoneConversion) {
            const jobLocalDate = new Date(jobTimezoneConversion.local_datetime);
            return `${jobLocalDate.toLocaleDateString('es-ES')} ${jobLocalDate.toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit'
            })} (zona institución) / ${date.toLocaleString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              timeZoneName: 'short'
            })} (tu zona)`;
          }
        }
      }
    }
    
    // Formato estándar
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
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

  /**
   * Devuelve string con la fecha/hora en la zona del job posting y la local del usuario
   */
  formatJobPostingDateTimes(): string {
    const jobPosting = this.jobPosting;
    
    console.log('🕐 [DetailDialog] formatJobPostingDateTimes called with jobPosting:', {
      id: jobPosting?.id,
      title: jobPosting?.title,
      class_datetime_utc: jobPosting?.class_datetime_utc,
      job_timezone: jobPosting?.job_timezone,
      location_country: jobPosting?.location_country,
      location_state: jobPosting?.location_state,
      class_date: jobPosting?.class_date,
      start_time: jobPosting?.start_time
    });

    // Verificar si tenemos job_timezone
    if (!jobPosting?.job_timezone) {
      console.log('❌ [DetailDialog] formatJobPostingDateTimes: Missing job_timezone');
      return '';
    }

    let utcDate: Date | null = null;

    // Opción 1: Si existe class_datetime_utc, usarlo
    if (jobPosting.class_datetime_utc) {
      console.log('✅ [DetailDialog] Using class_datetime_utc');
      utcDate = new Date(jobPosting.class_datetime_utc);
    } 
    // Opción 2: Fallback usando class_date y start_time
    else if (jobPosting.class_date && jobPosting.start_time) {
      console.log('🔄 [DetailDialog] Fallback: Using class_date + start_time');
      
      // Convertir class_date a string si es necesario
      let classDateStr: string;
      if (jobPosting.class_date instanceof Date) {
        classDateStr = jobPosting.class_date.toISOString().split('T')[0];
      } else if (typeof jobPosting.class_date === 'string') {
        classDateStr = jobPosting.class_date;
      } else if (jobPosting.class_date && typeof jobPosting.class_date === 'object' && 'toDate' in jobPosting.class_date) {
        // Firestore Timestamp
        classDateStr = (jobPosting.class_date as { toDate(): Date }).toDate().toISOString().split('T')[0];
      } else {
        console.log('❌ [DetailDialog] Cannot parse class_date:', jobPosting.class_date);
        return '';
      }

      // Construir datetime string y convertir usando el timezone del job
      const localDateTimeStr = `${classDateStr}T${jobPosting.start_time}:00`;
      console.log('🔧 [DetailDialog] Constructed datetime string:', localDateTimeStr);
      
      // Crear fecha asumiendo que está en el timezone del job posting
      const localDate = new Date(localDateTimeStr);
      
      // Usar TimezoneService para convertir a UTC
      const utcConversion = this.timezoneService.convertToUTC(
        localDate, 
        jobPosting.job_timezone,
        jobPosting.location_country || '',
        jobPosting.location_state || ''
      );
      
      if (utcConversion) {
        utcDate = new Date(utcConversion.utc_datetime);
        console.log('✅ [DetailDialog] Converted to UTC:', utcDate.toISOString());
      } else {
        console.log('❌ [DetailDialog] Failed to convert to UTC');
        return '';
      }
    } else {
      console.log('❌ [DetailDialog] formatJobPostingDateTimes: Missing required data', {
        hasClassDatetimeUtc: !!jobPosting?.class_datetime_utc,
        hasClassDate: !!jobPosting?.class_date,
        hasStartTime: !!jobPosting?.start_time,
        hasJobTimezone: !!jobPosting?.job_timezone
      });
      return '';
    }
    
    const jobTimezone = jobPosting.job_timezone;
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    console.log('🕐 [DetailDialog] formatJobPostingDateTimes: Processing data', {
      utcDate: utcDate.toISOString(),
      jobTimezone,
      userTimezone
    });
    
    // Obtener nombre legible de la zona horaria del job posting
    const jobTzInfo = this.timezoneService.getTimezonesForLocation(
      jobPosting.location_country || '',
      jobPosting.location_state || ''
    )?.timezone_info.find(tz => tz.timezone === jobTimezone);
    
    const jobTzName = jobTzInfo?.display_name || jobTimezone;
    
    // Obtener nombre legible de la zona horaria local
    const localTzName = userTimezone;
    
    // Convertir UTC a hora local del job posting
    const jobTime = utcDate.toLocaleString('es-ES', { timeZone: jobTimezone });
    // Convertir UTC a hora local del usuario
    const localTime = utcDate.toLocaleString('es-ES', { timeZone: userTimezone });
    
    const result = `${jobTime} ${jobTzName}<br>(${localTime} ${localTzName})`;

    console.log('✅ [DetailDialog] formatJobPostingDateTimes: Result', {
      jobTime,
      jobTzName,
      localTime,
      localTzName,
      result
    });
    
    return result;
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
