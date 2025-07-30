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
import { SessionService, StudentService, UserService } from '../../../../services';
import { LayoutComponent } from '../../../../SharedModule/layout/layout.component';
import { ToolbarComponent } from '../../../../SharedModule/toolbar/toolbar.component';
import { Student } from '../../../../types/firestore.types';
import { AddStudentDialogComponent } from './add-student-dialog/add-student-dialog.component';

@Component({
  selector: 'app-students',
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
  templateUrl: './students.component.html',
  styleUrl: './students.component.scss'
})
export class StudentsComponent implements OnInit {
  private sessionService = inject(SessionService);
  private studentService = inject(StudentService);
  private auth = inject(Auth);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  students$: Observable<Student[]> = of([]);
  currentUserId: string = '';

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    // Obtener el usuario actual y filtrar estudiantes por su institución
    this.students$ = user(this.auth).pipe(
      switchMap(authUser => {
        if (authUser) {
          this.currentUserId = authUser.uid;
          // Para instituciones, filtrar estudiantes por institution_id = userId
          // Opciones de ordenamiento disponibles:
          // - this.studentService.getStudentsByInstitution(authUser.uid) // Orden alfabético
          // - this.studentService.getStudentsByInstitutionSortedByEnrollment(authUser.uid, 'desc') // Por fecha de inscripción descendente
          // - this.studentService.getStudentsByInstitutionSortedByLevel(authUser.uid, 'asc') // Por nivel CEFR ascendente
          // - this.studentService.getStudentsByInstitutionSortedByAge(authUser.uid, 'desc') // Por edad descendente
          const students = this.studentService.getStudentsByInstitution(authUser.uid);
          console.log(students)
          return students
        }
        return of([]);
      })
    );
  }

  openAddStudentDialog(): void {
    const dialogRef = this.dialog.open(AddStudentDialogComponent, {
      width: '600px',
      disableClose: true,
      data: { institutionId: this.currentUserId } // Pasar el ID de la institución
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadStudents();
        this.snackBar.open('Estudiante agregado exitosamente. Se ha enviado un email con las credenciales de acceso.', 'Cerrar', {
          duration: 5000
        });
      }
    });
  }

  logout(): void {
    this.sessionService.logout();
  }
}
