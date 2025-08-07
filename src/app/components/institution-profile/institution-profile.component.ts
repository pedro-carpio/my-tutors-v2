import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Observable, map, combineLatest, switchMap, of } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { InstitutionService } from '../../services/institution.service';
import { TutorService } from '../../services/tutor.service';
import { StudentService } from '../../services/student.service';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { InstitutionEditDialogComponent } from '../institution-edit-dialog/institution-edit-dialog.component';

interface InstitutionData {
  name?: string;
  contactPerson?: string;
  contactEmail?: string;
  phone?: string;
  website?: string;
  address?: string;
  description?: string;
  logoUrl?: string;
  subscriptionPlan?: string;
  maxTutors?: number;
  maxStudents?: number;
  languagesOffered?: string[];
}

interface InstitutionStats {
  tutorsCount: number;
  studentsCount: number;
  recentTutors: unknown[];
  recentStudents: unknown[];
}

@Component({
  selector: 'app-institution-profile',
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
  templateUrl: './institution-profile.component.html',
  styleUrls: ['./institution-profile.component.scss']
})
export class InstitutionProfileComponent implements OnInit {
  private auth = inject(Auth);
  private institutionService = inject(InstitutionService);
  private tutorService = inject(TutorService);
  private studentService = inject(StudentService);
  private i18n = inject(I18nService);
  private dialog = inject(MatDialog);

  institutionData$!: Observable<InstitutionData | null>;
  institutionStats$!: Observable<InstitutionStats>;

  ngOnInit() {
    this.loadInstitutionData();
    this.loadInstitutionStats();
  }

  private loadInstitutionData() {
    this.institutionData$ = user(this.auth).pipe(
      switchMap(authUser => {
        if (authUser) {
          return this.institutionService.getInstitution(authUser.uid).pipe(
            map(institution => institution || null)
          );
        }
        return of(null);
      })
    );
  }

  private loadInstitutionStats() {
    this.institutionStats$ = user(this.auth).pipe(
      switchMap(authUser => {
        if (authUser) {
          return combineLatest([
            this.tutorService.getTutorsByInstitution(authUser.uid),
            this.studentService.getStudentsByInstitution(authUser.uid)
          ]).pipe(
            map(([tutors, students]) => ({
              tutorsCount: tutors.length,
              studentsCount: students.length,
              recentTutors: tutors.slice(0, 5),
              recentStudents: students.slice(0, 5)
            }))
          );
        }
        return of({
          tutorsCount: 0,
          studentsCount: 0,
          recentTutors: [],
          recentStudents: []
        });
      })
    );
  }

  openEditDialog() {
    const dialogRef = this.dialog.open(InstitutionEditDialogComponent, {
      width: '600px',
      disableClose: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recargar datos si se guardaron cambios
        this.loadInstitutionData();
      }
    });
  }
}
