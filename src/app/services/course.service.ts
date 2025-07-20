import { inject, Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import {
  doc,
  docData,
  getDoc,
  Firestore,
  addDoc,
  updateDoc,
  deleteDoc,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  limit,
} from '@angular/fire/firestore';
import { Course, LevelCEFR } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'courses';

  // Create a new course
  async createCourse(courseData: Omit<Course, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), courseData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  // Get course by ID
  getCourse(courseId: string): Observable<Course | undefined> {
    const docRef = doc(this.firestore, this.collectionName, courseId);
    return docData(docRef, { idField: 'id' }) as Observable<Course | undefined>;
  }

  // Get all courses
  getAllCourses(): Observable<Course[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('start_date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Get courses by institution
  getCoursesByInstitution(institutionId: string): Observable<Course[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('start_date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Get courses by language
  getCoursesByLanguage(languageCode: string): Observable<Course[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('language_code', '==', languageCode),
      orderBy('start_date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Get courses by CEFR level
  getCoursesByLevel(level: LevelCEFR): Observable<Course[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('level_cefr', '==', level),
      orderBy('start_date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Get courses by language and level
  getCoursesByLanguageAndLevel(languageCode: string, level: LevelCEFR): Observable<Course[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('language_code', '==', languageCode),
      where('level_cefr', '==', level),
      orderBy('start_date', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Get upcoming courses
  getUpcomingCourses(): Observable<Course[]> {
    const today = new Date();
    const q = query(
      collection(this.firestore, this.collectionName),
      where('start_date', '>=', today),
      orderBy('start_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Get active courses (currently running)
  getActiveCourses(): Observable<Course[]> {
    const today = new Date();
    const q = query(
      collection(this.firestore, this.collectionName),
      where('start_date', '<=', today),
      where('end_date', '>=', today),
      orderBy('start_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Get courses with available spots
  getCoursesWithAvailability(): Observable<Course[]> {
    // Note: This is a simplified version. In practice, you'd need to join with enrollment data
    const q = query(
      collection(this.firestore, this.collectionName),
      where('capacity', '>', 0),
      orderBy('start_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Get featured courses (limit)
  getFeaturedCourses(count: number = 6): Observable<Course[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('start_date', 'desc'),
      limit(count)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Search courses by title
  searchCoursesByTitle(titlePrefix: string): Observable<Course[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('title', '>=', titlePrefix),
      where('title', '<=', titlePrefix + '\uf8ff'),
      orderBy('title', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Course[]>;
  }

  // Update course
  async updateCourse(courseId: string, courseData: Partial<Course>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, courseId);
      await updateDoc(docRef, courseData);
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  // Delete course
  async deleteCourse(courseId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, courseId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  // Update course capacity
  async updateCourseCapacity(courseId: string, capacity: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, courseId);
      await updateDoc(docRef, { capacity });
    } catch (error) {
      console.error('Error updating course capacity:', error);
      throw error;
    }
  }

  // Update course dates
  async updateCourseDates(courseId: string, startDate: Date, endDate: Date): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, courseId);
      await updateDoc(docRef, { 
        start_date: startDate,
        end_date: endDate 
      });
    } catch (error) {
      console.error('Error updating course dates:', error);
      throw error;
    }
  }

  // Decrease course capacity (when someone enrolls)
  async decreaseCourseCapacity(courseId: string): Promise<void> {
    try {
      const courseDoc = doc(this.firestore, this.collectionName, courseId);
      const courseSnapshot = await getDoc(courseDoc);
      
      if (courseSnapshot.exists()) {
        const courseData = courseSnapshot.data();
        if (courseData && courseData['capacity'] > 0) {
          await updateDoc(courseDoc, { 
            capacity: courseData['capacity'] - 1 
          });
        }
      }
    } catch (error) {
      console.error('Error decreasing course capacity:', error);
      throw error;
    }
  }

  // Increase course capacity (when someone unenrolls)
  async increaseCourseCapacity(courseId: string): Promise<void> {
    try {
      const courseDoc = doc(this.firestore, this.collectionName, courseId);
      const courseSnapshot = await getDoc(courseDoc);
      
      if (courseSnapshot.exists()) {
        const courseData = courseSnapshot.data();
        if (courseData) {
          await updateDoc(courseDoc, { 
            capacity: (courseData['capacity'] || 0) + 1 
          });
        }
      }
    } catch (error) {
      console.error('Error increasing course capacity:', error);
      throw error;
    }
  }
}
