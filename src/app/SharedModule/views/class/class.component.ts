import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ClassInstanceService } from '../../../services/class-instance.service';
import { SessionService } from '../../../services/session.service';
import { TutorService } from '../../../services/tutor.service';
import { StudentService } from '../../../services/student.service';
import { InstitutionService } from '../../../services/institution.service';
import { I18nService } from '../../../services/i18n.service';
import { LayoutComponent } from '../../layout/layout.component';
import { ClassInstance, ClassStatus, Tutor, Student, Institution } from '../../../types/firestore.types';

@Component({
  selector: 'app-class',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    LayoutComponent
  ],
  templateUrl: './class.component.html',
  styleUrl: './class.component.scss'
})
export class ClassComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private classInstanceService = inject(ClassInstanceService);
  private sessionService = inject(SessionService);
  private tutorService = inject(TutorService);
  private studentService = inject(StudentService);
  private institutionService = inject(InstitutionService);
  private i18nService = inject(I18nService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private destroy$ = new Subject<void>();

  // Estado del componente
  isLoading = false;
  isEditing = false;
  classId: string | null = null;
  currentUser = this.sessionService.currentUser;
  userRole: string = '';

  // Datos
  classInstance: ClassInstance | null = null;
  tutor: Tutor | null = null;
  institution: Institution | null = null;

  // Formulario
  classForm!: FormGroup;

  // Opciones
  classStatuses: ClassStatus[] = ['scheduled', 'ongoing', 'completed', 'cancelled'];

  ngOnInit(): void {
    this.initializeForm();
    this.loadClassId();
    this.checkUserRole();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.classForm = this.fb.group({
      class_date: ['', [Validators.required]],
      start_time: ['', [Validators.required]],
      duration_minutes: [60, [Validators.required, Validators.min(15)]],
      location: [''],
      video_call_link: [''],
      notes: [''],
      status: ['scheduled', [Validators.required]]
    });
  }

  private loadClassId(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.classId = params['id'];
      if (this.classId) {
        this.loadClass();
      }
    });
  }

  private checkUserRole(): void {
    // Verificar el rol del usuario actual
    if (this.currentUser) {
      // Simplificado - asumir que hay un campo role o verificar por tipo de usuario
      this.userRole = 'institution'; // Por ahora hardcodeado
    }
  }

  private async loadClass(): Promise<void> {
    if (!this.classId) return;

    this.isLoading = true;
    try {
      this.classInstanceService.getClassInstance(this.classId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: async (classInstance) => {
          if (classInstance) {
            this.classInstance = classInstance;
            this.populateForm();
            await this.loadAdditionalData();
          } else {
            this.showError('Clase no encontrada');
            this.router.navigate(['/']);
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading class:', error);
          this.showError('Error al cargar la clase');
          this.isLoading = false;
        }
      });
    } catch (error) {
      console.error('Error loading class:', error);
      this.showError('Error al cargar la clase');
      this.isLoading = false;
    }
  }

  private populateForm(): void {
    if (!this.classInstance) return;

    // Convertir fecha si es necesario
    let classDate = this.classInstance.class_date;
    if (classDate && typeof classDate === 'object' && 'toDate' in classDate) {
      classDate = (classDate as any).toDate();
    }

    this.classForm.patchValue({
      class_date: classDate,
      start_time: this.classInstance.start_time,
      duration_minutes: this.classInstance.duration_minutes,
      location: this.classInstance.location || '',
      video_call_link: this.classInstance.video_call_link || '',
      notes: this.classInstance.notes || '',
      status: this.classInstance.status
    });
  }

  private async loadAdditionalData(): Promise<void> {
    if (!this.classInstance) return;

    try {
      // Cargar tutor
      this.tutorService.getTutor(this.classInstance.tutor_id).pipe(
        takeUntil(this.destroy$)
      ).subscribe(tutor => {
        this.tutor = tutor || null;
      });

      // Cargar institución
      this.institutionService.getInstitution(this.classInstance.institution_id).pipe(
        takeUntil(this.destroy$)
      ).subscribe(institution => {
        this.institution = institution || null;
      });
    } catch (error) {
      console.error('Error loading additional data:', error);
    }
  }

  canEdit(): boolean {
    return this.userRole === 'institution' && 
           this.classInstance?.status === 'scheduled';
  }

  canCancel(): boolean {
    return this.userRole === 'institution' && 
           ['scheduled', 'ongoing'].includes(this.classInstance?.status || '');
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      this.populateForm(); // Reset form if canceling edit
    }
  }

  async saveChanges(): Promise<void> {
    if (!this.classForm.valid || !this.classId) {
      return;
    }

    this.isLoading = true;
    try {
      const formValue = this.classForm.value;
      await this.classInstanceService.updateClassInstance(this.classId, {
        class_date: formValue.class_date,
        start_time: formValue.start_time,
        duration_minutes: formValue.duration_minutes,
        location: formValue.location,
        video_call_link: formValue.video_call_link,
        notes: formValue.notes,
        status: formValue.status
      });

      this.showSuccess('Clase actualizada exitosamente');
      this.isEditing = false;
      this.loadClass(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating class:', error);
      this.showError('Error al actualizar la clase');
    } finally {
      this.isLoading = false;
    }
  }

  async cancelClass(): Promise<void> {
    if (!this.classId) return;

    // TODO: Mostrar dialog de confirmación
    if (confirm('¿Estás seguro de que quieres cancelar esta clase?')) {
      this.isLoading = true;
      try {
        await this.classInstanceService.updateClassStatus(this.classId, 'cancelled');
        this.showSuccess('Clase cancelada exitosamente');
        this.loadClass(); // Reload to get updated data
      } catch (error) {
        console.error('Error canceling class:', error);
        this.showError('Error al cancelar la clase');
      } finally {
        this.isLoading = false;
      }
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    
    try {
      let dateObj = date;
      if (typeof date === 'object' && 'toDate' in date) {
        dateObj = date.toDate();
      }
      return new Date(dateObj).toLocaleDateString();
    } catch (error) {
      return '';
    }
  }

  formatTime(time: string): string {
    if (!time) return '';
    return time;
  }

  getStatusColor(status: ClassStatus): string {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'ongoing': return 'accent';
      case 'completed': return 'primary';
      case 'cancelled': return 'warn';
      default: return 'primary';
    }
  }

  getStatusText(status: ClassStatus): string {
    const translations = {
      'scheduled': 'Programada',
      'ongoing': 'En curso',
      'completed': 'Completada',
      'cancelled': 'Cancelada'
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

  goBack(): void {
    this.router.navigate(['/']);
  }

  logout(): void {
    this.sessionService.logout();
  }
}
