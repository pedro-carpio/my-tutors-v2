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
import { Institution } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class InstitutionService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'institutions';

  // Create or update institution profile
  async createInstitution(institutionData: Institution): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, institutionData.user_id);
      await setDoc(docRef, institutionData);
    } catch (error) {
      console.error('Error creating institution:', error);
      throw error;
    }
  }

  // Get institution by user ID
  getInstitution(userId: string): Observable<Institution | undefined> {
    const docRef = doc(this.firestore, this.collectionName, userId);
    return docData(docRef) as Observable<Institution | undefined>;
  }

  // Get all institutions
  getAllInstitutions(): Observable<Institution[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('name', 'asc')
    );
    return collectionData(q) as Observable<Institution[]>;
  }

  // Search institutions by name
  getInstitutionsByName(namePrefix: string): Observable<Institution[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('name', '>=', namePrefix),
      where('name', '<=', namePrefix + '\uf8ff'),
      orderBy('name', 'asc')
    );
    return collectionData(q) as Observable<Institution[]>;
  }

  // Get institutions by address/location
  getInstitutionsByLocation(location: string): Observable<Institution[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('address', '>=', location),
      where('address', '<=', location + '\uf8ff'),
      orderBy('address', 'asc')
    );
    return collectionData(q) as Observable<Institution[]>;
  }

  // Update institution profile
  async updateInstitution(userId: string, institutionData: Partial<Institution>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, institutionData);
    } catch (error) {
      console.error('Error updating institution:', error);
      throw error;
    }
  }

  // Delete institution profile
  async deleteInstitution(userId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting institution:', error);
      throw error;
    }
  }

  // Update contact email
  async updateContactEmail(userId: string, contactEmail: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, { contact_email: contactEmail });
    } catch (error) {
      console.error('Error updating contact email:', error);
      throw error;
    }
  }

  // Update address
  async updateAddress(userId: string, address: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, { address });
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }
}
