import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, switchMap, of } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { SessionService, TutorService } from '../../../../services';
import { LayoutComponent } from '../../../../SharedModule/layout/layout.component';
import { ToolbarComponent } from '../../../../SharedModule/toolbar/toolbar.component';
import { Tutor } from '../../../../types/firestore.types';
import { AddTutorDialogComponent } from './add-tutor-dialog/add-tutor-dialog.component';

@Component({
  selector: 'app-tutors',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    LayoutComponent,
    ToolbarComponent,
    AsyncPipe
  ],
  templateUrl: './tutors.component.html',
  styleUrl: './tutors.component.scss'
})
export class TutorsComponent implements OnInit {
  private sessionService = inject(SessionService);
  private tutorService = inject(TutorService);
  private auth = inject(Auth);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tutors$: Observable<Tutor[]> = of([]);
  currentUserId: string = '';

  ngOnInit(): void {
    this.loadTutors();
  }

  loadTutors(): void {
    // Obtener el usuario actual y filtrar tutores por su institución
    this.tutors$ = user(this.auth).pipe(
      switchMap(authUser => {
        if (authUser) {
          this.currentUserId = authUser.uid;
          // TODO: Para instituciones, filtrar tutores por institution_id = userId
          // Opciones de ordenamiento disponibles:
          // - this.tutorService.getTutorsByInstitution(authUser.uid) // Orden alfabético
          // - this.tutorService.getTutorsByInstitutionSortedByRate(authUser.uid, 'asc') // Por tarifa ascendente
          // - this.tutorService.getTutorsByInstitutionSortedByRate(authUser.uid, 'desc') // Por tarifa descendente
          // - this.tutorService.getTutorsByInstitutionSortedByExperience(authUser.uid, 'desc') // Por experiencia descendente
          // - this.tutorService.getTutorsByInstitutionSortedByAvailability(authUser.uid, 'desc') // Por disponibilidad descendente
          return this.tutorService.getTutorsByInstitution(authUser.uid);
        }
        return of([]);
      })
    );
  }

  openAddTutorDialog(): void {
    const dialogRef = this.dialog.open(AddTutorDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { institutionId: this.currentUserId } // Pasar el ID de la institución
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadTutors();
        this.snackBar.open('Tutor agregado exitosamente. Se ha enviado un email con las credenciales de acceso.', 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  logout(): void {
    this.sessionService.logout();
  }
}
