import { Component, Inject, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { Subject, firstValueFrom } from 'rxjs';
import { takeUntil, timeout } from 'rxjs/operators';

import { TutorPostulationService } from '../../../../services/tutor-postulation.service';
import { UserService } from '../../../../services/user.service';
import { InstitutionService } from '../../../../services/institution.service';
import { EmailService } from '../../../../services/email.service';
import { TimezoneService } from '../../../../services/timezone.service';
import { ClassInstanceService } from '../../../../services/class-instance.service';
import { FormatJobDateTimePipe } from '../../../../pipes/format-job-datetime.pipe';
// import { CreateClassDialogComponent } from '../create-class-dialog/create-class-dialog.component';
import { JobPosting, TutorPostulation, User, PostulationStatus } from '../../../../types/firestore.types';

export interface PostulationsListDialogData {
  jobPosting: JobPosting;
}

interface PostulationWithTutor extends TutorPostulation {
  tutorData?: User;
  displayName: string;
}

/**
 * PostulationsListDialogComponent
 * 
 * Componente que gestiona la visualización y administración de postulaciones para ofertas de trabajo
 * de las instituciones educativas. Proporciona funcionalidades para aceptar/rechazar postulaciones
 * y enviar notificaciones automáticas por email.
 * 
 * TODO: GENERAR DOCUMENTO DE CLASE COMPLETO
 * El documento debe incluir:
 * - Diagrama de arquitectura del sistema de postulaciones
 * - Especificación técnica detallada de la integración con EmailService
 * - Flujo de estados de las postulaciones (pending → accepted/rejected)
 * - Documentación de todos los templates de email utilizados
 * - Casos de uso y escenarios de prueba
 * - Guía de troubleshooting para problemas de notificaciones
 * - Métricas y logs de seguimiento del sistema
 * - Documentación de la API de Firestore y las reglas de seguridad
 * - Manual de administración para instituciones
 * - Especificaciones de UI/UX con mockups y wireframes
 * - Configuración de internacionalización para emails multiidioma
 * - Políticas de privacidad y protección de datos personales
 * - Integración con sistema de calendario y recordatorios
 * - Workflow de escalación para postulaciones no respondidas
 * - Documentación de testing automatizado e2e
 */
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
    MatTooltipModule,
    FormatJobDateTimePipe
  ],
  templateUrl: './postulations-list-dialog.component.html',
  styleUrl: './postulations-list-dialog.component.scss'
})
export class PostulationsListDialogComponent implements OnInit, OnDestroy {
  private tutorPostulationService = inject(TutorPostulationService);
  private userService = inject(UserService);
  private institutionService = inject(InstitutionService);
  private emailService = inject(EmailService);
  private timezoneService = inject(TimezoneService);
  private classInstanceService = inject(ClassInstanceService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  /**
   * Devuelve string con la fecha/hora precalculada
   * @deprecated Use formattedDateTime property or FormatJobDateTimePipe instead
   */
  formatJobPostingDateTimes(): string {
    // Devolver la fecha precalculada para evitar ciclos infinitos
    return this.formattedDateTime;
  }

  // Estado del componente
  isLoading = false;
  isProcessingAction = false;
  allPostulations: PostulationWithTutor[] = [];
  pendingPostulations: PostulationWithTutor[] = [];
  acceptedPostulations: PostulationWithTutor[] = [];
  formattedDateTime: string = '';

  displayedColumns: string[] = ['tutor', 'status', 'postulated_at', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<PostulationsListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PostulationsListDialogData
  ) {
    // Inicializar la fecha formateada una vez
    this.formattedDateTime = this.calculateFormattedDateTime();
  }

  /**
   * Calcula la fecha formateada una sola vez para evitar ciclos infinitos
   */
  private calculateFormattedDateTime(): string {
    const jobPosting = this.data.jobPosting;
    
    // Implementación simplificada sin logging excesivo
    if (!jobPosting) return 'Fecha por confirmar';
    
    try {
      // Si existe class_datetime_utc
      if (jobPosting.class_datetime_utc) {
        const utcDate = new Date(jobPosting.class_datetime_utc);
        if (!isNaN(utcDate.getTime())) {
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
      
      // Fallback con class_date y start_time
      if (jobPosting.class_date && jobPosting.start_time) {
        const date = jobPosting.class_date instanceof Date ? 
          jobPosting.class_date : 
          new Date(jobPosting.class_date as string);
        
        if (!isNaN(date.getTime())) {
          return `${date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} a las ${jobPosting.start_time}`;
        }
      }
      
      return 'Fecha por confirmar';
    } catch (error) {
      console.error('❌ [PostulationsDialog] Error calculating date:', error);
      return 'Fecha por confirmar';
    }
  }

  ngOnInit(): void {
    console.log('🚀 [PostulationsDialog] Componente inicializado');
    console.log('📝 [PostulationsDialog] Job Posting recibido:', this.data.jobPosting);
    
    // Verificar servicios
    console.log('🔍 [PostulationsDialog] Verificando servicios disponibles:');
    console.log('   - tutorPostulationService:', !!this.tutorPostulationService);
    console.log('   - userService:', !!this.userService);
    console.log('   - snackBar:', !!this.snackBar);
    console.log('   - dialog:', !!this.dialog);
    console.log('   - cdr:', !!this.cdr);
    
    this.loadPostulations();
  }

  ngOnDestroy(): void {
    console.log('🛑 [PostulationsDialog] Componente destruyéndose');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadPostulations(): Promise<void> {
    console.log('🔄 [PostulationsDialog] === INICIANDO CARGA DE POSTULACIONES ===');
    console.log('📝 [PostulationsDialog] Job Posting ID:', this.data.jobPosting.id);
    
    // Inicializar estado
    this.isLoading = true;
    this.allPostulations = [];
    this.pendingPostulations = [];
    this.acceptedPostulations = [];
    this.cdr.detectChanges();
    
    try {
      // Obtener postulaciones desde el servicio
      const postulations = await new Promise<TutorPostulation[]>((resolve, reject) => {
        this.tutorPostulationService.getPostulationsByJobPosting(this.data.jobPosting.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (data) => {
              console.log('✅ [PostulationsDialog] Postulaciones obtenidas:', data.length);
              resolve(data);
            },
            error: (error) => {
              console.error('❌ [PostulationsDialog] Error obteniendo postulaciones:', error);
              reject(error);
            }
          });
      });

      console.log('📊 [PostulationsDialog] Postulaciones recibidas:', postulations);

      // Si no hay postulaciones, terminar aquí
      if (postulations.length === 0) {
        console.log('⚠️ [PostulationsDialog] No hay postulaciones');
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }

      // Enriquecer cada postulación con datos del tutor
      console.log('🔄 [PostulationsDialog] Enriqueciendo postulaciones...');
      const enrichedPostulations: PostulationWithTutor[] = [];

      for (let i = 0; i < postulations.length; i++) {
        const postulation = postulations[i];
        //TODO: Implementar el corespondiente y verificado 
        console.log(`👤 [PostulationsDialog] Procesando postulación ${i + 1}/${postulations.length}:`, {
          id: postulation.id,
          tutor_id: postulation.tutor_id,
          status: postulation.status,
        });

        let tutorData: User | undefined;
        let displayName = 'Tutor sin nombre';

        console.log(`🔍 [PostulationsDialog] Verificando tutor_id para postulación ${postulation.id}:`, postulation.tutor_id);

        if (postulation.tutor_id) {
          console.log(`🔄 [PostulationsDialog] tutor_id existe, iniciando llamada al servicio...`);
          console.log(`📋 [PostulationsDialog] Valor de tutor_id:`, {
            id: postulation.tutor_id,
            tipo: typeof postulation.tutor_id,
            longitud: postulation.tutor_id.length
          });

          try {
            console.log(`🚀 [PostulationsDialog] Llamando a userService.getUser('${postulation.tutor_id}')...`);
            
            // Verificar que el servicio existe
            if (!this.userService) {
              console.error(`❌ [PostulationsDialog] userService no está disponible!`);
              throw new Error('UserService no está disponible');
            }

            console.log(`🔍 [PostulationsDialog] userService disponible, llamando getUser()...`);
            const userObservable = this.userService.getUser(postulation.tutor_id);
            
            if (!userObservable) {
              console.error(`❌ [PostulationsDialog] getUser() devolvió null/undefined`);
              throw new Error('getUser() devolvió null/undefined');
            }

            console.log(`🔍 [PostulationsDialog] Observable obtenido:`, {
              observable: userObservable,
              tipo: typeof userObservable,
              esObservable: userObservable.constructor?.name === 'Observable'
            });

            console.log(`🔍 [PostulationsDialog] Observable obtenido, convirtiendo a Promise con firstValueFrom()...`);
            
            try {
              // Agregar timeout de 10 segundos para evitar cuelgues
              const userObservableWithTimeout = userObservable.pipe(timeout(10000));
              console.log(`⏰ [PostulationsDialog] Timeout de 10 segundos agregado al Observable`);
              
              tutorData = await firstValueFrom(userObservableWithTimeout);
              console.log(`✅ [PostulationsDialog] firstValueFrom() completado exitosamente`);
            } catch (conversionError) {
              console.error(`❌ [PostulationsDialog] Error en firstValueFrom():`, {
                error: conversionError,
                mensaje: conversionError instanceof Error ? conversionError.message : 'Error desconocido',
                esTimeout: conversionError instanceof Error && conversionError.name === 'TimeoutError',
                tutorId: postulation.tutor_id
              });
              throw conversionError;
            }
            
            console.log(`📊 [PostulationsDialog] Resultado de toPromise():`, {
              resultado: tutorData,
              tipo: typeof tutorData,
              esNull: tutorData === null,
              esUndefined: tutorData === undefined,
              tieneEmail: tutorData?.email ? true : false
            });

            if (tutorData) {
              displayName = tutorData.email || `Tutor ${postulation.tutor_id.substring(0, 8)}`;
              console.log(`✅ [PostulationsDialog] Datos del tutor obtenidos exitosamente:`, {
                postulationId: postulation.id,
                tutorId: postulation.tutor_id,
                tutorEmail: tutorData.email,
                displayName: displayName,
                tutorData: tutorData
              });
            } else {
              console.warn(`⚠️ [PostulationsDialog] tutorData es null/undefined para tutor_id: ${postulation.tutor_id}`);
              displayName = `Tutor ${postulation.tutor_id.substring(0, 8)}`;
            }

          } catch (error) {
            console.error(`❌ [PostulationsDialog] Error completo obteniendo tutor ${postulation.tutor_id}:`, {
              error: error,
              mensaje: error instanceof Error ? error.message : 'Error desconocido',
              stack: error instanceof Error ? error.stack : 'No stack disponible',
              postulationId: postulation.id,
              tutorId: postulation.tutor_id
            });
            
            // Establecer un displayName por defecto en caso de error
            displayName = `Tutor ${postulation.tutor_id.substring(0, 8)} (Error)`;
          }
        } else {
          console.warn(`⚠️ [PostulationsDialog] Postulación ${postulation.id} NO tiene tutor_id`);
          displayName = 'Tutor sin ID';
        }

        console.log(`📋 [PostulationsDialog] Resultado final para postulación ${postulation.id}:`, {
          tutorId: postulation.tutor_id,
          displayName: displayName,
          tieneTutorData: !!tutorData,
          tutorEmail: tutorData?.email
        });

        enrichedPostulations.push({
          ...postulation,
          tutorData,
          displayName
        });

        console.log(`✅ [PostulationsDialog] Postulación ${i + 1} procesada y agregada al array:`, {
          id: postulation.id,
          displayName: displayName,
          status: postulation.status,
          arrayLength: enrichedPostulations.length
        });
      }

      console.log(`📊 [PostulationsDialog] Bucle completado. Array final:`, {
        totalProcessed: enrichedPostulations.length,
        originalLength: postulations.length,
        allIds: enrichedPostulations.map(p => ({ id: p.id, name: p.displayName, status: p.status }))
      });

      // Actualizar todas las postulaciones
      this.allPostulations = enrichedPostulations;
      console.log('✅ [PostulationsDialog] Postulaciones enriquecidas asignadas a this.allPostulations:', this.allPostulations.length);

      // Filtrar por estado
      this.filterPostulationsByStatus();

      console.log('📊 [PostulationsDialog] === RESUMEN FINAL ===');
      console.log(`   Total: ${this.allPostulations.length}`);
      console.log(`   Pendientes: ${this.pendingPostulations.length}`);
      console.log(`   Aceptadas: ${this.acceptedPostulations.length}`);

    } catch (error) {
      console.error('❌ [PostulationsDialog] Error en carga:', error);
      this.snackBar.open('Error al cargar las postulaciones', 'Cerrar', { duration: 3000 });
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
      console.log('✅ [PostulationsDialog] === CARGA COMPLETADA ===');
    }
  }

  private filterPostulationsByStatus(): void {
    console.log('🔄 [PostulationsDialog] === INICIANDO FILTRADO DE POSTULACIONES ===');
    console.log('📊 [PostulationsDialog] Estado antes del filtrado:', {
      allPostulationsLength: this.allPostulations.length,
      allPostulations: this.allPostulations.map(p => ({ 
        id: p.id, 
        status: p.status, 
        displayName: p.displayName,
        tutorId: p.tutor_id 
      }))
    });
    
    // Filtrar pendientes
    console.log('🔍 [PostulationsDialog] Filtrando postulaciones pendientes...');
    this.pendingPostulations = this.allPostulations.filter(p => {
      const isPending = p.status === 'pending';
      console.log(`📋 [PostulationsDialog] Postulación ${p.id}: status='${p.status}', isPending=${isPending}`);
      return isPending;
    });
    
    // Filtrar aceptadas
    console.log('🔍 [PostulationsDialog] Filtrando postulaciones aceptadas...');
    this.acceptedPostulations = this.allPostulations.filter(p => {
      const isAccepted = p.status === 'accepted';
      console.log(`📋 [PostulationsDialog] Postulación ${p.id}: status='${p.status}', isAccepted=${isAccepted}`);
      return isAccepted;
    });
    
    console.log('📊 [PostulationsDialog] === RESULTADO DEL FILTRADO ===');
    console.log(`   Total original: ${this.allPostulations.length}`);
    console.log(`   Pendientes filtradas: ${this.pendingPostulations.length}`);
    console.log(`   Aceptadas filtradas: ${this.acceptedPostulations.length}`);
    
    // Log detallado para debugging
    if (this.pendingPostulations.length > 0) {
      console.log('⏳ [PostulationsDialog] Postulaciones PENDIENTES encontradas:', 
        this.pendingPostulations.map(p => ({ 
          id: p.id, 
          tutor: p.displayName, 
          status: p.status,
          tutorData: !!p.tutorData 
        })));
    } else {
      console.warn('⚠️ [PostulationsDialog] NO se encontraron postulaciones pendientes');
    }
    
    if (this.acceptedPostulations.length > 0) {
      console.log('✅ [PostulationsDialog] Postulaciones ACEPTADAS encontradas:', 
        this.acceptedPostulations.map(p => ({ 
          id: p.id, 
          tutor: p.displayName, 
          status: p.status,
          tutorData: !!p.tutorData 
        })));
    } else {
      console.log('ℹ️ [PostulationsDialog] No hay postulaciones aceptadas');
    }
    
    console.log('🔄 [PostulationsDialog] Forzando detección de cambios...');
    this.cdr.detectChanges();
    console.log('✅ [PostulationsDialog] === FILTRADO COMPLETADO ===');
  }

  async acceptPostulation(postulation: PostulationWithTutor): Promise<void> {
    console.log('✅ [PostulationsDialog] Aceptando postulación:', postulation.id);
    
    if (!postulation.id) {
      console.error('❌ [PostulationsDialog] Error: Postulación sin ID');
      return;
    }

    this.isProcessingAction = true;

    try {
      await this.tutorPostulationService.acceptPostulation(postulation.id, 'Postulación aceptada');
      console.log('✅ [PostulationsDialog] Postulación aceptada exitosamente');

      // ✅ NUEVO: Crear instancia de clase automáticamente
      try {
        console.log('📚 Creando instancia de clase para postulación aceptada...');
        
        const classId = await this.classInstanceService.createClassFromPostulation(
          postulation,
          this.data.jobPosting
        );
        
        console.log('✅ Instancia de clase creada con ID:', classId);
        
        // Agregar el link de la clase al email
        const classLink = `${window.location.origin}/class/${classId}`;
        console.log('🔗 Link de clase generado:', classLink);
        
        // Enviar email de notificación al tutor con link de la clase
        await this.sendAcceptanceEmailToTutor(postulation, classLink);
        
        this.snackBar.open('Postulación aceptada y clase creada correctamente', 'Cerrar', { 
          duration: 5000,
          panelClass: ['success-snackbar'] 
        });
        
      } catch (classError) {
        console.error('❌ Error al crear instancia de clase:', classError);
        // Continuar con el email sin el link de clase
        await this.sendAcceptanceEmailToTutor(postulation);
        
        this.snackBar.open('Postulación aceptada, pero hubo un error al crear la clase', 'Cerrar', { 
          duration: 5000,
          panelClass: ['warning-snackbar'] 
        });
      }

      this.loadPostulations(); // Recargar datos
      
      // Cerrar diálogo tras aceptación exitosa
      this.dialogRef.close(true);

    } catch (error) {
      console.error('❌ [PostulationsDialog] Error aceptando postulación:', error);
      this.snackBar.open('Error al aceptar la postulación', 'Cerrar', { duration: 3000 });
    } finally {
      this.isProcessingAction = false;
    }
  }

  async rejectPostulation(postulation: PostulationWithTutor): Promise<void> {
    console.log('❌ [PostulationsDialog] Rechazando postulación:', postulation.id);
    
    if (!postulation.id) {
      console.error('❌ [PostulationsDialog] Error: Postulación sin ID');
      return;
    }

    this.isProcessingAction = true;

    try {
      await this.tutorPostulationService.rejectPostulation(postulation.id, 'Postulación rechazada');
      console.log('✅ [PostulationsDialog] Postulación rechazada exitosamente');

      // Enviar email de notificación al tutor
      await this.sendRejectionEmailToTutor(postulation);

      this.snackBar.open('Postulación rechazada correctamente', 'Cerrar', { duration: 3000 });
      this.loadPostulations(); // Recargar datos
    } catch (error) {
      console.error('❌ [PostulationsDialog] Error rechazando postulación:', error);
      this.snackBar.open('Error al rechazar la postulación', 'Cerrar', { duration: 3000 });
    } finally {
      this.isProcessingAction = false;
    }
  }

  createClass(postulation: PostulationWithTutor): void {
    console.log('🎓 [PostulationsDialog] Iniciando proceso de creación de clase...');
    console.log('📝 [PostulationsDialog] Postulación para crear clase:', {
      id: postulation.id,
      tutorName: postulation.displayName,
      tutorEmail: postulation.tutorData?.email,
      jobTitle: this.data.jobPosting.title
    });
    
    if (!postulation.tutorData) {
      console.error('❌ [PostulationsDialog] Error: No se pueden obtener los datos del tutor');
      this.snackBar.open('No se pueden obtener los datos del tutor', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isProcessingAction = true;
    console.log('🔄 [PostulationsDialog] Estado de procesamiento activado para creación de clase');

    // Funcionalidad temporal - mostrar mensaje de que está en desarrollo
    console.log('🚧 [PostulationsDialog] Funcionalidad de crear clase en desarrollo');
    this.snackBar.open('Funcionalidad de crear clase en desarrollo', 'Cerrar', { 
      duration: 3000,
      panelClass: ['info-snackbar']
    });
    
    this.isProcessingAction = false;
    console.log('✅ [PostulationsDialog] Estado de procesamiento desactivado');
    
    // TODO: Implementar CreateClassDialogComponent
    /*
    console.log('🔄 [PostulationsDialog] Abriendo diálogo de creación de clase...');
    const dialogRef = this.dialog.open(CreateClassDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      data: {
        jobPosting: this.data.jobPosting,
        postulation: postulation,
        tutor: postulation.tutorData
      }
    });

    console.log('✅ [PostulationsDialog] Diálogo de creación de clase abierto');

    dialogRef.afterClosed().subscribe(result => {
      console.log('🔄 [PostulationsDialog] Diálogo de creación de clase cerrado');
      console.log('📝 [PostulationsDialog] Resultado del diálogo:', result);
      
      this.isProcessingAction = false;
      console.log('✅ [PostulationsDialog] Estado de procesamiento desactivado');
      
      if (result) {
        console.log('✅ [PostulationsDialog] Clase creada exitosamente');
        this.snackBar.open('Clase creada exitosamente', 'Cerrar', { 
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        console.log('🔄 [PostulationsDialog] Cerrando diálogo principal...');
        this.dialogRef.close(true);
      } else {
        console.log('ℹ️ [PostulationsDialog] Creación de clase cancelada por el usuario');
      }
    });
    */
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

  /**
   * Envía email de notificación de postulación aceptada al tutor
   */
  private async sendAcceptanceEmailToTutor(postulation: PostulationWithTutor, classLink?: string): Promise<void> {
    try {
      console.log('📧 [PostulationsDialog] Enviando email de aceptación al tutor...');
      
      if (!postulation.tutorData?.email) {
        console.warn('⚠️ [PostulationsDialog] No se puede enviar email: falta email del tutor');
        return;
      }

      // Obtener datos de la institución
      const institution = await this.institutionService.getInstitution(this.data.jobPosting.institution_id).toPromise();
      if (!institution) {
        throw new Error('No se pudo obtener la información de la institución');
      }

      // Obtener email de la institución
      const institutionUser = await this.userService.getUser(institution.user_id).toPromise();
      const institutionEmail = institutionUser?.email || institution.contact_email;

      // Preparar URL de login o clase
      const loginUrl = classLink || `${window.location.origin}/tutor/login`;

      await this.emailService.sendPostulationAcceptedEmailToTutor({
        tutorEmail: postulation.tutorData.email,
        tutorName: postulation.displayName,
        institutionName: institution.name,
        jobTitle: this.data.jobPosting.title,
        classDate: this.formatJobPostingDateTime(),
        institutionEmail: institutionEmail || institution.contact_email || 'contacto@institución.com',
        responseNotes: postulation.response_notes,
        loginUrl: loginUrl
      });

      console.log('✅ [PostulationsDialog] Email de aceptación enviado exitosamente');
      
    } catch (error) {
      console.error('❌ [PostulationsDialog] Error enviando email de aceptación:', error);
      // No lanzar el error para que no afecte el flujo principal
    }
  }

  /**
   * Envía email de notificación de postulación rechazada al tutor
   */
  private async sendRejectionEmailToTutor(postulation: PostulationWithTutor): Promise<void> {
    try {
      console.log('📧 [PostulationsDialog] Enviando email de rechazo al tutor...');
      
      if (!postulation.tutorData?.email) {
        console.warn('⚠️ [PostulationsDialog] No se puede enviar email: falta email del tutor');
        return;
      }

      // Obtener datos de la institución
      const institution = await this.institutionService.getInstitution(this.data.jobPosting.institution_id).toPromise();
      if (!institution) {
        throw new Error('No se pudo obtener la información de la institución');
      }

      await this.emailService.sendPostulationRejectedEmailToTutor({
        tutorEmail: postulation.tutorData.email,
        tutorName: postulation.displayName,
        institutionName: institution.name,
        jobTitle: this.data.jobPosting.title,
        responseNotes: postulation.response_notes,
        loginUrl: `${window.location.origin}/tutor/login`
      });

      console.log('✅ [PostulationsDialog] Email de rechazo enviado exitosamente');
      
    } catch (error) {
      console.error('❌ [PostulationsDialog] Error enviando email de rechazo:', error);
      // No lanzar el error para que no afecte el flujo principal
    }
  }

  /**
   * Formatea la fecha y hora de la convocatoria
   */
  private formatJobPostingDateTime(): string {
    // Usar class_datetime_utc si está disponible
    if (this.data.jobPosting.class_datetime_utc) {
      const utcDate = new Date(this.data.jobPosting.class_datetime_utc);
      
      // Si hay job_timezone, mostrar en esa zona horaria
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
    
    // Usar class_datetime si está disponible
    if (this.data.jobPosting.class_datetime) {
      const date = new Date(this.data.jobPosting.class_datetime);
      
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
    }
    
    // Fallback para formato legacy
    if (this.data.jobPosting.class_date && this.data.jobPosting.start_time) {
      const date = new Date(this.data.jobPosting.class_date);
      const timeString = this.data.jobPosting.start_time;
      
      if (this.data.jobPosting.job_timezone) {
        const classDateStr = date.toISOString().split('T')[0];
        const localDateTimeStr = `${classDateStr}T${timeString}:00`;
        const classDateTime = new Date(localDateTimeStr);
        
        const utcConversion = this.timezoneService.convertToUTC(
          classDateTime,
          this.data.jobPosting.job_timezone
        );
        
        if (utcConversion) {
          const utcDate = new Date(utcConversion.utc_datetime);
          return `${date.toLocaleDateString('es-ES', {
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
      
      return `${date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })} a las ${timeString}`;
    }
    
    return 'Fecha por confirmar';
  }

  formatDate(date: unknown): string {
    if (!date) return '';
    
    // Si es un Timestamp de Firestore  
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      return (date.toDate as () => Date)().toLocaleDateString('es-ES');
    }
    
    if (date instanceof Date) {
      return date.toLocaleDateString('es-ES');
    }
    
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('es-ES');
    }
    
    // Si es un objeto con seconds (Timestamp serializado)
    if (date && typeof date === 'object' && 'seconds' in date && typeof date.seconds === 'number') {
      return new Date(date.seconds * 1000).toLocaleDateString('es-ES');
    }
    
    return String(date);
  }

  formatDateTime(date: unknown): string {
    if (!date) return '';
    
    // Si es un Timestamp de Firestore
    if (date && typeof date === 'object' && 'toDate' in date && typeof date.toDate === 'function') {
      const dateObj = (date.toDate as () => Date)();
      return dateObj.toLocaleDateString('es-ES') + ' ' + 
             dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
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
    
    // Si es un objeto con seconds (Timestamp serializado)
    if (date && typeof date === 'object' && 'seconds' in date && typeof date.seconds === 'number') {
      const dateObj = new Date(date.seconds * 1000);
      return dateObj.toLocaleDateString('es-ES') + ' ' + 
             dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    }
    
    return String(date);
  }  getModalityIcon(modality: string): string {
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
