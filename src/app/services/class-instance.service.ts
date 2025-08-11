import { Injectable, inject } from '@angular/core';
import { Firestore, collection, doc, addDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, onSnapshot, Timestamp, serverTimestamp } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { ClassInstance, ClassStatus, TutorPostulation, JobPosting } from '../types/firestore.types';

@Injectable({
  providedIn: 'root'
})
export class ClassInstanceService {
  private firestore = inject(Firestore);
  private classInstancesCollection = collection(this.firestore, 'class_instances');

  /**
   * Crear una nueva instancia de clase a partir de una postulación aceptada
   */
  async createClassFromPostulation(
    postulation: TutorPostulation, 
    jobPosting: JobPosting,
    additionalData: Partial<ClassInstance> = {}
  ): Promise<string> {
    const classData: Omit<ClassInstance, 'id'> = {
      tutor_id: postulation.tutor_id,
      institution_id: postulation.institution_id,
      job_posting_id: postulation.job_posting_id,
      postulation_id: postulation.id || '',
      course_id: additionalData.course_id || '',
      class_date: additionalData.class_date || jobPosting.class_date,
      start_time: additionalData.start_time || jobPosting.start_time,
      duration_minutes: additionalData.duration_minutes || jobPosting.total_duration_minutes,
      location: additionalData.location || jobPosting.location || '',
      video_call_link: additionalData.video_call_link || jobPosting.video_call_link || '',
      modality: jobPosting.modality,
      students: jobPosting.students,
      hourly_rate: jobPosting.hourly_rate || 0,
      currency: jobPosting.currency || 'USD',
      timezone: jobPosting.timezone,
      notes: additionalData.notes || '',
      status: 'scheduled',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
      ...additionalData
    };

    const docRef = await addDoc(this.classInstancesCollection, {
      ...classData,
      class_date: this.convertToTimestamp(classData.class_date),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Crear una nueva instancia de clase manualmente
   */
  async createClassInstance(classData: Omit<ClassInstance, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const newClass: Omit<ClassInstance, 'id'> = {
      ...classData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(this.classInstancesCollection, {
      ...newClass,
      class_date: this.convertToTimestamp(newClass.class_date),
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    });

    return docRef.id;
  }

  /**
   * Obtener una instancia de clase por ID
   */
  getClassInstance(classId: string): Observable<ClassInstance | null> {
    const docRef = doc(this.classInstancesCollection, classId);
    
    return new Observable(observer => {
      const unsubscribe = onSnapshot(docRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const classInstance: ClassInstance = {
            id: doc.id,
            ...data,
            class_date: data['class_date']?.toDate() || new Date(),
            created_at: data['created_at']?.toDate() || new Date(),
            updated_at: data['updated_at']?.toDate() || new Date()
          } as ClassInstance;
          observer.next(classInstance);
        } else {
          observer.next(null);
        }
      });

      return () => unsubscribe();
    });
  }

  /**
   * Actualizar una instancia de clase
   */
  async updateClassInstance(classId: string, updates: Partial<Omit<ClassInstance, 'id' | 'created_at'>>): Promise<void> {
    const docRef = doc(this.classInstancesCollection, classId);
    const updateData: any = {
      ...updates,
      updated_at: serverTimestamp()
    };

    // Convertir fecha si está presente
    if (updates.class_date) {
      updateData.class_date = this.convertToTimestamp(updates.class_date);
    }

    await updateDoc(docRef, updateData);
  }

  /**
   * Actualizar solo el estado de una clase
   */
  async updateClassStatus(classId: string, status: ClassStatus): Promise<void> {
    const docRef = doc(this.classInstancesCollection, classId);
    await updateDoc(docRef, {
      status,
      updated_at: serverTimestamp()
    });
  }

  /**
   * Eliminar una instancia de clase
   */
  async deleteClassInstance(classId: string): Promise<void> {
    const docRef = doc(this.classInstancesCollection, classId);
    await deleteDoc(docRef);
  }

  /**
   * Obtener clases por tutor
   */
  getClassesByTutor(tutorId: string): Observable<ClassInstance[]> {
    const q = query(
      this.classInstancesCollection,
      where('tutor_id', '==', tutorId),
      orderBy('class_date', 'desc')
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            class_date: data['class_date']?.toDate() || new Date(),
            created_at: data['created_at']?.toDate() || new Date(),
            updated_at: data['updated_at']?.toDate() || new Date()
          } as ClassInstance;
        });
        observer.next(classes);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Obtener clases por institución
   */
  getClassesByInstitution(institutionId: string): Observable<ClassInstance[]> {
    const q = query(
      this.classInstancesCollection,
      where('institution_id', '==', institutionId),
      orderBy('class_date', 'desc')
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            class_date: data['class_date']?.toDate() || new Date(),
            created_at: data['created_at']?.toDate() || new Date(),
            updated_at: data['updated_at']?.toDate() || new Date()
          } as ClassInstance;
        });
        observer.next(classes);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Obtener clases por estado
   */
  getClassesByStatus(status: ClassStatus): Observable<ClassInstance[]> {
    const q = query(
      this.classInstancesCollection,
      where('status', '==', status),
      orderBy('class_date', 'asc')
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            class_date: data['class_date']?.toDate() || new Date(),
            created_at: data['created_at']?.toDate() || new Date(),
            updated_at: data['updated_at']?.toDate() || new Date()
          } as ClassInstance;
        });
        observer.next(classes);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Obtener clases próximas (en las próximas 24 horas)
   */
  getUpcomingClasses(): Observable<ClassInstance[]> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const q = query(
      this.classInstancesCollection,
      where('class_date', '>=', Timestamp.fromDate(now)),
      where('class_date', '<=', Timestamp.fromDate(tomorrow)),
      where('status', 'in', ['scheduled', 'ongoing']),
      orderBy('class_date', 'asc')
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            class_date: data['class_date']?.toDate() || new Date(),
            created_at: data['created_at']?.toDate() || new Date(),
            updated_at: data['updated_at']?.toDate() || new Date()
          } as ClassInstance;
        });
        observer.next(classes);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Verificar conflictos de horario para un tutor
   */
  async checkScheduleConflict(
    tutorId: string, 
    classDate: Date, 
    startTime: string, 
    durationMinutes: number,
    excludeClassId?: string
  ): Promise<boolean> {
    const startDateTime = new Date(classDate);
    const [hours, minutes] = startTime.split(':').map(Number);
    startDateTime.setHours(hours, minutes, 0, 0);
    
    const endDateTime = new Date(startDateTime.getTime() + durationMinutes * 60 * 1000);
    
    // Buscar clases del tutor en el mismo día
    const dayStart = new Date(classDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(classDate);
    dayEnd.setHours(23, 59, 59, 999);

    let q = query(
      this.classInstancesCollection,
      where('tutor_id', '==', tutorId),
      where('class_date', '>=', Timestamp.fromDate(dayStart)),
      where('class_date', '<=', Timestamp.fromDate(dayEnd)),
      where('status', 'in', ['scheduled', 'ongoing'])
    );

    const snapshot = await getDocs(q);
    
    for (const doc of snapshot.docs) {
      if (excludeClassId && doc.id === excludeClassId) {
        continue; // Excluir la clase actual si estamos editando
      }

      const data = doc.data();
      const existingClassDate = data['class_date']?.toDate();
      const existingStartTime = data['start_time'];
      const existingDuration = data['duration_minutes'];

      if (existingClassDate && existingStartTime && existingDuration) {
        const [existingHours, existingMinutes] = existingStartTime.split(':').map(Number);
        const existingStart = new Date(existingClassDate);
        existingStart.setHours(existingHours, existingMinutes, 0, 0);
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60 * 1000);

        // Verificar si hay solapamiento
        if (startDateTime < existingEnd && endDateTime > existingStart) {
          return true; // Hay conflicto
        }
      }
    }

    return false; // No hay conflicto
  }

  /**
   * Contar clases por estado
   */
  async getClassCountByStatus(status: ClassStatus): Promise<number> {
    const q = query(
      this.classInstancesCollection,
      where('status', '==', status)
    );

    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  /**
   * Obtener estadísticas de clases
   */
  async getClassStatistics(): Promise<{
    total: number;
    scheduled: number;
    confirmed: number;
    ongoing: number;
    completed: number;
    cancelled: number;
  }> {
    const snapshot = await getDocs(this.classInstancesCollection);
    const stats = {
      total: snapshot.size,
      scheduled: 0,
      confirmed: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0
    };

    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const status = data['status'] as ClassStatus;
      if (status in stats) {
        stats[status as keyof typeof stats]++;
      }
    });

    return stats;
  }

  /**
   * Buscar clases por rango de fechas
   */
  getClassesByDateRange(startDate: Date, endDate: Date): Observable<ClassInstance[]> {
    const q = query(
      this.classInstancesCollection,
      where('class_date', '>=', Timestamp.fromDate(startDate)),
      where('class_date', '<=', Timestamp.fromDate(endDate)),
      orderBy('class_date', 'asc')
    );

    return new Observable(observer => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            class_date: data['class_date']?.toDate() || new Date(),
            created_at: data['created_at']?.toDate() || new Date(),
            updated_at: data['updated_at']?.toDate() || new Date()
          } as ClassInstance;
        });
        observer.next(classes);
      });

      return () => unsubscribe();
    });
  }

  /**
   * Utilidad para convertir fechas a Timestamp
   */
  private convertToTimestamp(date: Date | any): Timestamp {
    if (date instanceof Date) {
      return Timestamp.fromDate(date);
    }
    if (date?.toDate) {
      return date;
    }
    // Si es una fecha en string, convertir
    return Timestamp.fromDate(new Date(date));
  }
}
