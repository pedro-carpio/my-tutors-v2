import { inject, Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  updateDoc,
  setDoc,
  getDoc,
} from '@angular/fire/firestore';
import { Availability } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  private firestore: Firestore = inject(Firestore);

  // Get tutor weekly availability
  getTutorWeeklyAvailability(tutorId: string): Observable<{ availability?: Availability[] } | undefined> {
    const docRef = doc(this.firestore, 'tutors', tutorId);
    return docData(docRef) as Observable<{ availability?: Availability[] } | undefined>;
  }

  // Update tutor weekly availability
  async updateTutorWeeklyAvailability(tutorId: string, availability: Availability[]): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'tutors', tutorId);
      await updateDoc(docRef, {
        availability: availability
      });
    } catch (error) {
      console.error('Error updating tutor weekly availability:', error);
      throw error;
    }
  }

  // Set complete tutor weekly availability (replaces existing)
  async setTutorWeeklyAvailability(tutorId: string, availability: Availability[]): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'tutors', tutorId);
      await setDoc(docRef, {
        availability: availability
      }, { merge: true });
    } catch (error) {
      console.error('Error setting tutor weekly availability:', error);
      throw error;
    }
  }

  // Add hour to specific day
  async addAvailabilityHour(tutorId: string, dayKey: string, hour: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'tutors', tutorId);
      
      // Get current data
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data();
      const currentAvailability: Availability[] = currentData?.['availability'] || [];
      
      // Find or create day
      let dayAvailability = currentAvailability.find(a => a.week_day === dayKey);
      if (!dayAvailability) {
        dayAvailability = { week_day: dayKey, hours: [] };
        currentAvailability.push(dayAvailability);
      }
      
      // Add hour if not exists
      if (!dayAvailability.hours.includes(hour)) {
        dayAvailability.hours.push(hour);
        dayAvailability.hours.sort((a, b) => a - b);
      }
      
      await updateDoc(docRef, {
        availability: currentAvailability
      });
    } catch (error) {
      console.error('Error adding availability hour:', error);
      throw error;
    }
  }

  // Remove hour from specific day
  async removeAvailabilityHour(tutorId: string, dayKey: string, hour: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'tutors', tutorId);
      
      // Get current data
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.data();
      const currentAvailability: Availability[] = currentData?.['availability'] || [];
      
      // Find day
      const dayAvailability = currentAvailability.find(a => a.week_day === dayKey);
      if (dayAvailability) {
        const hourIndex = dayAvailability.hours.indexOf(hour);
        if (hourIndex > -1) {
          dayAvailability.hours.splice(hourIndex, 1);
        }
      }
      
      await updateDoc(docRef, {
        availability: currentAvailability
      });
    } catch (error) {
      console.error('Error removing availability hour:', error);
      throw error;
    }
  }

  // Clear all tutor availability
  async clearTutorAvailability(tutorId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, 'tutors', tutorId);
      const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      const emptyAvailability: Availability[] = weekDays.map(day => ({
        week_day: day,
        hours: []
      }));
      
      await updateDoc(docRef, {
        availability: emptyAvailability
      });
    } catch (error) {
      console.error('Error clearing tutor availability:', error);
      throw error;
    }
  }

  // Get hours for specific day
  getDayAvailability(availability: Availability[], dayKey: string): number[] {
    const dayAvailability = availability.find(a => a.week_day === dayKey);
    return dayAvailability ? dayAvailability.hours : [];
  }

  // Check if specific hour is available
  isHourAvailable(availability: Availability[], dayKey: string, hour: number): boolean {
    return this.getDayAvailability(availability, dayKey).includes(hour);
  }

  // Get earliest and latest hours across all days
  getAvailabilityRange(availability: Availability[]): { earliest: number, latest: number } | null {
    const allHours: number[] = [];
    availability.forEach(day => {
      allHours.push(...day.hours);
    });
    
    if (allHours.length === 0) return null;
    
    return {
      earliest: Math.min(...allHours),
      latest: Math.max(...allHours)
    };
  }

  // Format hour for display
  formatHour(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  // Get availability summary for each day
  getAvailabilitySummary(availability: Availability[]): Record<string, string> {
    const summary: Record<string, string> = {};
    
    availability.forEach(day => {
      if (day.hours.length === 0) {
        summary[day.week_day] = 'No disponible';
      } else {
        const sortedHours = [...day.hours].sort((a, b) => a - b);
        const ranges: string[] = [];
        let start = sortedHours[0];
        let end = sortedHours[0];

        for (let i = 1; i < sortedHours.length; i++) {
          if (sortedHours[i] === end + 1) {
            end = sortedHours[i];
          } else {
            ranges.push(start === end ? 
              this.formatHour(start) : 
              `${this.formatHour(start)} - ${this.formatHour(end + 1)}`
            );
            start = sortedHours[i];
            end = sortedHours[i];
          }
        }
        
        ranges.push(start === end ? 
          this.formatHour(start) : 
          `${this.formatHour(start)} - ${this.formatHour(end + 1)}`
        );

        summary[day.week_day] = ranges.join(', ');
      }
    });

    return summary;
  }

  // Create default weekly availability structure
  createDefaultWeeklyAvailability(): Availability[] {
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return weekDays.map(day => ({
      week_day: day,
      hours: []
    }));
  }

  // Validate availability data
  validateAvailabilityData(availability: Availability[]): boolean {
    const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    return availability.every(day => {
      // Check if day is valid
      if (!validDays.includes(day.week_day)) {
        return false;
      }
      
      // Check if hours are valid (0-23)
      return day.hours.every(hour => 
        Number.isInteger(hour) && hour >= 0 && hour <= 23
      );
    });
  }

  // Get total available hours per week
  getTotalWeeklyHours(availability: Availability[]): number {
    return availability.reduce((total, day) => total + day.hours.length, 0);
  }

  // Check if tutor has availability on specific day
  hasAvailabilityOnDay(availability: Availability[], dayKey: string): boolean {
    return this.getDayAvailability(availability, dayKey).length > 0;
  }

  // Get days with availability
  getAvailableDays(availability: Availability[]): string[] {
    return availability
      .filter(day => day.hours.length > 0)
      .map(day => day.week_day);
  }
}
