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
import { TeachingCertification } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class TeachingCertificationService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'teaching_certifications';

  // Create a new teaching certification
  async createTeachingCertification(certification: TeachingCertification): Promise<string> {
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
      console.error('Error creating teaching certification:', error);
      throw error;
    }
  }

  // Get teaching certification by ID
  getTeachingCertification(certificationId: string): Observable<TeachingCertification | undefined> {
    const docRef = doc(this.firestore, this.collectionName, certificationId);
    return docData(docRef, { idField: 'id' }) as Observable<TeachingCertification | undefined>;
  }

  // Get all teaching certifications for a user
  getTeachingCertificationsByUser(userId: string): Observable<TeachingCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TeachingCertification[]>;
  }

  // Update teaching certification
  async updateTeachingCertification(certificationId: string, updates: Partial<TeachingCertification>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, certificationId);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating teaching certification:', error);
      throw error;
    }
  }

  // Delete teaching certification
  async deleteTeachingCertification(certificationId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, certificationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting teaching certification:', error);
      throw error;
    }
  }

  // Get all teaching certifications (admin)
  getAllTeachingCertifications(): Observable<TeachingCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TeachingCertification[]>;
  }

  // Get teaching certifications by issuer
  getTeachingCertificationsByIssuer(issuer: string): Observable<TeachingCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('issuer', '==', issuer),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TeachingCertification[]>;
  }

  // Verify teaching certification (admin function)
  async verifyTeachingCertification(certificationId: string, isVerified: boolean): Promise<void> {
    try {
      await this.updateTeachingCertification(certificationId, {
        is_verified: isVerified,
        updated_at: serverTimestamp() as FieldValue
      });
    } catch (error) {
      console.error('Error verifying teaching certification:', error);
      throw error;
    }
  }

  // Get verified teaching certifications for a user
  getVerifiedTeachingCertificationsByUser(userId: string): Observable<TeachingCertification[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('user_id', '==', userId),
      where('is_verified', '==', true),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TeachingCertification[]>;
  }
}
