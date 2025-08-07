import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Observable, of } from 'rxjs';
import { InstitutionService } from '../../../../services/institution.service';
import { TutorService } from '../../../../services/tutor.service';
import { StudentService } from '../../../../services/student.service';
import { Institution, Tutor, Student } from '../../../../types/firestore.types';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { InstitutionEditDialogComponent } from './institution-edit-dialog/institution-edit-dialog.component';

@Component({
  selector: 'app-intitution-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    TranslatePipe
  ],
  templateUrl: './intitution-profile.component.html',
  styleUrl: './intitution-profile.component.scss'
})
export class IntitutionProfileComponent implements OnInit, OnDestroy {
  @Input() userId!: string;
  
  private destroy$ = new Subject<void>();
  private institutionService = inject(InstitutionService);
  private tutorService = inject(TutorService);
  private studentService = inject(StudentService);
  private dialog = inject(MatDialog);

  institution$: Observable<Institution | undefined> = of(undefined);
  tutors$: Observable<Tutor[]> = of([]);
  students$: Observable<Student[]> = of([]);
  isLoading = false;

  ngOnInit(): void {
    if (this.userId) {
      this.loadInstitutionProfile();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInstitutionProfile(): void {
    this.isLoading = true;
    
    // Cargar perfil de la institución
    this.institution$ = this.institutionService.getInstitution(this.userId);
    
    // Cargar tutores de la institución
    this.tutors$ = this.tutorService.getTutorsByInstitution(this.userId);
    
    // Cargar estudiantes de la institución
    this.students$ = this.studentService.getStudentsByInstitution(this.userId);
    
    // Simular carga completa
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  openEditDialog(): void {
    this.institution$.subscribe(institution => {
      if (institution) {
        const dialogRef = this.dialog.open(InstitutionEditDialogComponent, {
          width: '800px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: { institution }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Recargar el perfil después de editar
            this.loadInstitutionProfile();
          }
        });
      }
    });
  }

  getContactInfo(institution: Institution): string[] {
    const contacts = [];
    if (institution.phone) contacts.push(`Tel: ${institution.phone}`);
    if (institution.contact_email) contacts.push(`Email: ${institution.contact_email}`);
    if (institution.website_url) contacts.push(`Web: ${institution.website_url}`);
    return contacts;
  }
}
