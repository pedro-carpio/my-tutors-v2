import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionData,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from '@angular/fire/firestore';
import { Class } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class ClassService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'classes';

  // Create a new class
  async createClass(classData: Omit<Class, 'id' | 'scheduled_at'>): Promise<string> {
    try {
      const classToCreate = {
        ...classData,
        scheduled_at: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(this.firestore, this.collectionName), classToCreate);
      return docRef.id;
    } catch (error) {
      console.error('Error creating class:', error);
      throw error;
    }
  }

  // Schedule a class with specific date/time
  async scheduleClass(classData: Omit<Class, 'id'>, scheduledDate: Date): Promise<string> {
    try {
      const classToCreate = {
        ...classData,
        scheduled_at: Timestamp.fromDate(scheduledDate),
      };
      
      const docRef = await addDoc(collection(this.firestore, this.collectionName), classToCreate);
      return docRef.id;
    } catch (error) {
      console.error('Error scheduling class:', error);
      throw error;
    }
  }

  // Get class by ID
  getClass(classId: string): Observable<Class | undefined> {
    const docRef = doc(this.firestore, this.collectionName, classId);
    return docData(docRef, { idField: 'id' }) as Observable<Class | undefined>;
  }

  // Get classes for a specific course
  getClassesByCourse(courseId: string): Observable<Class[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('course_id', '==', courseId),
      orderBy('scheduled_at', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Class[]>;
  }

  // Get classes for a specific tutor
  getClassesByTutor(tutorId: string): Observable<Class[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      orderBy('scheduled_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Class[]>;
  }

  // Get classes for a specific student
  getClassesByStudent(studentId: string): Observable<Class[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('student_id', '==', studentId),
      orderBy('scheduled_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Class[]>;
  }

  // Get upcoming classes for tutor
  getUpcomingClassesByTutor(tutorId: string, limitCount: number = 10): Observable<Class[]> {
    const now = Timestamp.now();
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      where('scheduled_at', '>', now),
      orderBy('scheduled_at', 'asc'),
      limit(limitCount)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Class[]>;
  }

  // Get upcoming classes for student
  getUpcomingClassesByStudent(studentId: string, limitCount: number = 10): Observable<Class[]> {
    const now = Timestamp.now();
    const q = query(
      collection(this.firestore, this.collectionName),
      where('student_id', '==', studentId),
      where('scheduled_at', '>', now),
      orderBy('scheduled_at', 'asc'),
      limit(limitCount)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Class[]>;
  }

  // Get past classes for tutor
  getPastClassesByTutor(tutorId: string, limitCount: number = 10): Observable<Class[]> {
    const now = Timestamp.now();
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      where('scheduled_at', '<', now),
      orderBy('scheduled_at', 'desc'),
      limit(limitCount)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Class[]>;
  }

  // Update class details
  async updateClass(classId: string, classData: Partial<Class>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, classId);
      await updateDoc(docRef, classData);
    } catch (error) {
      console.error('Error updating class:', error);
      throw error;
    }
  }

  // Reschedule class
  async rescheduleClass(classId: string, newScheduledAt: Date): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, classId);
      await updateDoc(docRef, { 
        scheduled_at: Timestamp.fromDate(newScheduledAt) 
      });
    } catch (error) {
      console.error('Error rescheduling class:', error);
      throw error;
    }
  }

  // Cancel/Delete class
  async cancelClass(classId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, classId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error cancelling class:', error);
      throw error;
    }
  }

  // Update class price
  async updateClassPrice(classId: string, pricePerHour: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, classId);
      await updateDoc(docRef, { price_per_hour: pricePerHour });
    } catch (error) {
      console.error('Error updating class price:', error);
      throw error;
    }
  }
}
