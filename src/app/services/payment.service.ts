import { inject, Injectable } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';
import {
  doc,
  docData,
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
import { Payment, PaymentStatus } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'payments';

  // Create a new payment
  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at'>): Promise<string> {
    try {
      const paymentToCreate = {
        ...paymentData,
        created_at: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(this.firestore, this.collectionName), paymentToCreate);
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  // Get payment by ID
  getPayment(paymentId: string): Observable<Payment | undefined> {
    const docRef = doc(this.firestore, this.collectionName, paymentId);
    return docData(docRef, { idField: 'id' }) as Observable<Payment | undefined>;
  }

  // Get payments made by a specific payer (student or institution)
  getPaymentsByPayer(payerId: string): Observable<Payment[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('payer_id', '==', payerId),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Payment[]>;
  }

  // Get payments received by a specific payee (tutor)
  getPaymentsByPayee(payeeId: string): Observable<Payment[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('payee_id', '==', payeeId),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Payment[]>;
  }

  // Get payments by status
  getPaymentsByStatus(status: PaymentStatus): Observable<Payment[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('status', '==', status),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Payment[]>;
  }

  // Get pending payments for a specific payer
  getPendingPaymentsByPayer(payerId: string): Observable<Payment[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('payer_id', '==', payerId),
      where('status', '==', 'pending'),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Payment[]>;
  }

  // Get completed payments for a specific payee
  getCompletedPaymentsByPayee(payeeId: string): Observable<Payment[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('payee_id', '==', payeeId),
      where('status', '==', 'completed'),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Payment[]>;
  }

  // Get recent payments with limit
  getRecentPayments(limitCount: number = 20): Observable<Payment[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('created_at', 'desc'),
      limit(limitCount)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Payment[]>;
  }

  // Update payment status
  async updatePaymentStatus(paymentId: string, status: PaymentStatus): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, paymentId);
      const updateData: any = { status };
      
      // If completing payment, set paid_at date
      if (status === 'completed') {
        updateData.paid_at = new Date();
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Process payment (mark as completed)
  async processPayment(paymentId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, paymentId);
      await updateDoc(docRef, {
        status: 'completed',
        paid_at: new Date(),
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      throw error;
    }
  }

  // Fail payment
  async failPayment(paymentId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, paymentId);
      await updateDoc(docRef, {
        status: 'failed',
      });
    } catch (error) {
      console.error('Error failing payment:', error);
      throw error;
    }
  }

  // Update payment amount
  async updatePaymentAmount(paymentId: string, amount: number): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, paymentId);
      await updateDoc(docRef, { amount });
    } catch (error) {
      console.error('Error updating payment amount:', error);
      throw error;
    }
  }

  // Delete payment
  async deletePayment(paymentId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, paymentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  // Get total earnings for a tutor
  async getTutorEarnings(tutorId: string): Promise<number> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('payee_id', '==', tutorId),
        where('status', '==', 'completed')
      );
      
      const payments$ = collectionData(q) as Observable<Payment[]>;
      const payments = await firstValueFrom(payments$);
      return payments.reduce((total, payment) => total + payment.amount, 0);
    } catch (error) {
      console.error('Error calculating tutor earnings:', error);
      return 0;
    }
  }

  // Get total payments made by a payer
  async getPayerTotal(payerId: string): Promise<number> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('payer_id', '==', payerId),
        where('status', '==', 'completed')
      );
      
      const payments$ = collectionData(q) as Observable<Payment[]>;
      const payments = await firstValueFrom(payments$);
      return payments.reduce((total, payment) => total + payment.amount, 0);
    } catch (error) {
      console.error('Error calculating payer total:', error);
      return 0;
    }
  }
}
