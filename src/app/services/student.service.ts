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
} from '@angular/fire/firestore';
import { Student, LevelCEFR } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'students';

  // Create or update student profile
  async createStudent(studentData: Student): Promise<void> {
    try {
      console.log(studentData);
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

  // Get students by institution ID
  getStudentsByInstitution(institutionId: string): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
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

  // Get students by CEFR level
  getStudentsByLevel(level: LevelCEFR): Observable<Student[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('level_cefr', '==', level),
      orderBy('full_name', 'asc')
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
  async updateStudentGoals(userId: string, goals: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, { goals });
    } catch (error) {
      console.error('Error updating student goals:', error);
      throw error;
    }
  }
}
