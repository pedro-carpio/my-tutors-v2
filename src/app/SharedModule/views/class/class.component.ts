import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, firstValueFrom } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';

import { ClassInstance, User, Tutor, Student, Institution } from '../../../types/firestore.types';
import { ClassInstanceService } from '../../../services/class-instance.service';
import { UserService } from '../../../services/user.service';
import { TutorService } from '../../../services/tutor.service';
import { StudentService } from '../../../services/student.service';
import { InstitutionService } from '../../../services/institution.service';
import { SessionService } from '../../../services/session.service';
import { MultiRoleService } from '../../../services/multi-role.service';
import { TimezoneService } from '../../../services/timezone.service';
import { I18nService } from '../../../services/i18n.service';
import { LoadingService } from '../../../services/loading.service';

interface ClassWithDetails extends ClassInstance {
  tutorData?: Tutor;
  tutorUser?: User;
  institutionData?: Institution;
  institutionUser?: User;
  studentsData?: Student[];
}

@Component({
  selector: 'app-class',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './class.component.html',
  styleUrl: './class.component.scss'
})
export class ClassComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private classInstanceService = inject(ClassInstanceService);
  private userService = inject(UserService);
  private tutorService = inject(TutorService);
  private studentService = inject(StudentService);
  private institutionService = inject(InstitutionService);
  private sessionService = inject(SessionService);
  private multiRoleService = inject(MultiRoleService);
  private timezoneService = inject(TimezoneService);
  public i18nService = inject(I18nService);
  private loadingService = inject(LoadingService);
  
  private destroy$ = new Subject<void>();
  
  // Signals para estado reactivo
  classData = signal<ClassWithDetails | null>(null);
  currentUser = signal<User | null>(null);
  isLoading = signal(true);
  error = signal<string | null>(null);
  
  // ID de la clase desde la ruta
  classId: string | null = null;
  
  // Computed properties
  canEdit = computed(() => {
    const user = this.currentUser();
    const classInstance = this.classData();
    
    if (!user || !classInstance) return false;
    
    // El tutor de la clase puede editar
    if (user.id === classInstance.tutor_id) return true;
    
    // Los admins de la institución pueden editar
    if (user.roles.includes('institution')) {
      // Verificar si es la institución dueña de la clase
      return classInstance.institution_id === user.id;
    }
    
    // Los admins del sistema pueden editar
    if (user.roles.includes('admin')) return true;
    
    return false;
  });
  
  canConfirmAttendance = computed(() => {
    const user = this.currentUser();
    const classInstance = this.classData();
    
    if (!user || !classInstance || 
        classInstance.status === 'completed' || 
        classInstance.status === 'cancelled') {
      return false;
    }
    
    // Verificar si faltan menos de 24 horas
    const classDateTime = this.getClassDateTime();
    if (!classDateTime) return false;
    
    const now = new Date();
    const timeDiff = classDateTime.getTime() - now.getTime();
    const hoursUntilClass = timeDiff / (1000 * 60 * 60);
    
    // Solo mostrar si falta menos de 24 horas y más de 0
    if (hoursUntilClass > 24 || hoursUntilClass < 0) return false;
    
    // El tutor puede confirmar
    if (user.id === classInstance.tutor_id) return true;
    
    // Los estudiantes asignados pueden confirmar
    // TODO: Implementar lógica para verificar si el usuario es un estudiante asignado
    
    // La institución puede confirmar
    if (user.roles.includes('institution')) {
      // Verificar si es la institución dueña de la clase
      return classInstance.institution_id === user.id;
    }
    
    return false;
  });
  
  canJoinClass = computed(() => {
    const classInstance = this.classData();
    return !!classInstance?.video_call_link;
  });
  
  statusColor = computed(() => {
    const status = this.classData()?.status;
    switch (status) {
      case 'scheduled': return 'primary';
      case 'ongoing': return 'accent';
      case 'completed': return 'primary';
      case 'cancelled': return 'warn';
      default: return 'primary';
    }
  });

  ngOnInit(): void {
    console.log('🚀 ClassComponent initialized');
    
    // Obtener el ID de la clase desde la ruta
    this.classId = this.route.snapshot.paramMap.get('id');
    
    if (!this.classId) {
      this.error.set('ID de clase no proporcionado');
      this.router.navigate(['/dashboard']);
      return;
    }
    
    // TODO: Obtener usuario actual del servicio apropiado cuando esté disponible
    
    // Cargar datos de la clase
    this.loadClassData();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  public async loadClassData(): Promise<void> {
    if (!this.classId) return;
    
    try {
      this.isLoading.set(true);
      this.error.set(null);
      
      console.log('📚 Loading class data for ID:', this.classId);
      
      // Obtener datos básicos de la clase
      this.classInstanceService.getClassInstance(this.classId)
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (classInstance) => {
          if (!classInstance) {
            this.error.set('Clase no encontrada');
            this.isLoading.set(false);
            return;
          }
          
          console.log('📚 Class instance loaded:', classInstance);
          
          // Crear objeto extendido con datos adicionales
          const classWithDetails: ClassWithDetails = { ...classInstance };
          
          try {
            // Cargar datos del tutor
            if (classInstance.tutor_id) {
              try {
                const [tutorData, tutorUser] = await Promise.all([
                  firstValueFrom(this.tutorService.getTutor(classInstance.tutor_id)),
                  firstValueFrom(this.userService.getUser(classInstance.tutor_id))
                ]);
                
                classWithDetails.tutorData = tutorData || undefined;
                classWithDetails.tutorUser = tutorUser || undefined;
              } catch (error) {
                console.error('Error cargando datos del tutor:', error);
              }
            }
            
            // Cargar datos de la institución
            if (classInstance.institution_id) {
              try {
                const [institutionData, institutionUser] = await Promise.all([
                  firstValueFrom(this.institutionService.getInstitution(classInstance.institution_id)),
                  firstValueFrom(this.userService.getUser(classInstance.institution_id))
                ]);
                
                classWithDetails.institutionData = institutionData || undefined;
                classWithDetails.institutionUser = institutionUser || undefined;
              } catch (error) {
                console.error('Error cargando datos de la institución:', error);
              }
            }
            
            // TODO: Cargar datos de estudiantes cuando esté disponible la funcionalidad
            
            this.classData.set(classWithDetails);
            
          } catch (error) {
            console.error('❌ Error loading additional class data:', error);
            // Aún así mostrar los datos básicos de la clase
            this.classData.set(classWithDetails);
          } finally {
            this.isLoading.set(false);
          }
        });
        
    } catch (error) {
      console.error('❌ Error loading class data:', error);
      this.error.set('Error al cargar los datos de la clase');
      this.isLoading.set(false);
    }
  }
  
  getClassDateTime(): Date | null {
    const classInstance = this.classData();
    if (!classInstance) return null;
    
    // Priorizar class_datetime si existe
    if (classInstance.class_datetime) {
      if (classInstance.class_datetime instanceof Date) {
        return classInstance.class_datetime;
      }
      // Si es un Timestamp de Firestore
      if (typeof classInstance.class_datetime === 'object' && 'toDate' in classInstance.class_datetime) {
        return (classInstance.class_datetime as Timestamp).toDate();
      }
    }
    
    // Fallback a class_date + start_time
    if (classInstance.class_date && classInstance.start_time) {
      let date: Date;
      
      if (classInstance.class_date instanceof Date) {
        date = new Date(classInstance.class_date);
      } else if (typeof classInstance.class_date === 'object' && 'toDate' in classInstance.class_date) {
        date = (classInstance.class_date as Timestamp).toDate();
      } else {
        return null;
      }
      
      const [hours, minutes] = classInstance.start_time.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    
    return null;
  }
  
  getEndTime(): Date | null {
    const startTime = this.getClassDateTime();
    const classInstance = this.classData();
    
    if (!startTime || !classInstance?.duration_minutes) return null;
    
    return new Date(startTime.getTime() + classInstance.duration_minutes * 60 * 1000);
  }
  
  formatDateTime(date: Date | null | unknown): string {
    if (!date) return '---';
    
    let dateObj: Date | null = null;
    
    if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'object' && date && 'toDate' in date) {
      dateObj = (date as Timestamp).toDate();
    }
    
    if (!dateObj) return '---';

    return new Intl.DateTimeFormat(this.i18nService.getCurrentLanguage(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }).format(dateObj);
  }
  
  formatDuration(): string {
    const classInstance = this.classData();
    if (!classInstance?.duration_minutes) return '---';
    
    const hours = Math.floor(classInstance.duration_minutes / 60);
    const minutes = classInstance.duration_minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
    } else {
      return `${minutes}m`;
    }
  }
  
  getModalityIcon(): string {
    const modality = this.classData()?.modality;
    switch (modality) {
      case 'presencial': return 'location_on';
      case 'virtual': return 'video_call';
      case 'hibrida': return 'sync';
      default: return 'help';
    }
  }
  
  getVideoCallPlatform(): string {
    const link = this.classData()?.video_call_link;
    if (!link) return '';
    
    if (link.includes('zoom.us')) return 'Zoom';
    if (link.includes('meet.google.com')) return 'Google Meet';
    if (link.includes('teams.microsoft.com')) return 'Teams';
    if (link.includes('jitsi')) return 'Jitsi';
    
    return 'Videollamada';
  }
  
  getStatusIcon(): string {
    const status = this.classData()?.status;
    switch (status) {
      case 'scheduled': return 'event';
      case 'confirmed': return 'check_circle_outline';
      case 'ongoing': return 'play_circle';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  }
  
  editClass(): void {
    // TODO: Implementar diálogo de edición de clase
    console.log('🔧 Edit class functionality - TODO');
    this.showSnackBar('Funcionalidad de edición en desarrollo');
  }
  
  joinClass(): void {
    const videoLink = this.classData()?.video_call_link;
    if (videoLink) {
      window.open(videoLink, '_blank');
    }
  }
  
  confirmAttendance(): void {
    const dialogRef = this.dialog.open(ConfirmAttendanceDialog, {
      width: '400px',
      data: { classData: this.classData() }
    });
    
    dialogRef.afterClosed().subscribe(async (confirmed) => {
      if (confirmed && this.classId) {
        try {
          await this.classInstanceService.updateClassStatus(this.classId, 'ongoing');
          
          // Actualizar el estado local
          const currentData = this.classData();
          if (currentData) {
            this.classData.set({ ...currentData, status: 'ongoing' });
          }
          
          this.showSnackBar(this.i18nService.translate('class.messages.attendanceConfirmed'));
        } catch (error) {
          console.error('❌ Error confirming attendance:', error);
          this.showSnackBar(this.i18nService.translate('class.messages.error'));
        }
      }
    });
  }
  
  rescheduleClass(): void {
    // TODO: Implementar funcionalidad de reprogramación
    console.log('📅 Reschedule class functionality - TODO');
    this.showSnackBar('Funcionalidad de reprogramación en desarrollo');
  }
  
  cancelClass(): void {
    // TODO: Implementar diálogo de cancelación con confirmación
    console.log('❌ Cancel class functionality - TODO');
    this.showSnackBar('Funcionalidad de cancelación en desarrollo');
  }
  
  openInMap(): void {
    const location = this.classData()?.location;
    if (location) {
      const encoded = encodeURIComponent(location);
      window.open(`https://maps.google.com/maps?q=${encoded}`, '_blank');
    }
  }
  
  contactTutor(): void {
    // TODO: Implementar funcionalidad de contacto
    console.log('📞 Contact tutor functionality - TODO');
    this.showSnackBar('Funcionalidad de contacto en desarrollo');
  }
  
  viewTutorProfile(): void {
    const tutorId = this.classData()?.tutor_id;
    if (tutorId) {
      // TODO: Navegar al perfil del tutor
      console.log('👤 Navigate to tutor profile:', tutorId);
      this.showSnackBar('Navegación a perfil en desarrollo');
    }
  }
  
  uploadMaterial(): void {
    // TODO: Implementar subida de materiales
    console.log('📎 Upload material functionality - TODO');
    this.showSnackBar('Funcionalidad de subida de materiales en desarrollo');
  }
  
  setReminder(): void {
    // TODO: Implementar sistema de recordatorios
    console.log('⏰ Set reminder functionality - TODO');
    this.showSnackBar('Sistema de recordatorios en desarrollo');
  }
  
  reportIncident(): void {
    // TODO: Implementar reporte de incidencias
    console.log('🚨 Report incident functionality - TODO');
    this.showSnackBar('Sistema de reportes en desarrollo');
  }
  
  requestRecording(): void {
    // TODO: Implementar solicitud de grabación
    console.log('🎥 Request recording functionality - TODO');
    this.showSnackBar('Solicitud de grabación en desarrollo');
  }
  
  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }
  
  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}

// Componente de diálogo para confirmar asistencia
@Component({
  selector: 'app-confirm-attendance-dialog',
  template: `
    <h2 mat-dialog-title>{{ i18nService.translate('class.confirmAttendanceDialog.title') }}</h2>
    <mat-dialog-content>
      <p>{{ i18nService.translate('class.confirmAttendanceDialog.message') }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">
        {{ i18nService.translate('class.confirmAttendanceDialog.cancel') }}
      </button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">
        {{ i18nService.translate('class.confirmAttendanceDialog.confirm') }}
      </button>
    </mat-dialog-actions>
  `,
  standalone: true,
  imports: [MatDialogModule, MatButtonModule]
})
export class ConfirmAttendanceDialog {
  private dialogRef = inject(MatDialogRef<ConfirmAttendanceDialog>);
  public data = inject(MAT_DIALOG_DATA);
  public i18nService = inject(I18nService);
}
