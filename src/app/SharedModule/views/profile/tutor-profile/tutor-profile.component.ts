import { Component, inject, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Auth, user } from '@angular/fire/auth';
import { Subject, Observable, of, combineLatest } from 'rxjs';
import { map, switchMap, takeUntil, take } from 'rxjs/operators';
import { TutorService } from '../../../../services/tutor.service';
import { UserLanguageService } from '../../../../services/tutor-language.service';
import { LanguageService } from '../../../../services/language.service';
import { Tutor, UserLanguage, Availability } from '../../../../types/firestore.types';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { TutorEditDialogComponent } from './tutor-edit-dialog/tutor-edit-dialog.component';
import { TutorCertificatesDialogComponent } from './tutor-certificates-dialog/tutor-certificates-dialog.component';
import { AvailabilityComponent } from '../../../../modules/tutor/components/availability/availability.component';

@Component({
  selector: 'app-tutor-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    TranslatePipe,
    AvailabilityComponent
  ],
  templateUrl: './tutor-profile.component.html',
  styleUrl: './tutor-profile.component.scss'
})
export class TutorProfileComponent implements OnInit, OnDestroy {
  @Input() userId?: string; // Opcional: si no se proporciona, usa el usuario autenticado
  
  private destroy$ = new Subject<void>();
  private auth = inject(Auth);
  private tutorService = inject(TutorService);
  private userLanguageService = inject(UserLanguageService);
  private languageService = inject(LanguageService);
  private dialog = inject(MatDialog);

  tutor$: Observable<Tutor | undefined> = of(undefined);
  tutorLanguages$: Observable<UserLanguage[]> = of([]);
  teachingLanguages$: Observable<UserLanguage[]> = of([]);
  spokenLanguages$: Observable<UserLanguage[]> = of([]);
  isLoading = true;

  ngOnInit(): void {
    console.log('🚀 TutorProfile: ngOnInit iniciado');
    console.log('🔧 TutorProfile: userId recibido como Input:', this.userId);
    this.loadTutorData();
  }

  ngOnDestroy(): void {
    console.log('🛑 TutorProfile: ngOnDestroy - limpiando suscripciones');
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTutorData(): void {
    console.log('🔄 TutorProfile: Iniciando loadTutorData');
    this.isLoading = true;
    
    // Determinar el ID del usuario (Input o usuario autenticado)
    const targetUserId$ = this.userId 
      ? of(this.userId) 
      : user(this.auth).pipe(
          map(authUser => {
            console.log('👤 TutorProfile: Usuario autenticado:', authUser?.uid);
            if (!authUser) {
              throw new Error('No hay usuario autenticado');
            }
            return authUser.uid;
          })
        );

    console.log('🔍 TutorProfile: userId input:', this.userId);

    // Cargar perfil del tutor
    this.tutor$ = targetUserId$.pipe(
      switchMap(userId => {
        console.log('🔍 TutorProfile: Buscando tutor para userId:', userId);
        return this.tutorService.getTutor(userId);
      }),
      takeUntil(this.destroy$)
    );
    
    // Cargar idiomas que enseña el tutor
    this.teachingLanguages$ = targetUserId$.pipe(
      switchMap(userId => {
        console.log('🎓 TutorProfile: Cargando idiomas que enseña para tutor:', userId);
        return this.userLanguageService.getTeachingLanguagesByTutor(userId);
      }),
      takeUntil(this.destroy$)
    );

    // Cargar todos los idiomas y filtrar los que no enseña en el cliente
    this.spokenLanguages$ = targetUserId$.pipe(
      switchMap(userId => {
        console.log('🗣️ TutorProfile: Cargando todos los idiomas para filtrar los que habla:', userId);
        return this.userLanguageService.getLanguagesByTutor(userId);
      }),
      map(languages => {
        // Filtrar en el cliente los idiomas que no son para enseñar
        return languages.filter(lang => !lang.is_teaching);
      }),
      takeUntil(this.destroy$)
    );
    
    // Mantener compatibilidad: todos los idiomas juntos
    this.tutorLanguages$ = targetUserId$.pipe(
      switchMap(userId => {
        console.log('🌐 TutorProfile: Cargando todos los idiomas para tutor:', userId);
        return this.userLanguageService.getLanguagesByTutor(userId);
      }),
      takeUntil(this.destroy$)
    );
    
    // Combinar observables y manejar loading de manera coordinada
    combineLatest([this.tutor$, this.teachingLanguages$, this.spokenLanguages$]).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ([tutor, teachingLanguages, spokenLanguages]) => {
        console.log('✅ TutorProfile: Datos cargados - Tutor:', !!tutor, 'Idiomas que enseña:', teachingLanguages.length, 'Idiomas que habla:', spokenLanguages.length);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ TutorProfile: Error al cargar datos:', error);
        this.isLoading = false;
      }
    });
  }

  openEditDialog(): void {
    this.tutor$.pipe(take(1)).subscribe(tutor => {
      if (tutor) {
        console.log('✏️ TutorProfile: Abriendo diálogo de edición para tutor:', tutor.full_name);
        
        const dialogRef = this.dialog.open(TutorEditDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: { tutor }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log('💾 TutorProfile: Diálogo cerrado con cambios, recargando datos');
            this.loadTutorData();
          } else {
            console.log('❌ TutorProfile: Diálogo cerrado sin cambios');
          }
        });
      }
    });
  }

  createTutorProfile(): void {
    console.log('🆕 TutorProfile: Creando nuevo perfil de tutor');
    
    // Abrir dialog sin datos existentes para crear nuevo perfil
    const dialogRef = this.dialog.open(TutorEditDialogComponent, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { tutor: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('💾 TutorProfile: Nuevo perfil creado, recargando datos');
        this.loadTutorData();
      } else {
        console.log('❌ TutorProfile: Creación de perfil cancelada');
      }
    });
  }

  openCertificatesDialog(): void {
    this.tutor$.pipe(take(1)).subscribe(tutor => {
      if (tutor) {
        console.log('🎓 TutorProfile: Abriendo diálogo de certificaciones para tutor:', tutor.full_name);
        
        const dialogRef = this.dialog.open(TutorCertificatesDialogComponent, {
          width: '1000px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: { 
            tutor,
            teachingCertifications: tutor.certifications || [],
            languageCertifications: tutor.language_certifications || []
          }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            console.log('💾 TutorProfile: Certificaciones actualizadas, recargando datos');
            this.loadTutorData();
          } else {
            console.log('❌ TutorProfile: Diálogo de certificaciones cerrado sin cambios');
          }
        });
      }
    });
  }

  getContactInfo(tutor: Tutor): string[] {
    const contactInfo: string[] = [];
    
    if (tutor.phone) {
      contactInfo.push(tutor.phone);
    }
    
    if (tutor.birth_language) {
      contactInfo.push(`Idioma nativo: ${tutor.birth_language}`);
    }
    
    if (tutor.hourly_rate) {
      contactInfo.push(`${tutor.hourly_rate} ${tutor.hourly_rate_currency || 'USD'}/hora`);
    }
    
    return contactInfo;
  }

  formatAvailability(availability: Availability[]): string {
    if (!availability || availability.length === 0) {
      return 'No disponibilidad configurada';
    }
    
    return availability.map(a => `${a.week_day}: ${a.hours.join(', ')}`).join(' | ');
  }

  getExperienceLevelText(level: number | string): string {
    if (typeof level === 'number') {
      return `${level} años`;
    }
    return level;
  }

  getCurrentUserId(): string | undefined {
    const currentUser = this.auth.currentUser;
    return currentUser ? currentUser.uid : this.userId;
  }
}
