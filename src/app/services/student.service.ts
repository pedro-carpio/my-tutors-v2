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
import { Student, LevelCEFR, Goal } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'students';

  // Create or update student profile
  async createStudent(studentData: Student): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, studentData.user_id);
      await setDoc(docRef, studentData);
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  // Get student by user ID
  getStudent(userId: string): Observable<Student | undefined> {
    const docRef = doc(this.firestore, this.collectionName, userId);
    return docData(docRef) as Observable<Student | undefined>;
  }

  // Get students by institution ID with different sorting options
  getStudentsByInstitution(institutionId: string): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by institution sorted by enrollment date
  getStudentsByInstitutionSortedByEnrollment(institutionId: string, direction: 'asc' | 'desc' = 'desc'): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('enrollment_date', direction)
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by institution sorted by CEFR level
  getStudentsByInstitutionSortedByLevel(institutionId: string, direction: 'asc' | 'desc' = 'asc'): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('level_cefr', direction)
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by institution sorted by age (birth_date)
  getStudentsByInstitutionSortedByAge(institutionId: string, direction: 'asc' | 'desc' = 'desc'): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('birth_date', direction)
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by institution and target language
  getStudentsByInstitutionAndTargetLanguage(institutionId: string, targetLanguage: string): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      where('target_language', '==', targetLanguage),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by institution and country
  getStudentsByInstitutionAndCountry(institutionId: string, country: string): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      where('country', '==', country),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by institution and level
  getStudentsByInstitutionAndLevel(institutionId: string, level: LevelCEFR): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      where('level_cefr', '==', level),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get all students
  getAllStudents(): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by CEFR level (global)
  getStudentsByLevel(level: LevelCEFR): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('level_cefr', '==', level)
      // orderBy removido temporalmente - usar índice de campo único
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by country (global)
  getStudentsByCountry(country: string): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('country', '==', country)
      // orderBy removido temporalmente - usar índice de campo único
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get students by target language (global)
  getStudentsByTargetLanguage(targetLanguage: string): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('target_language', '==', targetLanguage)
      // orderBy removido temporalmente - usar índice de campo único
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Get newest students (by enrollment date)
  getNewestStudents(count: number = 10): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('enrollment_date', 'desc'),
      limit(count)
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Search students by goals (contains search)
  searchStudentsByGoals(goalKeyword: string): Observable<Student[]> {
    // Note: Firestore doesn't support full-text search natively
    // For production, consider using Algolia or similar service
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('full_name', 'asc')
    );
    return collectionData(q) as Observable<Student[]>;
  }

  // Update student profile
  async updateStudent(userId: string, studentData: Partial<Student>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, studentData);
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  // Delete student profile
  async deleteStudent(userId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  // Update student level (common operation)
  async updateStudentLevel(userId: string, newLevel: LevelCEFR): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, { level_cefr: newLevel });
    } catch (error) {
      console.error('Error updating student level:', error);
      throw error;
    }
  }

  // Update student goals
  async updateStudentGoals(userId: string, goals: Goal[]): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, { goals });
    } catch (error) {
      console.error('Error updating student goals:', error);
      throw error;
    }
  }
}
