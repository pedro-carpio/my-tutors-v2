import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, switchMap, catchError } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { LayoutComponent } from '../../layout/layout.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { JobPostingDetailDialogComponent } from './job-posting-detail-dialog/job-posting-detail-dialog.component';
import { JobPostulationDialogComponent } from './job-postulation-dialog/job-postulation-dialog.component';
import { AssignTutorDialogComponent } from './assign-tutor-dialog/assign-tutor-dialog.component';
import { PostulationsListDialogComponent } from './postulations-list-dialog/postulations-list-dialog.component';

import { SessionService, JobPostingService, MultiRoleService, TutorPostulationService, ClassInstanceService } from '../../../services';
import { TimezoneService } from '../../../services/timezone.service';
import { JobPosting, UserRole, JobPostingStatus, ClassType, ClassModality, TutorPostulation, PostulationStatus } from '../../../types/firestore.types';

@Component({
  selector: 'app-job-postings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatSnackBarModule,
    MatDialogModule,
    RouterModule,
    ToolbarComponent,
    LayoutComponent,
    TranslatePipe
  ],
  templateUrl: './job-postings.component.html',
  styleUrls: ['./job-postings.component.scss']
})
export class JobPostingsComponent implements OnInit, OnDestroy {
  private sessionService = inject(SessionService);
  private jobPostingService = inject(JobPostingService);
  private tutorPostulationService = inject(TutorPostulationService);
  private classInstanceService = inject(ClassInstanceService);
  private multiRoleService = inject(MultiRoleService);
  private timezoneService = inject(TimezoneService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

    /**
     * Devuelve string con la fecha/hora en la zona del job posting y la local del usuario
     */
    formatJobPostingDateTimes(jobPosting: JobPosting): string {
      console.log('🕐 formatJobPostingDateTimes called with jobPosting:', {
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
        console.log('❌ formatJobPostingDateTimes: Missing job_timezone');
        return '';
      }

      let utcDate: Date | null = null;

      // Opción 1: Si existe class_datetime_utc, usarlo
      if (jobPosting.class_datetime_utc) {
        console.log('✅ Using class_datetime_utc');
        utcDate = new Date(jobPosting.class_datetime_utc);
      } 
      // Opción 2: Fallback usando class_date y start_time
      else if (jobPosting.class_date && jobPosting.start_time) {
        console.log('🔄 Fallback: Using class_date + start_time');
        
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
          console.log('❌ Cannot parse class_date:', jobPosting.class_date);
          return '';
        }

        // Construir datetime string y convertir usando el timezone del job
        const localDateTimeStr = `${classDateStr}T${jobPosting.start_time}:00`;
        console.log('🔧 Constructed datetime string:', localDateTimeStr);
        
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
          console.log('✅ Converted to UTC:', utcDate.toISOString());
        } else {
          console.log('❌ Failed to convert to UTC');
          return '';
        }
      } else {
        console.log('❌ formatJobPostingDateTimes: Missing both class_datetime_utc and class_date/start_time', {
          hasClassDatetimeUtc: !!jobPosting?.class_datetime_utc,
          hasClassDate: !!jobPosting?.class_date,
          hasStartTime: !!jobPosting?.start_time
        });
        return '';
      }

      const jobTimezone = jobPosting.job_timezone;
      const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      console.log('🕐 formatJobPostingDateTimes: Processing data', {
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

      console.log('✅ formatJobPostingDateTimes: Result', {
        jobTime,
        jobTzName,
        localTime,
        localTzName,
        result
      });

      return result;
    }
  // Estado del componente
  isLoading = false;
  currentUserRole: UserRole | null = null;
  jobPostings: JobPosting[] = [];
  filteredJobPostings: JobPosting[] = [];
  displayedJobPostings: JobPosting[] = []; // Jobs que se muestran después de todos los filtros
  userPostulations = new Map<string, TutorPostulation>(); // Para tutores: sus postulaciones por job
  
  // Filtros
  statusFilter: JobPostingStatus | '' = '';
  typeFilter: ClassType | '' = '';
  modalityFilter: ClassModality | '' = '';
  searchTerm = '';

  // Opciones para filtros
  statusOptions: JobPostingStatus[] = ['draft', 'published', 'assigned', 'completed', 'cancelled'];
  typeOptions: ClassType[] = ['prueba', 'regular', 'recurrente', 'intensiva'];
  modalityOptions: ClassModality[] = ['presencial', 'virtual', 'hibrida'];

  // Configuración de tabla
  displayedColumns: string[] = [];
  
  ngOnInit(): void {
    this.setupSubscriptions();
    this.setupDisplayColumns();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSubscriptions(): void {
    // Suscribirse al rol activo del usuario
    this.multiRoleService.activeRole$.pipe(
      takeUntil(this.destroy$),
      switchMap((role) => {
        this.currentUserRole = role;
        this.setupDisplayColumns();
        return this.loadJobPostings();
      })
    ).subscribe({
      next: (jobPostings) => {
        console.log('🎯 JobPostings: Jobs recibidos en setupSubscriptions:', {
          role: this.currentUserRole,
          count: jobPostings.length,
          jobIds: jobPostings.map(job => job.id)
        });
        
        this.jobPostings = jobPostings;
        
        // Para todos los roles, mostrar todos los jobs sin filtro de ubicación/idiomas
        this.filteredJobPostings = jobPostings;
        this.displayedJobPostings = jobPostings;
        
        // Cargar postulaciones si es tutor
        if (this.currentUserRole === 'tutor') {
          this.loadUserPostulations();
        }
        
        // Aplicar filtros de UI solo para instituciones y admins
        if (this.currentUserRole !== 'tutor') {
          this.applyFilters();
        }
        
        this.isLoading = false;
        
        console.log('✅ JobPostings: Jobs finales mostrados:', {
          role: this.currentUserRole,
          totalJobs: this.displayedJobPostings.length,
          filteredJobs: this.filteredJobPostings.length,
          jobIds: this.displayedJobPostings.map(job => job.id)
        });
      },
      error: (error) => {
        console.error('Error loading job postings:', error);
        this.isLoading = false;
        
        // Mostrar mensaje más específico según el tipo de error
        if (error.code === 'failed-precondition' && error.message.includes('index')) {
          console.warn('Index required for this query. Deploying indexes...');
          // Los índices ya están siendo desplegados
        } else {
          console.error('Unexpected error:', error);
        }
      }
    });
  }

  private loadUserPostulations(): void {
    const currentUser = this.sessionService.currentUser;
    if (!currentUser?.uid) {
      console.log('🚨 JobPostings: No hay usuario autenticado para cargar postulaciones');
      return;
    }

    console.log('📄 JobPostings: Cargando postulaciones del tutor:', currentUser.uid);

    this.tutorPostulationService.getPostulationsByTutor(currentUser.uid).pipe(
      takeUntil(this.destroy$),
      catchError((error) => {
        console.error('🚨 JobPostings: Error loading user postulations:', error);
        
        // Manejo específico de errores de permisos de Firebase
        if (error.code === 'permission-denied' || error.message.includes('insufficient permissions')) {
          console.warn('⚠️ JobPostings: Error de permisos - Posiblemente faltan reglas de Firestore para tutor_postulations');
          console.warn('💡 JobPostings: Continuando sin postulaciones - funcionalidad limitada');
          
          // Retornar array vacío para continuar con funcionalidad limitada
          return of([]);
        }
        
        // Para otros errores, también continuar pero loggear más información
        console.warn('⚠️ JobPostings: Error no relacionado con permisos, continuando con array vacío:', error);
        return of([]);
      })
    ).subscribe({
      next: (postulations) => {
        console.log('✅ JobPostings: Postulaciones cargadas exitosamente:', postulations.length);
        this.userPostulations.clear();
        postulations.forEach(postulation => {
          this.userPostulations.set(postulation.job_posting_id, postulation);
        });
        console.log('📋 JobPostings: Map de postulaciones actualizado:', this.userPostulations.size, 'entries');
      },
      error: (error) => {
        // Este error no debería ocurrir debido al catchError, pero por si acaso
        console.error('🚨 JobPostings: Error final no capturado:', error);
      }
    });
  }

  private setupDisplayColumns(): void {
    const baseColumns = ['title', 'class_date', 'total_duration_minutes', 'students', 'status'];
    
    switch (this.currentUserRole) {
      case 'institution':
        this.displayedColumns = [...baseColumns, 'assigned_tutor_id', 'actions'];
        break;
      case 'tutor':
        this.displayedColumns = [...baseColumns, 'institution', 'actions'];
        break;
      case 'admin':
        this.displayedColumns = [...baseColumns, 'institution', 'assigned_tutor_id', 'actions'];
        break;
      default:
        this.displayedColumns = baseColumns;
    }
  }

  private loadJobPostings(): Promise<JobPosting[]> {
    console.log('Loading job postings for role:', this.currentUserRole);
    this.isLoading = true;
    
    return new Promise((resolve, reject) => {
      let jobPostings$;
      
      switch (this.currentUserRole) {
        case 'institution': {
          // Para instituciones: sus propias convocatorias
          const currentUser = this.sessionService.currentUser;
          if (currentUser?.uid) {
            console.log('Loading job postings for institution:', currentUser.uid);
            jobPostings$ = this.jobPostingService.getJobPostingsByInstitution(currentUser.uid);
          } else {
            console.log('No current user, loading all job postings');
            jobPostings$ = this.jobPostingService.getAllJobPostings();
          }
          break;
        }
          
        case 'tutor': {
          // Para tutores: trabajos personalizados basados en su perfil
          const currentUser = this.sessionService.currentUser;
          if (currentUser?.uid) {
            console.log('🎯 JobPostings: Cargando trabajos personalizados para tutor:', currentUser.uid);
            jobPostings$ = this.jobPostingService.getPersonalizedJobPostingsForTutor(currentUser.uid);
          } else {
            console.log('⚠️ JobPostings: No hay usuario - cargando trabajos disponibles');
            jobPostings$ = this.jobPostingService.getAvailableJobPostings();
          }
          break;
        }
          
        case 'admin':
          // Para admins: todas las convocatorias
          console.log('Loading all job postings for admin');
          jobPostings$ = this.jobPostingService.getAllJobPostings();
          break;
          
        default:
          console.log('Loading all job postings for default role');
          jobPostings$ = this.jobPostingService.getAllJobPostings();
      }

      jobPostings$.pipe(takeUntil(this.destroy$)).subscribe({
        next: (jobPostings) => {
          console.log('📊 JobPostings: Jobs cargados desde backend:', {
            role: this.currentUserRole,
            count: jobPostings.length,
            jobs: jobPostings.map(job => ({
              id: job.id,
              title: job.title,
              status: job.status,
              modality: job.modality,
              location_country: job.location_country,
              location_state: job.location_state,
              class_datetime_utc: job.class_datetime_utc,
              job_timezone: job.job_timezone,
              class_date: job.class_date,
              start_time: job.start_time
            }))
          });
          resolve(jobPostings);
        },
        error: (error) => {
          console.error('🚨 JobPostings: Error cargando jobs desde backend:', error);
          reject(error);
        }
      });
    });
  }

  // Métodos de filtrado - Solo habilitados para instituciones y admins
  applyFilters(): void {
    if (this.currentUserRole === 'tutor') {
      console.log('� JobPostings: Filtros deshabilitados para tutores - usando filtro automático por ubicación e idiomas');
      return;
    }

    console.log('�🔍 JobPostings: Aplicando filtros', {
      currentUserRole: this.currentUserRole,
      totalJobPostings: this.jobPostings.length,
      statusFilter: this.statusFilter,
      typeFilter: this.typeFilter,
      modalityFilter: this.modalityFilter,
      searchTerm: this.searchTerm
    });

    // Para otros roles, empezar con todas las ofertas
    const baseJobs = [...this.jobPostings];

    console.log('📋 JobPostings: Base de trabajos para filtros:', baseJobs.length);

    let filtered = [...baseJobs];

    // Filtro por estado
    if (this.statusFilter) {
      filtered = filtered.filter(job => job.status === this.statusFilter);
      console.log(`📊 JobPostings: Después de filtro de status (${this.statusFilter}):`, filtered.length);
    }

    // Filtro por tipo
    if (this.typeFilter) {
      filtered = filtered.filter(job => job.class_type === this.typeFilter);
      console.log(`📊 JobPostings: Después de filtro de tipo (${this.typeFilter}):`, filtered.length);
    }

    // Filtro por modalidad
    if (this.modalityFilter) {
      filtered = filtered.filter(job => job.modality === this.modalityFilter);
      console.log(`📊 JobPostings: Después de filtro de modalidad (${this.modalityFilter}):`, filtered.length);
    }

    // Filtro por búsqueda de texto
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.program.toLowerCase().includes(term) ||
        job.students.some(student => student.name.toLowerCase().includes(term))
      );
      console.log(`📊 JobPostings: Después de filtro de búsqueda (${this.searchTerm}):`, filtered.length);
    }

    this.filteredJobPostings = filtered;
    this.displayedJobPostings = filtered;

    console.log('✅ JobPostings: Filtros aplicados - Jobs a mostrar:', this.displayedJobPostings.length);
  }

  onStatusFilterChange(): void {
    if (this.currentUserRole === 'tutor') {
      console.log('� JobPostings: Filtro de status deshabilitado para tutores');
      return;
    }
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    if (this.currentUserRole === 'tutor') {
      console.log('🚫 JobPostings: Filtro de tipo deshabilitado para tutores');
      return;
    }
    this.applyFilters();
  }

  onModalityFilterChange(): void {
    if (this.currentUserRole === 'tutor') {
      console.log('🚫 JobPostings: Filtro de modalidad deshabilitado para tutores');
      return;
    }
    this.applyFilters();
  }

  onSearchChange(): void {
    if (this.currentUserRole === 'tutor') {
      console.log('🚫 JobPostings: Filtro de búsqueda deshabilitado para tutores');
      return;
    }
    this.applyFilters();
  }

  // Métodos de acciones según el rol
  canCreateJobPosting(): boolean {
    return this.currentUserRole === 'institution' || this.currentUserRole === 'admin';
  }

  canEditJobPosting(jobPosting: JobPosting): boolean {
    if (this.currentUserRole === 'admin') return true;
    if (this.currentUserRole === 'institution') {
      const currentUser = this.sessionService.currentUser;
      return jobPosting.institution_id === currentUser?.uid;
    }
    return false;
  }

  canApplyToJob(jobPosting: JobPosting): boolean {
    if (this.currentUserRole !== 'tutor') return false;
    if (jobPosting.status !== 'published') return false;
    if (jobPosting.assigned_tutor_id) return false;
    
    // Verificar si ya se postuló
    const postulation = this.userPostulations.get(jobPosting.id);
    return !postulation || postulation.status === 'withdrawn';
  }

  hasAppliedToJob(jobPosting: JobPosting): boolean {
    const postulation = this.userPostulations.get(jobPosting.id);
    return postulation ? ['pending', 'accepted'].includes(postulation.status) : false;
  }

  getPostulationStatus(jobPosting: JobPosting): PostulationStatus | null {
    const postulation = this.userPostulations.get(jobPosting.id);
    return postulation?.status || null;
  }

  canWithdrawApplication(jobPosting: JobPosting): boolean {
    const postulation = this.userPostulations.get(jobPosting.id);
    return postulation?.status === 'pending';
  }

  canViewPostulations(jobPosting: JobPosting): boolean {
    return !!(this.currentUserRole === 'institution' || this.currentUserRole === 'admin') &&
           jobPosting.status === 'published';
  }

  canCreateClassFromJob(jobPosting: JobPosting): boolean {
    return !!(this.currentUserRole === 'institution' || this.currentUserRole === 'admin') &&
           jobPosting.status === 'assigned' &&
           !!jobPosting.assigned_tutor_id;
  }

  canAssignTutor(jobPosting: JobPosting): boolean {
    return (this.currentUserRole === 'institution' || this.currentUserRole === 'admin') &&
           jobPosting.status === 'published';
  }

  canCancelJob(jobPosting: JobPosting): boolean {
    // Los administradores pueden cancelar cualquier convocatoria
    if (this.currentUserRole === 'admin') return true;
    
    // Las instituciones pueden cancelar sus propias convocatorias
    if (this.currentUserRole === 'institution') {
      const currentUser = this.sessionService.currentUser;
      return jobPosting.institution_id === currentUser?.uid;
    }
    
    // Los tutores solo pueden cancelar convocatorias asignadas a ellos
    if (this.currentUserRole === 'tutor') {
      const currentUser = this.sessionService.currentUser;
      return jobPosting.assigned_tutor_id === currentUser?.uid && 
             jobPosting.status === 'assigned';
    }
    
    return false;
  }

  canPublishJob(jobPosting: JobPosting): boolean {
    // Solo se puede publicar si está en estado 'draft'
    if (jobPosting.status !== 'draft') return false;
    
    // Los administradores pueden publicar cualquier convocatoria
    if (this.currentUserRole === 'admin') return true;
    
    // Las instituciones pueden publicar sus propias convocatorias
    if (this.currentUserRole === 'institution') {
      const currentUser = this.sessionService.currentUser;
      return jobPosting.institution_id === currentUser?.uid;
    }
    
    return false;
  }

  canHideJob(jobPosting: JobPosting): boolean {
    // Solo se puede esconder si está en estado 'published'
    if (jobPosting.status !== 'published') return false;
    
    // Los administradores pueden esconder cualquier convocatoria
    if (this.currentUserRole === 'admin') return true;
    
    // Las instituciones pueden esconder sus propias convocatorias
    if (this.currentUserRole === 'institution') {
      const currentUser = this.sessionService.currentUser;
      return jobPosting.institution_id === currentUser?.uid;
    }
    
    return false;
  }

  canCompleteJob(jobPosting: JobPosting): boolean {
    // Los administradores pueden completar cualquier convocatoria
    if (this.currentUserRole === 'admin') return true;
    
    // Las instituciones pueden completar sus propias convocatorias asignadas
    if (this.currentUserRole === 'institution') {
      const currentUser = this.sessionService.currentUser;
      return jobPosting.institution_id === currentUser?.uid && 
             jobPosting.status === 'assigned';
    }
    
    // Los tutores solo pueden completar convocatorias asignadas a ellos
    if (this.currentUserRole === 'tutor') {
      const currentUser = this.sessionService.currentUser;
      return jobPosting.assigned_tutor_id === currentUser?.uid && 
             jobPosting.status === 'assigned';
    }
    
    return false;
  }

  // Métodos de acciones
  createJobPosting(): void {
    this.router.navigate(['/job-postings/create']);
  }

  viewJobPosting(jobPosting: JobPosting): void {
    const dialogRef = this.dialog.open(JobPostingDetailDialogComponent, {
      data: { jobPosting },
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      autoFocus: false,
      restoreFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      // Aquí se puede manejar alguna acción después de cerrar el diálogo si es necesario
      console.log('Dialog was closed');
    });
  }

  editJobPosting(jobPosting: JobPosting): void {
    this.router.navigate(['/job-postings/edit', jobPosting.id]);
  }

  applyToJob(jobPosting: JobPosting): void {
    if (!this.canApplyToJob(jobPosting)) {
      this.showError('No puedes postularte a esta convocatoria');
      return;
    }

    const currentUser = this.sessionService.currentUser;
    if (!currentUser?.uid) {
      this.showError('Usuario no autenticado');
      return;
    }

    // Abrir el diálogo avanzado de postulación
    const dialogRef = this.dialog.open(JobPostulationDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: {
        jobPosting: jobPosting,
        currentUserId: currentUser.uid
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recargar las postulaciones del usuario
        this.loadUserPostulations();
        this.showSuccess('¡Postulación enviada exitosamente!');
      }
    });
  }

