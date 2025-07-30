import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

import { TranslatePipe } from '../../../../pipes/translate.pipe';
import { JobPosting, ClassType, ClassModality, JobPostingStatus, FrequencyType } from '../../../../types/firestore.types';

@Component({
  selector: 'app-job-posting-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDividerModule,
    MatListModule,
    TranslatePipe
  ],
  templateUrl: './job-posting-detail-dialog.component.html',
  styleUrls: ['./job-posting-detail-dialog.component.scss']
})
export class JobPostingDetailDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<JobPostingDetailDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { jobPosting: JobPosting }
  ) {}

  get jobPosting(): JobPosting {
    return this.data.jobPosting;
  }

  onClose(): void {
    this.dialogRef.close();
  }

  getStatusColor(status: JobPostingStatus): string {
    const colors = {
      draft: 'accent',
      published: 'primary',
      assigned: 'warn',
      completed: 'primary',
      cancelled: ''
    };
    return colors[status] || '';
  }

  getModalityIcon(modality: ClassModality): string {
    const icons = {
      presencial: 'location_on',
      virtual: 'videocam',
      hibrida: 'swap_horiz'
    };
    return icons[modality] || 'help';
  }

  getClassTypeIcon(classType: ClassType): string {
    const icons = {
      prueba: 'quiz',
      regular: 'school',
      recurrente: 'repeat',
      intensiva: 'flash_on'
    };
    return icons[classType] || 'class';
  }

  formatDate(value: any): string {
    if (!value) return '';
    
    // Si es un Timestamp de Firestore
    if (value && typeof value.toDate === 'function') {
      return value.toDate().toLocaleDateString();
    }
    
    // Si ya es un Date
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    // Si es un string, intentar convertir
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    return value.toString();
  }

  formatDateTime(value: any): string {
    if (!value) return '';
    
    // Si es un Timestamp de Firestore
    if (value && typeof value.toDate === 'function') {
      return value.toDate().toLocaleString();
    }
    
    // Si ya es un Date
    if (value instanceof Date) {
      return value.toLocaleString();
    }
    
    // Si es un string, intentar convertir
    if (typeof value === 'string') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleString();
      }
    }
    
    return value.toString();
  }

  formatTime(timeString: string): string {
    if (!timeString) return '';
    return timeString;
  }

  formatDuration(minutes: number): string {
    if (!minutes) return '';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0 && remainingMinutes > 0) {
      return `${hours}h ${remainingMinutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${remainingMinutes}min`;
    }
  }

  getStudentAge(age: number): string {
    if (!age) return '';
    return `${age} años`;
  }
}
