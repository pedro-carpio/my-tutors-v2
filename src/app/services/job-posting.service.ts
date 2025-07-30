import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from '@angular/fire/firestore';
import { JobPosting, JobPostingStatus, ClassType, ClassModality } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class JobPostingService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'job_postings';

  // Create a new job posting
  async createJobPosting(jobPostingData: Omit<JobPosting, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(this.firestore, this.collectionName), {
        ...jobPostingData,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating job posting:', error);
      throw error;
    }
  }

  // Get job posting by ID
  getJobPosting(jobPostingId: string): Observable<JobPosting | undefined> {
    const docRef = doc(this.firestore, this.collectionName, jobPostingId);
    return docData(docRef, { idField: 'id' }) as Observable<JobPosting | undefined>;
  }

  // Get all job postings
  getAllJobPostings(): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by institution
  getJobPostingsByInstitution(institutionId: string): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by status
  getJobPostingsByStatus(status: JobPostingStatus): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', status),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get available job postings for tutors (published and not assigned)
  getAvailableJobPostings(): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', 'published'),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings assigned to a specific tutor
  getJobPostingsByTutor(tutorId: string): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('assigned_tutor_id', '==', tutorId),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by institution and status
  getJobPostingsByInstitutionAndStatus(institutionId: string, status: JobPostingStatus): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('institution_id', '==', institutionId),
      where('status', '==', status),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by modality
  getJobPostingsByModality(modality: ClassModality): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('modality', '==', modality),
      where('status', '==', 'published'),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get job postings by class type
  getJobPostingsByClassType(classType: ClassType): Observable<JobPosting[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('class_type', '==', classType),
      where('status', '==', 'published'),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Get upcoming job postings (class_date >= today)
  getUpcomingJobPostings(): Observable<JobPosting[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const q = query(
      collection(this.firestore, this.collectionName),
      where('class_date', '>=', today),
      where('status', 'in', ['published', 'assigned']),
      orderBy('class_date', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<JobPosting[]>;
  }

  // Update job posting
  async updateJobPosting(jobPostingId: string, jobPostingData: Partial<JobPosting>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      await updateDoc(docRef, {
        ...jobPostingData,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating job posting:', error);
      throw error;
    }
  }

  // Assign tutor to job posting
  async assignTutorToJobPosting(jobPostingId: string, tutorId: string, hourlyRate?: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      const updateData: any = {
        assigned_tutor_id: tutorId,
        assigned_at: new Date(),
        status: 'assigned',
        updated_at: serverTimestamp(),
      };
      
      if (hourlyRate) {
        updateData.hourly_rate = hourlyRate;
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error assigning tutor to job posting:', error);
      throw error;
    }
  }

  // Unassign tutor from job posting
  async unassignTutorFromJobPosting(jobPostingId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      await updateDoc(docRef, {
        assigned_tutor_id: null,
        assigned_at: null,
        status: 'published',
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error unassigning tutor from job posting:', error);
      throw error;
    }
  }

  // Update job posting status
  async updateJobPostingStatus(jobPostingId: string, status: JobPostingStatus): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      await updateDoc(docRef, {
        status,
        updated_at: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating job posting status:', error);
      throw error;
    }
  }

  // Delete job posting
  async deleteJobPosting(jobPostingId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting job posting:', error);
      throw error;
    }
  }

  // Calculate total payment based on duration and hourly rate
  calculateTotalPayment(durationMinutes: number, hourlyRate: number): number {
    const hours = durationMinutes / 60;
    return Number((hours * hourlyRate).toFixed(2));
  }

  // Update payment information
  async updatePaymentInfo(jobPostingId: string, hourlyRate: number, currency: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, jobPostingId);
      
      // Get current job posting to calculate total payment
      const jobPostingSnapshot = await getDoc(docRef);
      if (jobPostingSnapshot.exists()) {
        const jobPosting = jobPostingSnapshot.data() as JobPosting;
        const totalPayment = this.calculateTotalPayment(jobPosting.total_duration_minutes, hourlyRate);
        
        await updateDoc(docRef, {
          hourly_rate: hourlyRate,
          currency,
          total_payment: totalPayment,
          updated_at: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error updating payment info:', error);
      throw error;
    }
  }
}
