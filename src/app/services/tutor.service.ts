import { inject, Injectable } from '@angular/core';
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
import { Tutor } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class TutorService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'tutors';

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

  // Get tutors by institution ID
  getTutorsByInstitution(institutionId: string): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
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

  // Get tutors by nationality
  getTutorsByNationality(nationality: string): Observable<Tutor[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('nationality', '==', nationality),
      orderBy('full_name', 'asc')
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
