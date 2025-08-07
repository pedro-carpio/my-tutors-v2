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
import { TutorService } from '../../../../services/tutor.service';
import { UserLanguageService } from '../../../../services/tutor-language.service';
import { LanguageService } from '../../../../services/language.service';
import { Tutor, UserLanguage, Availability } from '../../../../types/firestore.types';
import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { TutorEditDialogComponent } from './tutor-edit-dialog/tutor-edit-dialog.component';

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
    TranslatePipe
  ],
  templateUrl: './tutor-profile.component.html',
  styleUrl: './tutor-profile.component.scss'
})
export class TutorProfileComponent implements OnInit, OnDestroy {
  @Input() userId!: string;
  
  private destroy$ = new Subject<void>();
  private tutorService = inject(TutorService);
  private userLanguageService = inject(UserLanguageService);
  private languageService = inject(LanguageService);
  private dialog = inject(MatDialog);

  tutor$: Observable<Tutor | undefined> = of(undefined);
  tutorLanguages$: Observable<UserLanguage[]> = of([]);
  isLoading = false;

  ngOnInit(): void {
    if (this.userId) {
      this.loadTutorProfile();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTutorProfile(): void {
    this.isLoading = true;
    
    // Cargar perfil del tutor
    this.tutor$ = this.tutorService.getTutor(this.userId);
    
    // Cargar idiomas del tutor
    this.tutorLanguages$ = this.userLanguageService.getLanguagesByTutor(this.userId);
    
    // Simular carga completa
    setTimeout(() => {
      this.isLoading = false;
    }, 1000);
  }

  openEditDialog(): void {
    this.tutor$.subscribe(tutor => {
      if (tutor) {
        const dialogRef = this.dialog.open(TutorEditDialogComponent, {
          width: '900px',
          maxWidth: '95vw',
          maxHeight: '90vh',
          data: { tutor }
        });

        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            // Recargar el perfil después de editar
            this.loadTutorProfile();
          }
        });
      }
    });
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
}
