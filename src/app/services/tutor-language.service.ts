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
import { UserLanguage, LevelCEFR } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class UserLanguageService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'user_languages';

  // Create a new tutor-language relationship
  async createUserLanguage(userLanguageData: UserLanguage): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), userLanguageData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating tutor language:', error);
      throw error;
    }
  }

  // Get all languages for a specific tutor
  getLanguagesByTutor(tutorId: string): Observable<UserLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', tutorId),
      orderBy('level_cefr', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<UserLanguage[]>;
  }

  // Get teaching languages for a specific tutor
  getTeachingLanguagesByTutor(tutorId: string): Observable<UserLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', tutorId),
      where('is_teaching', '==', true),
      orderBy('level_cefr', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<UserLanguage[]>;
  }

  // Get spoken languages for a specific tutor (non-teaching)
  getSpokenLanguagesByTutor(tutorId: string): Observable<UserLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', tutorId),
      where('is_teaching', '!=', true), // This includes null, undefined, and false
      orderBy('level_cefr', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<UserLanguage[]>;
  }

  // Get all tutors who teach a specific language
  getTutorsByLanguage(languageId: string): Observable<UserLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('language_id', '==', languageId),
      orderBy('level_cefr', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<UserLanguage[]>;
  }

  // Get tutors by language and minimum CEFR level
  getTutorsByLanguageAndLevel(languageId: string, minLevel: LevelCEFR): Observable<UserLanguage[]> {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const minLevelIndex = levelOrder.indexOf(minLevel);
    const validLevels = levelOrder.slice(minLevelIndex);

    const q = query(
      collection(this.firestore, this.collectionName),
      where('language_id', '==', languageId),
      where('level_cefr', 'in', validLevels),
      orderBy('level_cefr', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<UserLanguage[]>;
  }

  // Get specific tutor-language relationship
  getUserLanguage(tutorId: string, languageId: string): Observable<UserLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', tutorId),
      where('language_id', '==', languageId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<UserLanguage[]>;
  }

  // Update tutor language level
  async updateUserLanguageLevel(userLanguageId: string, newLevel: LevelCEFR): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userLanguageId);
      await updateDoc(docRef, { level_cefr: newLevel });
    } catch (error) {
      console.error('Error updating tutor language level:', error);
      throw error;
    }
  }

  // Delete tutor-language relationship
  async deleteUserLanguage(userLanguageId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userLanguageId);
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
        where('user_id', '==', tutorId)
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
        where('user_id', '==', tutorId),
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
  getAllUserLanguages(): Observable<UserLanguage[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('user_id', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<UserLanguage[]>;
  }
}
