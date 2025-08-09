import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  limit,
} from '@angular/fire/firestore';
import { Tutor, Availability } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class TutorService {
  private collectionName = 'tutors';

  constructor(private firestore: Firestore) {}

  // Create or update tutor profile
  async createTutor(tutorData: Tutor): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, tutorData.user_id);
      await setDoc(docRef, tutorData);
    } catch (error) {
      console.error('Error creating tutor:', error);
      throw error;
    }
  }

  // Get tutor by user ID
  getTutor(userId: string): Observable<Tutor | undefined> {
    const docRef = doc(this.firestore, this.collectionName, userId);
    return docData(docRef) as Observable<Tutor | undefined>;
  }

  // Update tutor availability
  async updateTutorAvailability(userId: string, availability: Availability[]): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, { availability });
    } catch (error) {
      console.error('Error updating tutor availability:', error);
      throw error;
    }
  }

  // Get tutors by institution ID with different sorting options
  getTutorsByInstitution(institutionId: string): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Get tutors by institution sorted by hourly rate
  getTutorsByInstitutionSortedByRate(institutionId: string, direction: 'asc' | 'desc' = 'asc'): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('hourly_rate', direction)
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Get tutors by institution sorted by experience
  getTutorsByInstitutionSortedByExperience(institutionId: string, direction: 'asc' | 'desc' = 'desc'): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('experience_level', direction)
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Get tutors by institution sorted by availability
  getTutorsByInstitutionSortedByAvailability(institutionId: string, direction: 'asc' | 'desc' = 'desc'): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('max_hours_per_week', direction)
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Get tutors by institution and country
  getTutorsByInstitutionAndCountry(institutionId: string, country: string): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      where('country', '==', country),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Get tutors by institution and language
  getTutorsByInstitutionAndLanguage(institutionId: string, language: string): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      where('birth_language', '==', language),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Get all tutors
  getAllTutors(): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Get tutors by country
  getTutorsByCountry(country: string): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('country', '==', country)
      // orderBy removido temporalmente - usar índice de campo único
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Get tutors with availability for certain hours per week
  getTutorsByAvailability(minHours: number): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('max_hours_per_week', '>=', minHours),
      orderBy('max_hours_per_week', 'desc')
    );
    return collectionData(q) as Observable<Tutor[]>;
  }

  // Update tutor profile
  async updateTutor(userId: string, tutorData: Partial<Tutor>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, tutorData);
    } catch (error) {
      console.error('Error updating tutor:', error);
      throw error;
    }
  }

  // Delete tutor profile
  async deleteTutor(userId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting tutor:', error);
      throw error;
    }
  }

  // Get featured tutors (limit to top performers)
  getFeaturedTutors(count: number = 10): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('max_hours_per_week', 'desc'),
      limit(count)
    );
    return collectionData(q) as Observable<Tutor[]>;
  }
}
