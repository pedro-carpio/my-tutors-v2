import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
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
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { LayoutComponent } from '../../layout/layout.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { JobPostingDetailDialogComponent } from './job-posting-detail-dialog/job-posting-detail-dialog.component';

import { SessionService, JobPostingService, MultiRoleService } from '../../../services';
import { JobPosting, UserRole, JobPostingStatus, ClassType, ClassModality } from '../../../types/firestore.types';

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
  private multiRoleService = inject(MultiRoleService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Estado del componente
  isLoading = false;
  currentUserRole: UserRole | null = null;
  jobPostings: JobPosting[] = [];
  filteredJobPostings: JobPosting[] = [];
  
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
        this.jobPostings = jobPostings;
        this.applyFilters();
        this.isLoading = false;
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
    this.isLoading = true;
    
    return new Promise((resolve, reject) => {
      let jobPostings$;
      
      switch (this.currentUserRole) {
        case 'institution':
          // Para instituciones: sus propias convocatorias
          const currentUser = this.sessionService.currentUser;
          if (currentUser?.uid) {
            jobPostings$ = this.jobPostingService.getJobPostingsByInstitution(currentUser.uid);
          } else {
            jobPostings$ = this.jobPostingService.getAllJobPostings();
          }
          break;
          
        case 'tutor':
          // Para tutores: trabajos disponibles y asignados
          jobPostings$ = this.jobPostingService.getAvailableJobPostings();
          break;
          
        case 'admin':
          // Para admins: todas las convocatorias
          jobPostings$ = this.jobPostingService.getAllJobPostings();
          break;
          
        default:
          jobPostings$ = this.jobPostingService.getAllJobPostings();
      }

      jobPostings$.pipe(takeUntil(this.destroy$)).subscribe({
        next: (jobPostings) => resolve(jobPostings),
        error: (error) => reject(error)
      });
    });
  }

  // Métodos de filtrado
  applyFilters(): void {
    let filtered = [...this.jobPostings];

    // Filtro por estado
    if (this.statusFilter) {
      filtered = filtered.filter(job => job.status === this.statusFilter);
    }

    // Filtro por tipo
    if (this.typeFilter) {
      filtered = filtered.filter(job => job.class_type === this.typeFilter);
    }

    // Filtro por modalidad
    if (this.modalityFilter) {
      filtered = filtered.filter(job => job.modality === this.modalityFilter);
    }

    // Filtro por búsqueda de texto
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(term) ||
        job.program.toLowerCase().includes(term) ||
        job.students.some(student => student.name.toLowerCase().includes(term))
      );
    }

    this.filteredJobPostings = filtered;
  }

  onStatusFilterChange(): void {
    this.applyFilters();
  }

  onTypeFilterChange(): void {
    this.applyFilters();
  }

  onModalityFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
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
    return this.currentUserRole === 'tutor' && 
           jobPosting.status === 'published' && 
           !jobPosting.assigned_tutor_id;
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
    console.log('Apply to job:', jobPosting);
    // TODO: Lógica para que el tutor aplique al trabajo
  }

  assignTutor(jobPosting: JobPosting): void {
    console.log('Assign tutor to job:', jobPosting);
    // TODO: Abrir diálogo para seleccionar tutor
  }

  completeJob(jobPosting: JobPosting): void {
    if (!this.canCompleteJob(jobPosting)) {
      console.warn('User does not have permission to complete this job posting');
      return;
    }
    
    console.log('Complete job:', jobPosting);
    this.jobPostingService.updateJobPostingStatus(jobPosting.id, 'completed')
      .then(() => {
        // Actualizar la lista
        this.loadJobPostings();
      })
      .catch(error => {
        console.error('Error completing job:', error);
      });
  }

  cancelJob(jobPosting: JobPosting): void {
    if (!this.canCancelJob(jobPosting)) {
      console.warn('User does not have permission to cancel this job posting');
      return;
    }
    
    console.log('Cancel job:', jobPosting);
    this.jobPostingService.updateJobPostingStatus(jobPosting.id, 'cancelled')
      .then(() => {
        // Actualizar la lista
        this.loadJobPostings();
      })
      .catch(error => {
        console.error('Error cancelling job:', error);
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

  getStudentCount(students: any[]): number {
    return students?.length || 0;
  }

  logout(): void {
    this.sessionService.logout();
  }
}
