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
  getDocs,
  query,
  where,
  orderBy,
} from '@angular/fire/firestore';
import { Language } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'languages';

  // Create a new language
  async createLanguage(languageData: Omit<Language, 'id'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), languageData);
      return docRef.id;
    } catch (error) {
      console.error('Error creating language:', error);
      throw error;
    }
  }

  // Get language by ID
  getLanguage(languageId: string): Observable<Language | undefined> {
    const docRef = doc(this.firestore, this.collectionName, languageId);
    return docData(docRef, { idField: 'id' }) as Observable<Language | undefined>;
  }

  // Get language by code (ISO 639‑1)
  getLanguageByCode(code: string): Observable<Language[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('code', '==', code.toLowerCase())
    );
    return collectionData(q, { idField: 'id' }) as Observable<Language[]>;
  }

  // Get all languages
  getAllLanguages(): Observable<Language[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('name', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Language[]>;
  }

  // Search languages by name
  searchLanguagesByName(namePrefix: string): Observable<Language[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('name', '>=', namePrefix),
      where('name', '<=', namePrefix + '\uf8ff'),
      orderBy('name', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Language[]>;
  }

  // Update language
  async updateLanguage(languageId: string, languageData: Partial<Language>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, languageId);
      await updateDoc(docRef, languageData);
    } catch (error) {
      console.error('Error updating language:', error);
      throw error;
    }
  }

  // Delete language
  async deleteLanguage(languageId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, languageId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting language:', error);
      throw error;
    }
  }

  // Check if language exists by code
  async languageExistsByCode(code: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('code', '==', code.toLowerCase())
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking language existence:', error);
      return false;
    }
  }

  // Get popular languages (you might want to add a popularity field later)
  getPopularLanguages(): Observable<Language[]> {
    // For now, just return all languages sorted by name
    // In the future, you could add a popularity score field
    return this.getAllLanguages();
  }
}
