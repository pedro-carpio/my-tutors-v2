import { Component, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Availability } from '../../../../../types/firestore.types';

interface DialogData {
  availability: Availability[];
}

@Component({
  selector: 'app-set-availability-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule
  ],
  templateUrl: './set-availability-dialog.component.html',
  styleUrl: './set-availability-dialog.component.scss'
})
export class SetAvailabilityDialogComponent implements OnInit, OnDestroy {
  availability: Availability[] = [];
  
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

  // Variables para drag functionality
  isDragging = false;
  dragStartCell: { day: string, hour: number } | null = null;
  dragEndCell: { day: string, hour: number } | null = null;
  dragMode: 'select' | 'deselect' = 'select';
  previewSelection: Set<string> = new Set();

  constructor(
    private dialogRef: MatDialogRef<SetAvailabilityDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    // Clonar la disponibilidad para evitar mutar el original
    this.availability = JSON.parse(JSON.stringify(this.data.availability));
    
    // Asegurar que todos los días estén representados
    this.weekDays.forEach(day => {
      if (!this.availability.find(a => a.week_day === day.key)) {
        this.availability.push({
          week_day: day.key,
          hours: []
        });
      }
    });

    // Event listeners para manejar mouse up en toda la ventana
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('mouseleave', this.onMouseUp.bind(this));
  }

  ngOnDestroy(): void {
    document.removeEventListener('mouseup', this.onMouseUp.bind(this));
    document.removeEventListener('mouseleave', this.onMouseUp.bind(this));
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.availability);
  }

  onReset(): void {
    this.availability.forEach(day => {
      day.hours = [];
    });
    this.clearPreview();
  }

  isHourSelected(dayKey: string, hour: number): boolean {
    const dayAvailability = this.availability.find(a => a.week_day === dayKey);
    return dayAvailability ? dayAvailability.hours.includes(hour) : false;
  }

  isHourInPreview(dayKey: string, hour: number): boolean {
    return this.previewSelection.has(`${dayKey}-${hour}`);
  }

  getCellKey(dayKey: string, hour: number): string {
    return `${dayKey}-${hour}`;
  }

  onMouseDown(event: MouseEvent, dayKey: string, hour: number): void {
    event.preventDefault();
    
    this.isDragging = true;
    this.dragStartCell = { day: dayKey, hour };
    this.dragEndCell = { day: dayKey, hour };
    
    // Determinar si estamos seleccionando o deseleccionando
    this.dragMode = this.isHourSelected(dayKey, hour) ? 'deselect' : 'select';
    
    this.updatePreview();
  }

  onMouseEnter(dayKey: string, hour: number): void {
    if (this.isDragging && this.dragStartCell) {
      this.dragEndCell = { day: dayKey, hour };
      this.updatePreview();
    }
  }

  onMouseUp(): void {
    if (this.isDragging && this.dragStartCell && this.dragEndCell) {
      this.applySelection();
    }
    
    this.isDragging = false;
    this.dragStartCell = null;
    this.dragEndCell = null;
    this.clearPreview();
  }

  private updatePreview(): void {
    this.clearPreview();
    
    if (!this.dragStartCell || !this.dragEndCell) return;

    const startDayIndex = this.weekDays.findIndex(d => d.key === this.dragStartCell!.day);
    const endDayIndex = this.weekDays.findIndex(d => d.key === this.dragEndCell!.day);
    const startHour = Math.min(this.dragStartCell.hour, this.dragEndCell.hour);
    const endHour = Math.max(this.dragStartCell.hour, this.dragEndCell.hour);
    const minDayIndex = Math.min(startDayIndex, endDayIndex);
    const maxDayIndex = Math.max(startDayIndex, endDayIndex);

    for (let dayIndex = minDayIndex; dayIndex <= maxDayIndex; dayIndex++) {
      const dayKey = this.weekDays[dayIndex].key;
      for (let hour = startHour; hour <= endHour; hour++) {
        this.previewSelection.add(this.getCellKey(dayKey, hour));
      }
    }
  }

  private applySelection(): void {
    if (!this.dragStartCell || !this.dragEndCell) return;

    const startDayIndex = this.weekDays.findIndex(d => d.key === this.dragStartCell!.day);
    const endDayIndex = this.weekDays.findIndex(d => d.key === this.dragEndCell!.day);
    const startHour = Math.min(this.dragStartCell.hour, this.dragEndCell.hour);
    const endHour = Math.max(this.dragStartCell.hour, this.dragEndCell.hour);
    const minDayIndex = Math.min(startDayIndex, endDayIndex);
    const maxDayIndex = Math.max(startDayIndex, endDayIndex);

    for (let dayIndex = minDayIndex; dayIndex <= maxDayIndex; dayIndex++) {
      const dayKey = this.weekDays[dayIndex].key;
      const dayAvailability = this.availability.find(a => a.week_day === dayKey);
      
      if (dayAvailability) {
        for (let hour = startHour; hour <= endHour; hour++) {
          if (this.dragMode === 'select') {
            if (!dayAvailability.hours.includes(hour)) {
              dayAvailability.hours.push(hour);
            }
          } else {
            const index = dayAvailability.hours.indexOf(hour);
            if (index > -1) {
              dayAvailability.hours.splice(index, 1);
            }
          }
        }
        // Ordenar las horas
        dayAvailability.hours.sort((a, b) => a - b);
      }
    }
  }

  private clearPreview(): void {
    this.previewSelection.clear();
  }

  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
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

  // Prevenir la selección de texto durante el drag
  onSelectStart(event: Event): void {
    if (this.isDragging) {
      event.preventDefault();
    }
  }

  // Touch events para dispositivos móviles
  onTouchStart(event: TouchEvent, dayKey: string, hour: number): void {
    event.preventDefault();
    
    this.isDragging = true;
    this.dragStartCell = { day: dayKey, hour };
    this.dragEndCell = { day: dayKey, hour };
    
    // Determinar si estamos seleccionando o deseleccionando
    this.dragMode = this.isHourSelected(dayKey, hour) ? 'deselect' : 'select';
    
    this.updatePreview();
  }

  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging) return;
    
    event.preventDefault();
    
    // Obtener el elemento bajo el touch
    const touch = event.touches[0];
    const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
    
    if (elementBelow && elementBelow.classList.contains('hour-cell')) {
      // Extraer día y hora del elemento
      const cellElement = elementBelow as HTMLElement;
      const parentRow = cellElement.parentElement;
      
      if (parentRow && parentRow.parentElement) {
        const cellIndex = Array.from(parentRow.children).indexOf(cellElement) - 1; // -1 por la columna de tiempo
        const rowIndex = Array.from(parentRow.parentElement.children).indexOf(parentRow);
        
        if (cellIndex >= 0 && rowIndex >= 0 && cellIndex < this.weekDays.length && rowIndex < this.hours.length) {
          const dayKey = this.weekDays[cellIndex].key;
          const hour = this.hours[rowIndex];
          
          this.dragEndCell = { day: dayKey, hour };
          this.updatePreview();
        }
      }
    }
  }

  onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    
    if (this.isDragging && this.dragStartCell && this.dragEndCell) {
      this.applySelection();
    }
    
    this.isDragging = false;
    this.dragStartCell = null;
    this.dragEndCell = null;
    this.clearPreview();
  }
}
