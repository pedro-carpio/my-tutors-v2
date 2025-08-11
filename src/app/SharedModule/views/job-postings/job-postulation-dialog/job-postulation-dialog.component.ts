import { Component, inject } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TutorPostulationService } from '../../../../services/tutor-postulation.service';
import { JobPosting, TutorPostulation, User } from '../../../../types/firestore.types';
import { EmailService, EmailTemplate } from '../../../../services/email.service';
import { InstitutionService } from '../../../../services/institution.service';
import { UserService } from '../../../../services/user.service';
import { I18nService } from '../../../../services/i18n.service';
import { TimezoneService } from '../../../../services/timezone.service';

export interface JobPostulationDialogData {
  jobPosting: JobPosting;
  currentUserId: string;
}

interface PostulationEmailData {
  institutionName: string;
  institutionEmail: string;
  jobTitle: string;
  tutorName: string;
  tutorEmail: string;
  coverLetter: string;
  teachingApproach?: string;
  classDate: string;
  loginUrl: string;
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
    MatChipsModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './job-postulation-dialog.component.html',
  styleUrls: ['./job-postulation-dialog.component.scss']
})
export class JobPostulationDialogComponent {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private tutorPostulationService = inject(TutorPostulationService);
  private emailService = inject(EmailService);
  private institutionService = inject(InstitutionService);
  private userService = inject(UserService);
  private i18nService = inject(I18nService);
  private timezoneService = inject(TimezoneService);
  
  data = inject(MAT_DIALOG_DATA) as JobPostulationDialogData;
  dialogRef = inject(MatDialogRef<JobPostulationDialogComponent>);
  
  postulationForm!: FormGroup;
  isSubmitting = false;

  constructor() {
    this.initForm();
  }

  private initForm(): void {
    this.postulationForm = this.fb.group({
      cover_letter: [
        '', 
        [Validators.minLength(20), Validators.maxLength(1000)]
      ],
      teaching_approach: [
        '', 
        [Validators.minLength(20), Validators.maxLength(500)]
      ],
      availability_confirmation: [false, [Validators.requiredTrue]]
    });
  }

