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
  availability?: Availability[]; // Horarios de disponibilidad
  languages?: UserLanguage[]; // Idiomas que habla el tutor
  certifications?: TeachingCertification[]; // Certificaciones de enseñanza
  language_certifications?: LanguageCertification[]; // Certificaciones de idiomas
  dialectal_variant?: string; // Variante dialectal del idioma
}

export interface Student {
  user_id: string;
  full_name: string;
  goals?: Goal[];
  institution_id?: string; // Opcional para estudiantes independientes
  level_cefr?: LevelCEFR; // Nivel actual del estudiante
  target_language?: string; // Idioma que está aprendiendo
  country?: string; // País de origen del estudiante
  birth_date?: Date; // Fecha de nacimiento
  enrollment_date?: Date; // Fecha de inscripción
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
  week_day: string; // ISO 8601 format (e.g., "Monday")
  hours: number[]; // Array of hours in 24-hour format (e.g., [9, 10, 13, 14]) for 9 AM, 10 AM, 1 PM, and 2 PM
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

export interface TeachingCertification {
  name: string;
  description: string;
  link?: string;
}

export interface LanguageCertification {
  name: string;
  link?: string;
}

export interface Reference {
  name: string;
  contact: string;
}

export interface Postulant {
  id?: string;
  // Paso 1 - Datos personales
  temporal: boolean;
  full_name?: string;
  email?: string;
  phone?: string;
  has_whatsapp?: boolean;
  country?: string;
  linkedin_profile?: string;
  
  // Paso 2 - Competencia Lingüística
  native_language?: string;
  other_languages?: string[];
  teaching_certifications?: TeachingCertification[];
  language_certifications?: LanguageCertification[];
  has_dialectal_variant?: boolean;
  dialectal_variant?: string;
  
  // Paso 3 - Pedagogía & Metodología
  knows_cervantes_education?: boolean;
  methodology_description?: string;
  adaptive_material_link?: string;
  class_adaptation_description?: string;
  
  // Paso 4 - Experiencia & Referencias
  teaching_experience_amount?: number;
  teaching_experience_unit?: 'hours' | 'years';
  references?: Reference[];
  has_portfolio?: boolean;
  portfolio_link?: string;
  recorded_class_link?: string;
  has_curriculum?: boolean;
  curriculum_link?: string;
  
  // Paso 5 - Habilidades y disponibilidad
  knows_zoom?: boolean;
  knows_airtm?: boolean;
  knows_crypto_platform?: boolean;
  crypto_platform_name?: string;
  has_hd_equipment?: boolean;
  internet_speed_test_link?: string;
  weekly_availability_description?: string;
  hourly_rate_amount?: number;
  hourly_rate_currency?: string;
  
  created_at?: FieldValue | Timestamp;
  updated_at?: FieldValue | Timestamp;
}
