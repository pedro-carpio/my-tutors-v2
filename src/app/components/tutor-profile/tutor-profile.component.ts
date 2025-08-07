import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, map, switchMap, of } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { TutorService } from '../../services/tutor.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { TutorEditDialogComponent } from '../tutor-edit-dialog/tutor-edit-dialog.component';
import { Tutor, Availability } from '../../types/firestore.types';

@Component({
  selector: 'app-tutor-profile',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatDialogModule,
    TranslatePipe
  ],
  templateUrl: './tutor-profile.component.html',
  styleUrls: ['./tutor-profile.component.scss']
})
export class TutorProfileComponent implements OnInit {
  private auth = inject(Auth);
  private tutorService = inject(TutorService);
  private i18n = inject(I18nService);
  private dialog = inject(MatDialog);

  tutorData$!: Observable<Tutor | null>;

  ngOnInit() {
    this.loadTutorData();
  }

  private loadTutorData() {
    this.tutorData$ = user(this.auth).pipe(
      switchMap(authUser => {
        if (authUser) {
          return this.tutorService.getTutor(authUser.uid).pipe(
            map(tutor => tutor || null)
          );
        }
        return of(null);
      })
    );
  }

    formatAvailability(availability: Availability[] | undefined): string {
    if (!availability || availability.length === 0) {
      return this.i18n.translate('common.notSpecified');
    }
    
    return availability.map(av => {
      const dayKey = `weekDays.${av.week_day.toLowerCase()}`;
      const dayName = this.i18n.translate(dayKey);
      return `${dayName}: ${av.hours.join(', ')}`;
    }).join(' | ');
  }

  openEditDialog() {
    const dialogRef = this.dialog.open(TutorEditDialogComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recargar datos si se guardaron cambios
        this.loadTutorData();
      }
    });
  }
}
