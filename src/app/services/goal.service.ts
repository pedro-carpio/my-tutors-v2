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
  addDoc,
} from '@angular/fire/firestore';
import { Goal, Language } from '../types/firestore.types';

@Injectable({
  providedIn: 'root',
})
export class GoalService {
  private firestore: Firestore = inject(Firestore);
  private collectionName = 'goals';

  getAllGoals(): Observable<Goal[]> {
    const q = query(
      collection(this.firestore, this.collectionName),
      orderBy('name', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Goal[]>;
  }

}
