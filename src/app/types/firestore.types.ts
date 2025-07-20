import { FieldValue, Timestamp } from '@angular/fire/firestore';

export type UserRole = 'tutor' | 'student' | 'institution' | 'admin';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type LevelCEFR = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  created_at: FieldValue | Timestamp;
}

export interface Tutor {
  user_id: string;
  full_name: string;
  birth_date: Date;
  nationality: string;
  photo_url?: string;
  max_hours_per_week: number;
}

export interface Student {
  user_id: string;
  full_name: string;
  goals: string;
  level_cefr: LevelCEFR;
}

export interface Institution {
  user_id: string;
  name: string;
  contact_email: string;
  address: string;
}

export interface Language {
  id: string;
  code: string; // ISO 639‑1
  name: string;
}

export interface TutorLanguage {
  tutor_id: string;
  language_id: string;
  level_cefr: LevelCEFR;
}

export interface Availability {
  id: string;
  tutor_id: string;
  date: Date;
  start_time: string; // Format: "HH:mm"
  end_time: string;   // Format: "HH:mm"
}

export interface Course {
  id: string;
  institution_id: string;
  title: string;
  description: string;
  language_code: string;
  level_cefr: LevelCEFR;
  capacity: number;
  start_date: Date;
  end_date: Date;
}

export interface Class {
  id: string;
  course_id: string;
  tutor_id: string;
  student_id: string;
  scheduled_at: FieldValue | Timestamp;
  duration_minutes: number;
  price_per_hour: number;
}

export interface Feedback {
  id: string;
  class_id: string;
  rating: number; // 1-5
  comment: string;
  created_at: FieldValue | Timestamp;
}

export interface Payment {
  id: string;
  payer_id: string;   // student or institution
  payee_id: string;   // tutor
  amount: number;
  currency: string;
  paid_at?: Date;
  status: PaymentStatus;
  created_at: FieldValue | Timestamp;
}
