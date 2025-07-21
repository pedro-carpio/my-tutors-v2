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
  getDocs,
  Timestamp,
} from '@angular/fire/firestore';
import { User, UserRole } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'users';

  // Create a new user with specific ID (from Firebase Auth)
  async createUser(userData: User): Promise<void> {
    try {
      const docRef = doc(this.firestore, this.collectionName, userData.id);
      await setDoc(docRef, userData);
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Create a user for administrative purposes (without Firebase Auth)
  async createUserForAdmin(email: string, role: UserRole): Promise<string> {
    try {
      // Generate a temporary user document to get an auto-generated ID
      const tempDocRef = doc(collection(this.firestore, this.collectionName));
      const userId = tempDocRef.id;

      const userData: User = {
        id: userId,
        email: email,
        role: role,
        created_at: serverTimestamp()
      };

      console.log(userData);

      await setDoc(tempDocRef, userData);
      return userId;
    } catch (error) {
      console.error('Error creating user for admin:', error);
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

  // Check if email exists
  async emailExists(email: string): Promise<boolean> {
    try {
      const q = query(
        collection(this.firestore, this.collectionName),
        where('email', '==', email),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking email existence:', error);
      return false;
    }
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

  // Check if user needs account activation (created administratively)
  async needsActivation(email: string): Promise<boolean> {
    try {
      const users = await this.getUserByEmail(email).toPromise();
      if (users && users.length > 0) {
        const user = users[0];
        // Check if user ID doesn't match Firebase Auth pattern (auto-generated Firestore ID vs Firebase Auth UID)
        // Firebase Auth UIDs are typically 28 characters and alphanumeric
        // Firestore auto-generated IDs are 20 characters
        return user.id.length === 20;
      }
      return false;
    } catch (error) {
      console.error('Error checking if user needs activation:', error);
      return false;
    }
  }

  // Migrate user from Firestore auto-generated ID to Firebase Auth UID
  async migrateUserToFirebaseAuth(oldId: string, newId: string, userData: User): Promise<void> {
    try {
      // Create new document with Firebase Auth UID
      const newDocRef = doc(this.firestore, this.collectionName, newId);
      const newUserData: User = {
        ...userData,
        id: newId
      };
      await setDoc(newDocRef, newUserData);
      
      // Delete old document
      const oldDocRef = doc(this.firestore, this.collectionName, oldId);
      await deleteDoc(oldDocRef);
    } catch (error) {
      console.error('Error migrating user to Firebase Auth:', error);
      throw error;
    }
  }
}
