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
  templateUrl: './postulations-list-dialog.component.html',
  styleUrl: './postulations-list-dialog.component.scss'
})
export class PostulationsListDialogComponent implements OnInit, OnDestroy {
  private tutorPostulationService = inject(TutorPostulationService);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  isLoading = false;
  isProcessingAction = false;
  allPostulations: PostulationWithTutor[] = [];
  pendingPostulations: PostulationWithTutor[] = [];
  acceptedPostulations: PostulationWithTutor[] = [];

  displayedColumns: string[] = ['tutor', 'proposed_rate', 'status', 'postulated_at', 'actions'];

  constructor(
    public dialogRef: MatDialogRef<PostulationsListDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: PostulationsListDialogData
  ) {}

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
        console.log(`👤 [PostulationsDialog] Procesando postulación ${i + 1}/${postulations.length}:`, {
          id: postulation.id,
          tutor_id: postulation.tutor_id,
          status: postulation.status,
          rate: postulation.proposed_hourly_rate
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
      this.snackBar.open('Postulación aceptada correctamente', 'Cerrar', { duration: 3000 });
      this.loadPostulations(); // Recargar datos
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
    
    // Si es un Timestamp de Firestore  
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('es-ES');
    }
    
    if (date instanceof Date) {
      return date.toLocaleDateString('es-ES');
    }
    
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('es-ES');
    }
    
    // Si es un objeto con seconds (Timestamp serializado)
    if (date && typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('es-ES');
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
    
    // Si es un objeto con seconds (Timestamp serializado)
    if (date && typeof date === 'object' && date.seconds) {
      const dateObj = new Date(date.seconds * 1000);
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
