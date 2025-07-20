import { inject, Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import {
  doc,
  docData,
  getDocs,
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
} from '@angular/fire/firestore';
import { Feedback } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class FeedbackService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'feedbacks';

  // Create new feedback
  async createFeedback(feedbackData: Omit<Feedback, 'id' | 'created_at'>): Promise<string> {
    try {
      const feedbackToCreate = {
        ...feedbackData,
        created_at: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(this.firestore, this.collectionName), feedbackToCreate);
      return docRef.id;
    } catch (error) {
      console.error('Error creating feedback:', error);
      throw error;
    }
  }

  // Get feedback by ID
  getFeedback(feedbackId: string): Observable<Feedback | undefined> {
    const docRef = doc(this.firestore, this.collectionName, feedbackId);
    return docData(docRef, { idField: 'id' }) as Observable<Feedback | undefined>;
  }

  // Get feedback for a specific class
  getFeedbackByClass(classId: string): Observable<Feedback[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('class_id', '==', classId),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Feedback[]>;
  }

  // Get feedback by rating
  getFeedbackByRating(rating: number): Observable<Feedback[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('rating', '==', rating),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Feedback[]>;
  }

  // Get feedback with rating >= specified value
  getFeedbackByMinRating(minRating: number): Observable<Feedback[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('rating', '>=', minRating),
      orderBy('rating', 'desc'),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Feedback[]>;
  }

  // Get recent feedback
  getRecentFeedback(limitCount: number = 20): Observable<Feedback[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Feedback[]>;
  }

  // Get top-rated feedback
  getTopRatedFeedback(limitCount: number = 10): Observable<Feedback[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('rating', 'desc'),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Feedback[]>;
  }

  // Update feedback
  async updateFeedback(feedbackId: string, feedbackData: Partial<Feedback>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, feedbackId);
      await updateDoc(docRef, feedbackData);
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  }

  // Delete feedback
  async deleteFeedback(feedbackId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, feedbackId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  }

  // Update feedback rating
  async updateFeedbackRating(feedbackId: string, rating: number): Promise<void> {
    try {
      // Validate rating is between 1-5
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }
      
      const docRef = doc(this.firestore, this.collectionName, feedbackId);
      await updateDoc(docRef, { rating });
    } catch (error) {
      console.error('Error updating feedback rating:', error);
      throw error;
    }
  }

  // Update feedback comment
  async updateFeedbackComment(feedbackId: string, comment: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, feedbackId);
      await updateDoc(docRef, { comment });
    } catch (error) {
      console.error('Error updating feedback comment:', error);
      throw error;
    }
  }

  // Get average rating for classes (you might want to join this with class data)
  async getAverageRatingForClasses(classIds: string[]): Promise<{ [classId: string]: number }> {
    try {
      const averages: { [classId: string]: number } = {};
      
      for (const classId of classIds) {
        const q = query(
          collection(this.firestore, this.collectionName),
          where('class_id', '==', classId)
        );
        
        const feedbacks$ = collectionData(q) as Observable<Feedback[]>;
        const feedbacks = await firstValueFrom(feedbacks$);
        
        if (feedbacks.length > 0) {
          const totalRating = feedbacks.reduce((sum: number, feedback: Feedback) => sum + feedback.rating, 0);
          averages[classId] = totalRating / feedbacks.length;
        } else {
          averages[classId] = 0;
        }
      }
      
      return averages;
    } catch (error) {
      console.error('Error calculating average ratings:', error);
      return {};
    }
  }

  // Check if feedback exists for a class
  async feedbackExistsForClass(classId: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('class_id', '==', classId),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking feedback existence:', error);
      return false;
    }
  }
}