  async submitPostulation(): Promise<void> {
    if (this.postulationForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;

    try {
      console.log('🚀 [JobPostulationDialog] Iniciando proceso de postulación...');
      
      // Verificar si ya existe una postulación
      const hasExistingPostulation = await this.tutorPostulationService.hasPostulatedForJob(
        this.data.currentUserId,
        this.data.jobPosting.id
      );

      if (hasExistingPostulation) {
        this.snackBar.open(
          this.i18nService.translate('jobPostings.errors.alreadyPostulated'),
          this.i18nService.translate('common.close'),
          { duration: 4000, panelClass: ['warning-snackbar'] }
        );
        return;
      }

      const formValue = this.postulationForm.value;
      
      // Crear datos de la postulación
      const postulationData: Omit<TutorPostulation, 'id' | 'created_at' | 'updated_at' | 'postulated_at'> = {
        job_posting_id: this.data.jobPosting.id,
        tutor_id: this.data.currentUserId,
        tutor_email: '', // Se llenará con el email del tutor
        institution_id: this.data.jobPosting.institution_id,
        cover_letter: formValue.cover_letter,
        teaching_approach: formValue.teaching_approach || '',
        availability_confirmation: formValue.availability_confirmation,
        status: 'pending'
      };

      // Obtener email del tutor actual
      const tutorUser = await this.userService.getUser(this.data.currentUserId).toPromise();
      if (!tutorUser?.email) {
        throw new Error('No se pudo obtener el email del tutor');
      }
      postulationData.tutor_email = tutorUser.email;

      console.log('📝 [JobPostulationDialog] Creando postulación:', postulationData);
      
      // Crear la postulación
      const postulationId = await this.tutorPostulationService.createPostulation(postulationData);
      
      console.log('✅ [JobPostulationDialog] Postulación creada exitosamente:', postulationId);

      // Enviar email de notificación a la institución
      await this.sendInstitutionNotificationEmail(postulationData, tutorUser);

      // Mostrar mensaje de éxito
      this.snackBar.open(
        this.i18nService.translate('jobPostings.success.postulationCreated'),
        this.i18nService.translate('common.close'),
        { duration: 4000, panelClass: ['success-snackbar'] }
      );

      // Cerrar el diálogo con resultado positivo
      this.dialogRef.close(true);

    } catch (error) {
      console.error('❌ [JobPostulationDialog] Error creando postulación:', error);
      this.snackBar.open(
        this.i18nService.translate('jobPostings.errors.postulationFailed'),
        this.i18nService.translate('common.close'),
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    } finally {
      this.isSubmitting = false;
    }
  }

  private async sendInstitutionNotificationEmail(
    postulation: Omit<TutorPostulation, 'id' | 'created_at' | 'updated_at' | 'postulated_at'>, 
    tutorUser: User
  ): Promise<void> {
    try {
      console.log('📧 [JobPostulationDialog] Enviando email a la institución...');
      
      // Obtener datos de la institución
      const institution = await this.institutionService.getInstitution(postulation.institution_id).toPromise();
      if (!institution) {
        throw new Error('No se pudo obtener la información de la institución');
      }

      // Obtener email de la institución
      const institutionUser = await this.userService.getUser(institution.user_id).toPromise();
      const institutionEmail = institution.contact_email || institutionUser?.email;
      
      if (!institutionEmail) {
        throw new Error('No se pudo obtener el email de la institución');
      }

      // Enviar email usando el servicio
      await this.emailService.sendNewPostulationNotificationEmail({
        institutionEmail: institutionEmail,
        institutionName: institution.name,
        jobTitle: this.data.jobPosting.title,
        tutorName: tutorUser.email.split('@')[0] || 'Tutor',
        tutorEmail: tutorUser.email,
        coverLetter: postulation.cover_letter || '',
        teachingApproach: postulation.teaching_approach,
        classDate: this.formatJobPostingDateTime(),
        loginUrl: `${window.location.origin}/institution/login`
      });
      
      console.log('✅ [JobPostulationDialog] Email enviado exitosamente a la institución');
      
    } catch (error) {
      console.error('❌ [JobPostulationDialog] Error enviando email a institución:', error);
      // No lanzar el error para que no afecte el flujo principal
    }
  }

  private generateNewPostulationNotificationTemplate(data: PostulationEmailData): EmailTemplate {
    return {
      subject: `Nueva Postulación: ${data.jobTitle} - ${data.tutorName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📝 Nueva Postulación</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${data.institutionName}</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <p>Estimado equipo de <strong>${data.institutionName}</strong>,</p>
            
            <p>Han recibido una nueva postulación para su convocatoria de trabajo:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #667eea;">Detalles de la Convocatoria</h3>
              <p><strong>Título:</strong> ${data.jobTitle}</p>
              <p><strong>Fecha programada:</strong> ${data.classDate}</p>
            </div>

            <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; border-left: 4px solid #0066cc; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #0066cc;">Información del Tutor</h3>
              <p><strong>Nombre:</strong> ${data.tutorName}</p>
              <p><strong>Email:</strong> ${data.tutorEmail}</p>
            </div>

            <div style="background: #f0f8f0; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #28a745;">Carta de Presentación</h3>
              <p style="font-style: italic;">"${data.coverLetter}"</p>
              ${data.teachingApproach ? `
                <h4 style="color: #28a745; margin-top: 20px;">Enfoque de Enseñanza</h4>
                <p style="font-style: italic;">"${data.teachingApproach}"</p>
              ` : ''}
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.loginUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Ver Postulaciones
              </a>
            </div>

            <p>Pueden revisar esta postulación y todas las demás accediendo a su panel de administración.</p>
            
            <p style="color: #666; font-size: 14px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
              Saludos cordiales,<br>
              El equipo de My Tutors<br>
              <em>Este email se envió automáticamente cuando se recibió una nueva postulación.</em>
            </p>
          </div>
        </div>
      `,
      text: `Nueva Postulación: ${data.jobTitle}

Estimado equipo de ${data.institutionName},

Han recibido una nueva postulación para su convocatoria de trabajo.

DETALLES DE LA CONVOCATORIA:
- Título: ${data.jobTitle}
- Fecha programada: ${data.classDate}

INFORMACIÓN DEL TUTOR:
- Nombre: ${data.tutorName}
- Email: ${data.tutorEmail}

CARTA DE PRESENTACIÓN:
"${data.coverLetter}"

${data.teachingApproach ? `ENFOQUE DE ENSEÑANZA:\n"${data.teachingApproach}"` : ''}

Pueden revisar esta postulación accediendo a: ${data.loginUrl}

Saludos cordiales,
El equipo de My Tutors`
    };
  }

  private convertToDate(dateValue: unknown): Date | null {
    if (!dateValue) return null;

    // Manejar Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Manejar Firestore Timestamp
    if (dateValue && 
        typeof dateValue === 'object' && 
        'toDate' in dateValue &&
        typeof (dateValue as { toDate: unknown }).toDate === 'function') {
      try {
        const result = ((dateValue as { toDate: () => Date }).toDate());
        return result instanceof Date ? result : null;
      } catch {
        return null;
      }
    }

    // Manejar objeto con seconds (Timestamp serializado)
    if (typeof dateValue === 'object' &&
        dateValue !== null &&
        'seconds' in dateValue &&
        typeof (dateValue as { seconds: unknown }).seconds === 'number') {
      try {
        return new Date((dateValue as { seconds: number }).seconds * 1000);
      } catch {
        return null;
      }
    }

    // Manejar string
    if (typeof dateValue === 'string') {
      try {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    }

    return null;
  }

  formatJobPostingDateTime(): string {
    try {
      console.log('📅 [JobPostulationDialog] Formatting date:', this.data.jobPosting.class_datetime);
      console.log('📅 [JobPostulationDialog] Job timezone:', this.data.jobPosting.job_timezone);
      console.log('📅 [JobPostulationDialog] Type:', typeof this.data.jobPosting.class_datetime);
      
      // Verificar si existe class_datetime_utc
      if (this.data.jobPosting.class_datetime_utc) {
        console.log('📅 [JobPostulationDialog] Using UTC datetime:', this.data.jobPosting.class_datetime_utc);
        const utcDate = new Date(this.data.jobPosting.class_datetime_utc);
        
        if (!isNaN(utcDate.getTime())) {
          // Si hay job_timezone, mostrar en esa zona horaria junto con la local
          if (this.data.jobPosting.job_timezone) {
            const jobTimezoneConversion = this.timezoneService.convertFromUTC(
              utcDate, 
              this.data.jobPosting.job_timezone
            );
            if (jobTimezoneConversion) {
              const jobLocalDate = new Date(jobTimezoneConversion.local_datetime);
              const userLocalDate = new Date(utcDate.getTime());
              
              return `${jobLocalDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} a las ${jobLocalDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })} (zona institución) / ${userLocalDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })} (tu zona)`;
            }
          }
          
          // Sin timezone específico, mostrar solo hora local del usuario
          return utcDate.toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          });
        }
      }
      
      // Verificar si existe class_datetime
      if (this.data.jobPosting.class_datetime) {
        const date = this.convertToDate(this.data.jobPosting.class_datetime as unknown);
        
        if (date && !isNaN(date.getTime())) {
          console.log('📅 [JobPostulationDialog] Successfully converted date:', date);
          
          // Si hay job_timezone, convertir correctamente
          if (this.data.jobPosting.job_timezone) {
            // Convertir a UTC primero
            const utcConversion = this.timezoneService.convertToUTC(
              date,
              this.data.jobPosting.job_timezone
            );
            
            if (utcConversion) {
              const utcDate = new Date(utcConversion.utc_datetime);
              return `${date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} a las ${date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })} (zona institución) / ${utcDate.toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })} (tu zona)`;
            }
          }
          
          return date.toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        } else {
          console.warn('📅 [JobPostulationDialog] Invalid date after conversion:', date);
        }
      }
      
      // Fallback para formato legacy
      if (this.data.jobPosting.class_date && this.data.jobPosting.start_time) {
        console.log('📅 [JobPostulationDialog] Using legacy format');
        const legacyDate = this.convertToDate(this.data.jobPosting.class_date as unknown);
          
        if (legacyDate && !isNaN(legacyDate.getTime())) {
          const timeString = this.data.jobPosting.start_time;
          
          // Si hay job_timezone, mostrar información adicional
          if (this.data.jobPosting.job_timezone) {
            const classDateStr = legacyDate.toISOString().split('T')[0];
            const localDateTimeStr = `${classDateStr}T${timeString}:00`;
            const classDateTime = new Date(localDateTimeStr);
            
            const utcConversion = this.timezoneService.convertToUTC(
              classDateTime,
              this.data.jobPosting.job_timezone
            );
            
            if (utcConversion) {
              const utcDate = new Date(utcConversion.utc_datetime);
              return `${legacyDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} a las ${timeString} (zona institución) / ${utcDate.toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })} (tu zona)`;
            }
          }
          
          return `${legacyDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} a las ${timeString}`;
        }
      }
      
      console.warn('📅 [JobPostulationDialog] No valid date found, using fallback');
      return 'Fecha por confirmar';
      
    } catch (error) {
      console.error('📅 [JobPostulationDialog] Error formatting date:', error);
      console.error('📅 [JobPostulationDialog] Job posting data:', this.data.jobPosting);
      return 'Fecha por confirmar';
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.postulationForm.controls).forEach(key => {
      const control = this.postulationForm.get(key);
      control?.markAsTouched();
    });
  }

  cancel(): void {
    this.dialogRef.close(false);
  }

  // Getters para el template
  get coverLetterControl() { return this.postulationForm.get('cover_letter'); }
  get teachingApproachControl() { return this.postulationForm.get('teaching_approach'); }
  get availabilityConfirmationControl() { return this.postulationForm.get('availability_confirmation'); }

}
