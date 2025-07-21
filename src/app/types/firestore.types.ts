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
  country: string;
  photo_url?: string;
  max_hours_per_week: number;
  bio: string;
  birth_language: string;
  experience_level: number;
  hourly_rate: number;
  institution_id?: string; // Opcional para tutores independientes
}

export interface Student {
  user_id: string;
  full_name: string;
  goals?: Goal[];
  institution_id?: string; // Opcional para estudiantes independientes
}

export interface Goal {
  description: string;
  name: string;
  lang: string; // ISO 639‑1 code
}

export interface Institution {
  user_id: string;
  name: string;
  country: string;
  phone: string;
  description: string;
  logo_url?: string;
  tutors?: string[];
  students?: string[];
}

export interface Language {
  id: string;
  code: string; // ISO 639‑1
  name: string;
}

export interface UserLanguage {
  user_id: string;
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
  students?: string[]; // Array of student IDs
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
