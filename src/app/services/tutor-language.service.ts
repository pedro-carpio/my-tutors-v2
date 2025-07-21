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
  addDoc,
  collectionData,
  query,
  where,
  orderBy,
  getDocs,
} from '@angular/fire/firestore';
import { TutorLanguage, LevelCEFR } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class TutorLanguageService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'tutor_languages';

  // Create a new tutor-language relationship
  async createTutorLanguage(tutorLanguageData: TutorLanguage): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), tutorLanguageData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating tutor language:', error);
      throw error;
    }
  }

  // Get all languages for a specific tutor
  getLanguagesByTutor(tutorId: string): Observable<TutorLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      orderBy('level_cefr', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorLanguage[]>;
  }

  // Get all tutors who teach a specific language
  getTutorsByLanguage(languageId: string): Observable<TutorLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('language_id', '==', languageId),
      orderBy('level_cefr', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorLanguage[]>;
  }

  // Get tutors by language and minimum CEFR level
  getTutorsByLanguageAndLevel(languageId: string, minLevel: LevelCEFR): Observable<TutorLanguage[]> {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const minLevelIndex = levelOrder.indexOf(minLevel);
    const validLevels = levelOrder.slice(minLevelIndex);

    const q = query(
      collection(this.firestore, this.collectionName),
      where('language_id', '==', languageId),
      where('level_cefr', 'in', validLevels),
      orderBy('level_cefr', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorLanguage[]>;
  }

  // Get specific tutor-language relationship
  getTutorLanguage(tutorId: string, languageId: string): Observable<TutorLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      where('language_id', '==', languageId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorLanguage[]>;
  }

  // Update tutor language level
  async updateTutorLanguageLevel(tutorLanguageId: string, newLevel: LevelCEFR): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, tutorLanguageId);
      await updateDoc(docRef, { level_cefr: newLevel });
    } catch (error) {
      console.error('Error updating tutor language level:', error);
      throw error;
    }
  }

  // Delete tutor-language relationship
  async deleteTutorLanguage(tutorLanguageId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, tutorLanguageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting tutor language:', error);
      throw error;
    }
  }

  // Remove all languages for a tutor
  async removeAllLanguagesForTutor(tutorId: string): Promise<void> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('tutor_id', '==', tutorId)
      );
      const snapshot = await getDocs(q);
      
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error removing all languages for tutor:', error);
      throw error;
    }
  }

  // Check if tutor teaches a specific language
  async tutorTeachesLanguage(tutorId: string, languageId: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('tutor_id', '==', tutorId),
        where('language_id', '==', languageId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking if tutor teaches language:', error);
      return false;
    }
  }

  // Get all tutor-language relationships
  getAllTutorLanguages(): Observable<TutorLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('tutor_id', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorLanguage[]>;
  }
}
