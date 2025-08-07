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
  templateUrl: './institution-profile.component.html',
  styleUrl: './institution-profile.component.scss'
})
export class InstitutionProfileComponent implements OnInit, OnDestroy {
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
    console.log('🚀 InstitutionProfile: ngOnInit iniciado');
    console.log('🔧 InstitutionProfile: userId recibido como Input:', this.userId);
    this.loadInstitutionData();
  }

  ngOnDestroy(): void {
    console.log('🛑 InstitutionProfile: ngOnDestroy - limpiando suscripciones');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadInstitutionData(): void {
    console.log('🔄 InstitutionProfile: Iniciando loadInstitutionData');
    this.isLoading = true;
    
    // Determinar el ID del usuario (Input o usuario autenticado)
    const targetUserId$ = this.userId 
      ? of(this.userId) 
      : user(this.auth).pipe(
          map(authUser => {
            console.log('👤 InstitutionProfile: Usuario autenticado:', authUser?.uid);
            return authUser?.uid || '';
          })
        );

    console.log('🔍 InstitutionProfile: userId input:', this.userId);

    // Cargar perfil de la institución
    this.institution$ = targetUserId$.pipe(
      switchMap(userId => {
        console.log('🏢 InstitutionProfile: Obteniendo institución para userId:', userId);
        if (!userId) {
          console.log('⚠️ InstitutionProfile: No hay userId, retornando undefined');
          return of(undefined);
        }
        
        const institutionObs = this.institutionService.getInstitution(userId);
        console.log('🔍 InstitutionProfile: Observable de institución creado');
        return institutionObs.pipe(
          map(institution => {
            console.log('🏢 InstitutionProfile: Respuesta de Firestore:', institution ? 'ENCONTRADA' : 'NO ENCONTRADA');
            if (institution) {
              console.log('📋 InstitutionProfile: Datos de institución:', institution.name);
            }
            return institution;
          })
        );
      }),
      takeUntil(this.destroy$)
    );
    
    // Cargar estadísticas combinadas
    this.stats$ = targetUserId$.pipe(
      switchMap(userId => {
        console.log('📊 InstitutionProfile: Cargando estadísticas para userId:', userId);
        if (!userId) {
          console.log('⚠️ InstitutionProfile: No hay userId para estadísticas, retornando datos vacíos');
          return of({ tutorsCount: 0, studentsCount: 0, recentTutors: [], recentStudents: [] });
        }
        
        console.log('📈 InstitutionProfile: Obteniendo tutores y estudiantes...');
        return combineLatest([
          this.tutorService.getTutorsByInstitution(userId),
          this.studentService.getStudentsByInstitution(userId)
        ]).pipe(
          map(([tutors, students]) => {
            console.log('✅ InstitutionProfile: Datos obtenidos - Tutores:', tutors.length, 'Estudiantes:', students.length);
            const stats = {
              tutorsCount: tutors.length,
              studentsCount: students.length,
              recentTutors: tutors.slice(0, 5),
              recentStudents: students.slice(0, 5)
            };
            console.log('📋 InstitutionProfile: Estadísticas procesadas:', stats);
            return stats;
          })
        );
      }),
      takeUntil(this.destroy$)
    );
    
    // Combinar ambos observables y manejar loading de manera coordinada
    combineLatest([this.institution$, this.stats$]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([institution, stats]) => {
        console.log('🔄 InstitutionProfile: Datos combinados recibidos');
        console.log('🏢 InstitutionProfile: Institución:', institution ? 'ENCONTRADA' : 'NO ENCONTRADA');
        console.log('📊 InstitutionProfile: Estadísticas:', stats);
        this.isLoading = false;
        console.log('✅ InstitutionProfile: Carga completada, isLoading = false');
      },
      error: (error) => {
        console.error('❌ InstitutionProfile: Error en datos combinados:', error);
        this.isLoading = false;
      }
    });
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

  createInstitutionProfile(): void {
    console.log('🆕 InstitutionProfile: Creando nuevo perfil de institución');
    
    // Abrir dialog sin datos existentes para crear nuevo perfil
    const dialogRef = this.dialog.open(InstitutionEditDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { institution: null } // null indica que es creación
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('✅ InstitutionProfile: Perfil creado, recargando datos');
        // Recargar el perfil después de crear
        this.loadInstitutionData();
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
