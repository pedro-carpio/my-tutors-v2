import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Observable, of, combineLatest, switchMap, map } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Auth, user } from '@angular/fire/auth';
import { InstitutionService } from '../../../../services/institution.service';
import { TutorService } from '../../../../services/tutor.service';
import { StudentService } from '../../../../services/student.service';
import { Institution, Tutor, Student } from '../../../../types/firestore.types';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { InstitutionEditDialogComponent } from './institution-edit-dialog/institution-edit-dialog.component';

interface InstitutionStats {
  tutorsCount: number;
  studentsCount: number;
  recentTutors: Tutor[];
  recentStudents: Student[];
}

@Component({
  selector: 'app-institution-profile',
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
  @Input() userId?: string; // Opcional: si no se proporciona, usa el usuario autenticado
  
  private destroy$ = new Subject<void>();
  private auth = inject(Auth);
  private institutionService = inject(InstitutionService);
  private tutorService = inject(TutorService);
  private studentService = inject(StudentService);
  private dialog = inject(MatDialog);

  institution$: Observable<Institution | undefined> = of(undefined);
  stats$: Observable<InstitutionStats> = of({
    tutorsCount: 0,
    studentsCount: 0,
    recentTutors: [],
    recentStudents: []
  });
  isLoading = true;

  ngOnInit(): void {
    this.loadInstitutionData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInstitutionData(): void {
    this.isLoading = true;
    
    // Determinar el ID del usuario (Input o usuario autenticado)
    const targetUserId$ = this.userId 
      ? of(this.userId) 
      : user(this.auth).pipe(map(authUser => authUser?.uid || ''));

    // Cargar perfil de la institución
    this.institution$ = targetUserId$.pipe(
      switchMap(userId => userId ? this.institutionService.getInstitution(userId) : of(undefined)),
      takeUntil(this.destroy$)
    );
    
    // Cargar estadísticas combinadas
    this.stats$ = targetUserId$.pipe(
      switchMap(userId => {
        if (!userId) return of({ tutorsCount: 0, studentsCount: 0, recentTutors: [], recentStudents: [] });
        
        return combineLatest([
          this.tutorService.getTutorsByInstitution(userId),
          this.studentService.getStudentsByInstitution(userId)
        ]).pipe(
          map(([tutors, students]) => ({
            tutorsCount: tutors.length,
            studentsCount: students.length,
            recentTutors: tutors.slice(0, 5),
            recentStudents: students.slice(0, 5)
          }))
        );
      }),
      takeUntil(this.destroy$)
    );
    
    // Simular carga completa (remover en producción)
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
            this.loadInstitutionData();
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