  withdrawApplication(jobPosting: JobPosting): void {
    const postulation = this.userPostulations.get(jobPosting.id);
    if (!postulation || !this.canWithdrawApplication(jobPosting)) {
      this.showError('No puedes retirar esta postulación');
      return;
    }

    this.tutorPostulationService.withdrawPostulation(postulation.id!).then(() => {
      this.showSuccess('Postulación retirada exitosamente');
      this.loadUserPostulations();
    }).catch(error => {
      console.error('Error withdrawing application:', error);
      this.showError('Error al retirar la postulación');
    });
  }

  viewPostulations(jobPosting: JobPosting): void {
    if (!this.canViewPostulations(jobPosting)) {
      this.showError('No tienes permisos para ver las postulaciones');
      return;
    }

    const dialogRef = this.dialog.open(PostulationsListDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        jobPosting: jobPosting
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si se creó una clase, actualizar la lista
        this.isLoading = true;
        this.loadJobPostings().then((jobPostings) => {
          this.jobPostings = jobPostings;
          this.applyFilters();
          this.isLoading = false;
        }).catch(error => {
          console.error('Error loading job postings:', error);
          this.isLoading = false;
        });
      }
    });
  }

  createClassFromJob(jobPosting: JobPosting): void {
    if (!this.canCreateClassFromJob(jobPosting)) {
      this.showError('No puedes crear una clase desde esta convocatoria');
      return;
    }

    // TODO: Abrir diálogo para configurar los detalles de la clase
    console.log('Create class from job:', jobPosting);
  }

  assignTutor(jobPosting: JobPosting): void {
    if (!this.canAssignTutor(jobPosting)) {
      this.showError('No tienes permisos para asignar un tutor');
      return;
    }

    const dialogRef = this.dialog.open(AssignTutorDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {
        jobPosting: jobPosting
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Si se asignó un tutor exitosamente, actualizar la lista
        this.isLoading = true;
        this.loadJobPostings().then((jobPostings) => {
          this.jobPostings = jobPostings;
          this.applyFilters();
          this.isLoading = false;
          this.snackBar.open('Tutor asignado exitosamente', 'Cerrar', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }).catch(error => {
          console.error('Error loading job postings:', error);
          this.isLoading = false;
        });
      }
    });
  }

  completeJob(jobPosting: JobPosting): void {
    if (!this.canCompleteJob(jobPosting)) {
      console.warn('User does not have permission to complete this job posting');
      return;
    }
    
    this.isLoading = true;
    console.log('Complete job:', jobPosting);
    this.jobPostingService.updateJobPostingStatus(jobPosting.id, 'completed')
      .then(() => {
        this.showSuccess('Convocatoria completada exitosamente');
        // Actualizar la lista
        return this.loadJobPostings();
      })
      .then((jobPostings) => {
        this.jobPostings = jobPostings;
        this.applyFilters();
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error completing job:', error);
        this.showError('Error al completar la convocatoria');
        this.isLoading = false;
      });
  }

  cancelJob(jobPosting: JobPosting): void {
    if (!this.canCancelJob(jobPosting)) {
      console.warn('User does not have permission to cancel this job posting');
      return;
    }
    
    this.isLoading = true;
    console.log('Cancel job:', jobPosting);
    this.jobPostingService.updateJobPostingStatus(jobPosting.id, 'cancelled')
      .then(() => {
        this.showSuccess('Convocatoria cancelada exitosamente');
        // Actualizar la lista
        return this.loadJobPostings();
      })
      .then((jobPostings) => {
        this.jobPostings = jobPostings;
        this.applyFilters();
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error cancelling job:', error);
        this.showError('Error al cancelar la convocatoria');
        this.isLoading = false;
      });
  }

  publishJob(jobPosting: JobPosting): void {
    if (!this.canPublishJob(jobPosting)) {
      this.showError('No tienes permisos para publicar esta convocatoria');
      return;
    }
    
    console.log('Publishing job posting:', jobPosting.id);
    this.isLoading = true;
    this.jobPostingService.updateJobPostingStatus(jobPosting.id, 'published')
      .then(() => {
        console.log('Job posting published successfully');
        this.showSuccess('Convocatoria publicada exitosamente');
        // Actualizar la lista
        return this.loadJobPostings();
      })
      .then((jobPostings) => {
        console.log('Loaded job postings after publish:', jobPostings.length);
        this.jobPostings = jobPostings;
        this.applyFilters();
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error publishing job:', error);
        this.showError('Error al publicar la convocatoria');
        this.isLoading = false;
      });
  }

  hideJob(jobPosting: JobPosting): void {
    if (!this.canHideJob(jobPosting)) {
      this.showError('No tienes permisos para esconder esta convocatoria');
      return;
    }
    
    console.log('Hiding job posting:', jobPosting.id);
    this.isLoading = true;
    this.jobPostingService.updateJobPostingStatus(jobPosting.id, 'draft')
      .then(() => {
        console.log('Job posting hidden successfully');
        this.showSuccess('Convocatoria escondida exitosamente');
        // Actualizar la lista
        return this.loadJobPostings();
      })
      .then((jobPostings) => {
        console.log('Loaded job postings after hide:', jobPostings.length);
        this.jobPostings = jobPostings;
        this.applyFilters();
        this.isLoading = false;
      })
      .catch(error => {
        console.error('Error hiding job:', error);
        this.showError('Error al esconder la convocatoria');
        this.isLoading = false;
      });
  }

  // Métodos de utilidad
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

  formatDate(value: any): string {
    if (!value) return '';
    
    // Si es un Timestamp de Firestore
    if (value && typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString();
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

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString;
  }

  // ✅ ACTUALIZADO: Método para formatear fecha y hora combinadas con timezone
  formatDateTime(dateTime: any, jobPosting?: JobPosting): string {
    if (!dateTime) return '';
    
    let date: Date | null = null;
    
    // Convertir el valor a Date
    if (dateTime && typeof dateTime.toDate === 'function') {
      date = dateTime.toDate();
    } else if (dateTime instanceof Date) {
      date = dateTime;
    } else if (typeof dateTime === 'string') {
      date = new Date(dateTime);
    } else if (dateTime && typeof dateTime === 'object' && dateTime.seconds) {
      date = new Date(dateTime.seconds * 1000);
    }
    
    if (!date || isNaN(date.getTime())) {
      return dateTime?.toString() || '';
    }
    
    // Si hay jobPosting y job_timezone, mostrar información de zona horaria
    if (jobPosting && jobPosting.job_timezone) {
      // Si la fecha viene de class_datetime_utc, convertir desde UTC
      if (jobPosting.class_datetime_utc) {
        const utcDate = new Date(jobPosting.class_datetime_utc);
        const jobTimezoneConversion = this.timezoneService.convertFromUTC(
          utcDate, 
          jobPosting.job_timezone
        );
        
        if (jobTimezoneConversion) {
          const jobLocalDate = new Date(jobTimezoneConversion.local_datetime);
          return `${jobLocalDate.toLocaleDateString('es-ES')} ${jobLocalDate.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })} (zona institución)`;
        }
      }
      
      // Si es class_datetime sin UTC, asumir que está en job_timezone
      if (jobPosting.class_datetime && !jobPosting.class_datetime_utc) {
        const utcConversion = this.timezoneService.convertToUTC(
          date,
          jobPosting.job_timezone
        );
        
        if (utcConversion) {
          const utcDate = new Date(utcConversion.utc_datetime);
          return `${date.toLocaleDateString('es-ES')} ${date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
          })} (zona institución)`;
        }
      }
    }
    
    // Formato estándar sin información de timezone
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStudentCount(students: any[]): number {
    return students?.length || 0;
  }

  logout(): void {
    this.sessionService.logout();
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
}
