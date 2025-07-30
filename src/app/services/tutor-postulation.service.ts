import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  doc,
  docData,
  Firestore,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  deleteDoc,
  collectionData,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from '@angular/fire/firestore';
import { TutorPostulation, PostulationStatus } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class TutorPostulationService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'tutor_postulations';

  // Create a new postulation
  async createPostulation(postulationData: Omit<TutorPostulation, 'id' | 'created_at' | 'updated_at' | 'postulated_at'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), {
        ...postulationData,
        postulated_at: serverTimestamp(),
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating postulation:', error);
      throw error;
    }
  }

  // Get postulation by ID
  getPostulation(postulationId: string): Observable<TutorPostulation | undefined> {
    const docRef = doc(this.firestore, this.collectionName, postulationId);
    return docData(docRef, { idField: 'id' }) as Observable<TutorPostulation | undefined>;
  }

  // Get postulations for a job posting
  getPostulationsByJobPosting(jobPostingId: string): Observable<TutorPostulation[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('job_posting_id', '==', jobPostingId),
      orderBy('postulated_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorPostulation[]>;
  }

  // Get postulations by tutor
  getPostulationsByTutor(tutorId: string): Observable<TutorPostulation[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('tutor_id', '==', tutorId),
      orderBy('postulated_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorPostulation[]>;
  }

  // Get postulations by institution
  getPostulationsByInstitution(institutionId: string): Observable<TutorPostulation[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('postulated_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorPostulation[]>;
  }

  // Get postulations by status
  getPostulationsByStatus(status: PostulationStatus): Observable<TutorPostulation[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', status),
      orderBy('postulated_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorPostulation[]>;
  }

  // Get pending postulations for an institution
  getPendingPostulationsByInstitution(institutionId: string): Observable<TutorPostulation[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      where('status', '==', 'pending'),
      orderBy('postulated_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<TutorPostulation[]>;
  }

  // Check if tutor already postulated for a job
  async hasPostulatedForJob(tutorId: string, jobPostingId: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('tutor_id', '==', tutorId),
        where('job_posting_id', '==', jobPostingId),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking postulation:', error);
      return false;
    }
  }

  // Update postulation status
  async updatePostulationStatus(
    postulationId: string, 
    status: PostulationStatus, 
    responseNotes?: string
  ): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, postulationId);
      const updateData: any = {
        status,
        responded_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      };
      
      if (responseNotes) {
        updateData.response_notes = responseNotes;
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating postulation status:', error);
      throw error;
    }
  }

  // Accept postulation
  async acceptPostulation(postulationId: string, responseNotes?: string): Promise<void> {
    await this.updatePostulationStatus(postulationId, 'accepted', responseNotes);
  }

  // Reject postulation
  async rejectPostulation(postulationId: string, responseNotes?: string): Promise<void> {
    await this.updatePostulationStatus(postulationId, 'rejected', responseNotes);
  }

  // Withdraw postulation (by tutor)
  async withdrawPostulation(postulationId: string): Promise<void> {
    await this.updatePostulationStatus(postulationId, 'withdrawn');
  }

  // Update postulation
  async updatePostulation(postulationId: string, postulationData: Partial<TutorPostulation>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, postulationId);
      await updateDoc(docRef, {
        ...postulationData,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating postulation:', error);
      throw error;
    }
  }

  // Delete postulation
  async deletePostulation(postulationId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, postulationId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting postulation:', error);
      throw error;
    }
  }

  // Get postulations count for a job posting
  async getPostulationsCount(jobPostingId: string): Promise<number> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('job_posting_id', '==', jobPostingId)
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting postulations count:', error);
      return 0;
    }
  }

  // Get pending postulations count for institution
  async getPendingPostulationsCount(institutionId: string): Promise<number> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('institution_id', '==', institutionId),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting pending postulations count:', error);
      return 0;
    }
  }
}
