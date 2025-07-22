import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  setDoc,
  collection,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { Postulant } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class PostulantService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'postulants';

  async removePostulant(postulantId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, postulantId);
      await updateDoc(docRef, {
        temporal: false,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error removing postulant:', error);
    }
  }

  async createPostulantFinished(postulantData: Postulant): Promise<string> {
    try {
      // Generate a document reference with auto-generated ID
      const docRef = doc(collection(this.firestore, 'postulants-results'));
      const postulantId = docRef.id;

      const postulantDataWithMeta: Postulant = {
        ...postulantData,
          
        temporal: postulantData.temporal || true,
        id: postulantId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      await setDoc(docRef, postulantDataWithMeta);
      return postulantId;
    } catch (error) {
      console.error('Error creating postulant:', error);
      throw error;
    }
  }
  // Create a new postulant with auto-generated ID
  async createPostulant(postulantData: Postulant): Promise<string> {
    try {
      // Generate a document reference with auto-generated ID
      const docRef = doc(collection(this.firestore, this.collectionName));
      const postulantId = docRef.id;

      const postulantDataWithMeta: Postulant = {
        ...postulantData,
          
        temporal: postulantData.temporal || true,
        id: postulantId,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };

      await setDoc(docRef, postulantDataWithMeta);
      return postulantId;
    } catch (error) {
      console.error('Error creating postulant:', error);
      throw error;
    }
  }

  // Get postulant by ID
  getPostulantById(postulantId: string): Observable<Postulant | undefined> {
    const docRef = doc(this.firestore, this.collectionName, postulantId);
    return docData(docRef, { idField: 'id' }) as Observable<Postulant | undefined>;
  }

  // Update postulant
  async updatePostulant(postulantId: string, postulantData: Partial<Postulant>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, postulantId);
      const updateData = {
          ...postulantData,
          temporal: postulantData.temporal || true,
        updated_at: serverTimestamp()
      };
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating postulant:', error);
      throw error;
    }
  }
}