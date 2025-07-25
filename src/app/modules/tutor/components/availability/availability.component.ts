import { Component, inject, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SetAvailabilityDialogComponent } from './set-availability-dialog/set-availability-dialog.component';
import { Availability } from '../../../../types/firestore.types';
import { TutorService } from '../../../../services/tutor.service';
import { AvailabilityService } from '../../../../services/availability.service';
import { Auth, user } from '@angular/fire/auth';

@Component({
  selector: 'app-availability',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  templateUrl: './availability.component.html',
  styleUrl: './availability.component.scss'
})
export class AvailabilityComponent implements OnInit {
  @Input() tutorId?: string; // ID del tutor parametrizado (opcional)
  
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private tutorService = inject(TutorService);
  private availabilityService = inject(AvailabilityService);
  private auth = inject(Auth);

  availability: Availability[] = [];
  currentUserId: string | null = null;
  targetTutorId: string | null = null; // ID del tutor cuya disponibilidad se está mostrando

  weekDays = [
    { key: 'Monday', name: 'Lunes' },
    { key: 'Tuesday', name: 'Martes' },
    { key: 'Wednesday', name: 'Miércoles' },
    { key: 'Thursday', name: 'Jueves' },
    { key: 'Friday', name: 'Viernes' },
    { key: 'Saturday', name: 'Sábado' },
    { key: 'Sunday', name: 'Domingo' }
  ];

  hours = Array.from({ length: 24 }, (_, i) => i); // 0-23 horas
  displayHours: (number | string)[] = []; // Hours to display including separators

  ngOnInit(): void {
    // Obtener el usuario actual
    user(this.auth).subscribe(authUser => {
      if (authUser) {
        this.currentUserId = authUser.uid;
        
        // Determinar el ID del tutor objetivo
        this.targetTutorId = this.tutorId || this.currentUserId;
        
        this.loadAvailability();
      } else {
        // If no user, initialize empty display hours
        this.updateDisplayHours();
      }
    });
  }

  loadAvailability(): void {
    if (!this.targetTutorId) return;

    this.tutorService.getTutor(this.targetTutorId).subscribe(tutorData => {
      if (tutorData && tutorData.availability) {
        this.availability = tutorData.availability;
      } else {
        this.availability = this.getDefaultAvailability();
      }
      this.updateDisplayHours();
    });
  }

  getDefaultAvailability(): Availability[] {
    return this.availabilityService.createDefaultWeeklyAvailability();
  }

  openEditDialog(): void {
    // Determinar el tamaño del diálogo basado en el tamaño de pantalla
    const isMobile = window.innerWidth <= 768;
    const isSmallMobile = window.innerWidth <= 480;
    
    let dialogConfig: any = {
      data: { 
        availability: [...this.availability] // Copiar para no mutar el original
      },
      disableClose: true
    };

    if (isSmallMobile) {
      dialogConfig.width = '100vw';
      dialogConfig.height = '100vh';
      dialogConfig.maxWidth = '100vw';
      dialogConfig.maxHeight = '100vh';
      dialogConfig.panelClass = 'mobile-dialog';
    } else if (isMobile) {
      dialogConfig.width = '95vw';
      dialogConfig.height = '90vh';
      dialogConfig.maxWidth = '95vw';
      dialogConfig.maxHeight = '90vh';
      dialogConfig.panelClass = 'tablet-dialog';
    } else {
      dialogConfig.width = '90vw';
      dialogConfig.maxWidth = '1200px';
      dialogConfig.height = '80vh';
    }

    const dialogRef = this.dialog.open(SetAvailabilityDialogComponent, dialogConfig);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.availability = result;
        this.saveAvailability();
      }
    });
  }

  async saveAvailability(): Promise<void> {
    if (!this.targetTutorId) return;

    try {
      // Validar datos antes de guardar
      if (!this.availabilityService.validateAvailabilityData(this.availability)) {
        this.snackBar.open('Datos de disponibilidad inválidos', 'Cerrar', {
          duration: 3000
        });
        return;
      }

      await this.availabilityService.updateTutorWeeklyAvailability(this.targetTutorId, this.availability);
      this.updateDisplayHours(); // Update display after saving
      this.snackBar.open('Disponibilidad actualizada correctamente', 'Cerrar', {
        duration: 3000
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      this.snackBar.open('Error al actualizar la disponibilidad', 'Cerrar', {
        duration: 3000
      });
    }
  }

  getHoursForDay(dayKey: string): number[] {
    return this.availabilityService.getDayAvailability(this.availability, dayKey);
  }

  formatHour(hour: number): string {
    return this.availabilityService.formatHour(hour);
  }

  getAvailabilityText(dayKey: string): string {
    const summary = this.availabilityService.getAvailabilitySummary(this.availability);
    return summary[dayKey] || 'No disponible';
  }

  updateDisplayHours(): void {
    const relevantHours = this.getRelevantHours();
    this.displayHours = this.addSeparators(relevantHours);
  }

  private getRelevantHours(): number[] {
    const allHours = new Set<number>();
    
    // Collect all hours that have availability on any day
    this.availability.forEach(day => {
      day.hours.forEach(hour => allHours.add(hour));
    });

    if (allHours.size === 0) {
      return [];
    }

    // Convert to sorted array
    const sortedHours = Array.from(allHours).sort((a, b) => a - b);
    
    // Find continuous ranges
    const ranges: number[][] = [];
    let currentRange: number[] = [sortedHours[0]];
    
    for (let i = 1; i < sortedHours.length; i++) {
      if (sortedHours[i] === sortedHours[i-1] + 1) {
        // Continuous hour, add to current range
        currentRange.push(sortedHours[i]);
      } else {
        // Gap found, start new range
        ranges.push(currentRange);
        currentRange = [sortedHours[i]];
      }
    }
    ranges.push(currentRange);

    // Return all hours from all ranges
    return ranges.flat();
  }

  private addSeparators(hours: number[]): (number | string)[] {
    if (hours.length === 0) return [];
    
    const result: (number | string)[] = [];
    let currentRange: number[] = [hours[0]];
    
    for (let i = 1; i < hours.length; i++) {
      if (hours[i] === hours[i-1] + 1) {
        // Continuous hour
        currentRange.push(hours[i]);
      } else {
        // Gap found, add current range and separator
        result.push(...currentRange);
        result.push('...');
        currentRange = [hours[i]];
      }
    }
    
    // Add the last range
    result.push(...currentRange);
    
    return result;
  }

  isHour(item: number | string): boolean {
    return typeof item === 'number';
  }

  isSeparator(item: number | string): boolean {
    return item === '...';
  }

  trackByDisplayItem(index: number, item: number | string): any {
    return typeof item === 'string' ? `sep-${index}` : item;
  }

  formatHourForItem(item: number | string): string {
    return typeof item === 'number' ? this.formatHour(item) : '';
  }

  isAvailableForItem(item: number | string, dayKey: string): boolean {
    return typeof item === 'number' && this.getHoursForDay(dayKey).includes(item);
  }

  getDayShortName(dayName: string): string {
    const shortNames: { [key: string]: string } = {
      'Lunes': 'L',
      'Martes': 'M',
      'Miércoles': 'X',
      'Jueves': 'J',
      'Viernes': 'V',
      'Sábado': 'S',
      'Domingo': 'D'
    };
    return shortNames[dayName] || dayName.charAt(0);
  }

  canEditAvailability(): boolean {
    // Solo puede editar si el usuario actual es el mismo que el tutor objetivo
    return this.currentUserId !== null && this.currentUserId === this.targetTutorId;
  }
}
