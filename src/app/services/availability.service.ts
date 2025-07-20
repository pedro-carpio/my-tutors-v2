import { inject, Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionData,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from '@angular/fire/firestore';
import { Availability } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class AvailabilityService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'availabilities';

  // Create a new availability slot
  async createAvailability(availabilityData: Omit<Availability, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), availabilityData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating availability:', error);
      throw error;
    }
  }

  // Get availability by ID
  getAvailability(availabilityId: string): Observable<Availability | undefined> {
    const docRef = doc(this.firestore, this.collectionName, availabilityId);
    return docData(docRef, { idField: 'id' }) as Observable<Availability | undefined>;
  }

  // Get all availabilities for a specific tutor
  getAvailabilitiesByTutor(tutorId: string): Observable<Availability[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      orderBy('date', 'asc'),
      orderBy('start_time', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Availability[]>;
  }

  // Get availabilities for a specific tutor on a specific date
  getAvailabilitiesByTutorAndDate(tutorId: string, date: Date): Observable<Availability[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      where('date', '==', date),
      orderBy('start_time', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Availability[]>;
  }

  // Get availabilities for a specific date (all tutors)
  getAvailabilitiesByDate(date: Date): Observable<Availability[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('date', '==', date),
      orderBy('start_time', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Availability[]>;
  }

  // Get upcoming availabilities for a tutor
  getUpcomingAvailabilitiesByTutor(tutorId: string): Observable<Availability[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      where('date', '>=', today),
      orderBy('date', 'asc'),
      orderBy('start_time', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Availability[]>;
  }

  // Get availabilities within a date range
  getAvailabilitiesInRange(startDate: Date, endDate: Date): Observable<Availability[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('start_time', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Availability[]>;
  }

  // Get availabilities for a tutor within a date range
  getTutorAvailabilitiesInRange(tutorId: string, startDate: Date, endDate: Date): Observable<Availability[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc'),
      orderBy('start_time', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Availability[]>;
  }

  // Update availability
  async updateAvailability(availabilityId: string, availabilityData: Partial<Availability>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, availabilityId);
      await updateDoc(docRef, availabilityData);
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  }

  // Delete availability
  async deleteAvailability(availabilityId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, availabilityId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting availability:', error);
      throw error;
    }
  }

  // Bulk create availabilities (useful for recurring schedules)
  async createBulkAvailabilities(availabilities: Omit<Availability, 'id'>[]): Promise<string[]> {
    try {
      const promises = availabilities.map(availability => 
        addDoc(collection(this.firestore, this.collectionName), availability)
      );
      
      const docRefs = await Promise.all(promises);
      return docRefs.map(docRef => docRef.id);
    } catch (error) {
      console.error('Error creating bulk availabilities:', error);
      throw error;
    }
  }

  // Delete all availabilities for a tutor on a specific date
  async deleteAvailabilitiesByTutorAndDate(tutorId: string, date: Date): Promise<void> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('tutor_id', '==', tutorId),
        where('date', '==', date)
      );
      
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error deleting availabilities by tutor and date:', error);
      throw error;
    }
  }

  // Check if a time slot conflicts with existing availability
  async hasTimeConflict(tutorId: string, date: Date, startTime: string, endTime: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('tutor_id', '==', tutorId),
        where('date', '==', date)
      );
      
      const availabilities$ = collectionData(q) as Observable<Availability[]>;
      const availabilities = await firstValueFrom(availabilities$);
      
      return availabilities.some((availability: Availability) => {
        // Check for time overlap
        return (startTime < availability.end_time && endTime > availability.start_time);
      });
    } catch (error) {
      console.error('Error checking time conflict:', error);
      return false;
    }
  }
}
