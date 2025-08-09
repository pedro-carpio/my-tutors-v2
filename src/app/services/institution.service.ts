import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
  serverTimestamp,
  limit,
} from '@angular/fire/firestore';
import { Institution } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class InstitutionService {
  private collectionName = 'institutions';

  constructor(private firestore: Firestore) {}

  // Create or update institution profile
  async createInstitution(institutionData: Institution): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, institutionData.user_id);
      
      // Add timestamps
      const dataWithTimestamps = {
        ...institutionData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      
      await setDoc(docRef, dataWithTimestamps);
    } catch (error) {
      console.error('Error creating institution:', error);
      throw error;
    }
  }

  // Get institution by user ID
  getInstitution(userId: string): Observable<Institution | undefined> {
    console.log('🔍 InstitutionService: Buscando institución para userId:', userId);
    
    // First try to get by document ID (direct lookup)
    const docRef = doc(this.firestore, this.collectionName, userId);
    const directLookup$ = docData(docRef).pipe(
      map(data => {
        console.log('📄 InstitutionService: Búsqueda directa resultado:', data ? 'ENCONTRADO' : 'NO ENCONTRADO');
        return data as Institution | undefined;
      })
    );
    
    // If not found by document ID, try querying by user_id field
    const queryLookup$ = directLookup$.pipe(
      switchMap(institution => {
        if (institution) {
          console.log('✅ InstitutionService: Institución encontrada por ID directo');
          return of(institution);
        }
        
        console.log('🔍 InstitutionService: No encontrado por ID directo, intentando query por user_id');
        const q = query(
          collection(this.firestore, this.collectionName),
          where('user_id', '==', userId),
          limit(1)
        );
        
        return collectionData(q).pipe(
          map((institutions) => {
            const typedInstitutions = institutions as Institution[];
            console.log('📋 InstitutionService: Query por user_id resultado:', typedInstitutions.length, 'instituciones');
            return typedInstitutions.length > 0 ? typedInstitutions[0] : undefined;
          })
        );
      })
    );
    
    return queryLookup$;
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
      console.log('Updating institution:', userId, institutionData);
      console.log('Document reference:', docRef);
      
      // Add updated timestamp
      const dataWithTimestamp = {
        ...institutionData,
        updated_at: serverTimestamp(),
      };
      
      // Use setDoc with merge to create document if it doesn't exist or update if it does
      await setDoc(docRef, dataWithTimestamp, { merge: true });
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
