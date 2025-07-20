import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  doc,
  docData,
  DocumentReference,
  Firestore,
  getDoc,
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
  DocumentData,
} from '@angular/fire/firestore';
import { User, UserRole } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'users';

  // Create a new user
  async createUser(userData: Omit<User, 'id' | 'created_at'>): Promise<string> {
    try {
      const userToCreate: Omit<User, 'id'> = {
        ...userData,
        created_at: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(this.firestore, this.collectionName), userToCreate);
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Get user by ID
  getUser(userId: string): Observable<User | undefined> {
    const docRef = doc(this.firestore, this.collectionName, userId);
    return docData(docRef, { idField: 'id' }) as Observable<User | undefined>;
  }

  // Get user by email
  getUserByEmail(email: string): Observable<User[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('email', '==', email),
      limit(1)
    );
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  // Get users by role
  getUsersByRole(role: UserRole): Observable<User[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      where('role', '==', role),
      orderBy('created_at', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  // Update user
  async updateUser(userId: string, userData: Partial<User>): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await updateDoc(docRef, userData);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async deleteUser(userId: string): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get all users with pagination
  getUsers(pageSize: number = 20): Observable<User[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }
}
