import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  updateDoc,
  deleteDoc,
  collection,
  collectionData,
  query,
  where,
  orderBy,
  addDoc,
  serverTimestamp,
  FieldValue
} from '@angular/fire/firestore';
import { LanguageCertification, LevelCEFR } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class LanguageCertificationService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'language_certifications';

  // Create a new language certification
  async createLanguageCertification(certification: LanguageCertification): Promise<string> {
    try {
      const docRef = await addDoc(
        collection(this.firestore, this.collectionName),
        {
          ...certification,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        }
      );
      return docRef.id;
    } catch (error) {
      console.error('Error creating language certification:', error);
      throw error;
    }
  }

  // Get language certification by ID
  getLanguageCertification(certificationId: string): Observable<LanguageCertification | undefined> {
    const docRef = doc(this.firestore, this.collectionName, certificationId);
    return docData(docRef, { idField: 'id' }) as Observable<LanguageCertification | undefined>;
  }

  // Get all language certifications for a user
  getLanguageCertificationsByUser(userId: string): Observable<LanguageCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<LanguageCertification[]>;
  }

  // Get language certifications by user and language
  getLanguageCertificationsByUserAndLanguage(userId: string, languageCode: string): Observable<LanguageCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', userId),
      where('language_code', '==', languageCode),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<LanguageCertification[]>;
  }

  // Update language certification
  async updateLanguageCertification(certificationId: string, updates: Partial<LanguageCertification>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, certificationId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating language certification:', error);
      throw error;
    }
  }

  // Delete language certification
  async deleteLanguageCertification(certificationId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, certificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting language certification:', error);
      throw error;
    }
  }

  // Get all language certifications (admin)
  getAllLanguageCertifications(): Observable<LanguageCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<LanguageCertification[]>;
  }

  // Get language certifications by language code
  getLanguageCertificationsByLanguage(languageCode: string): Observable<LanguageCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('language_code', '==', languageCode),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<LanguageCertification[]>;
  }

  // Get language certifications by CEFR level
  getLanguageCertificationsByLevel(level: LevelCEFR): Observable<LanguageCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('level_cefr', '==', level),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<LanguageCertification[]>;
  }

  // Get language certifications by issuer
  getLanguageCertificationsByIssuer(issuer: string): Observable<LanguageCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('issuer', '==', issuer),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<LanguageCertification[]>;
  }

  // Verify language certification (admin function)
  async verifyLanguageCertification(certificationId: string, isVerified: boolean): Promise<void> {
    try {
      await this.updateLanguageCertification(certificationId, {
        is_verified: isVerified,
        updated_at: serverTimestamp() as FieldValue
      });
    } catch (error) {
      console.error('Error verifying language certification:', error);
      throw error;
    }
  }

  // Get verified language certifications for a user
  getVerifiedLanguageCertificationsByUser(userId: string): Observable<LanguageCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', userId),
      where('is_verified', '==', true),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<LanguageCertification[]>;
  }

  // Get highest level certification for user and language
  getHighestLevelCertificationByUserAndLanguage(userId: string, languageCode: string): Observable<LanguageCertification[]> {
    // This will return all certifications for the language, 
    // client should determine the highest level
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', userId),
      where('language_code', '==', languageCode),
      where('is_verified', '==', true),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<LanguageCertification[]>;
  }
}
