import { FieldValue, Timestamp } from '@angular/fire/firestore';

export type UserRole = 'tutor' | 'student' | 'institution' | 'admin';
export type PaymentStatus = 'pending' | 'completed' | 'failed';
export type LevelCEFR = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended' | 'verified';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface User {
  id: string;
  email: string;
  password_hash?: string;
  roles: UserRole[]; // OBLIGATORIO: múltiples roles del usuario (al menos uno)
  primary_role?: UserRole; // Rol principal para navegación por defecto
  status?: UserStatus; // Estado del usuario - ✅ Útil para admin panel y gestión
  created_at: FieldValue | Timestamp;
  updated_at?: FieldValue | Timestamp; // ✅ Implementado en servicios para auditoría
  temporary_password?: string; // ✅ ACTUALMENTE EN USO - Sistema de credenciales temporales
  needs_password_change?: boolean; // ✅ ACTUALMENTE EN USO - Control de primer acceso
  phone?: string; // ✅ ACTUALMENTE EN USO - Formularios de registro de instituciones y tutores
  last_login?: FieldValue | Timestamp; // TODO: Implementar tracking de último login
  is_verified?: boolean; // TODO: Sistema de verificación de usuarios
  timezone?: string; // Zona horaria del usuario
}

export interface Tutor {
  user_id: string;
  full_name: string;
  birth_date: Date;
  country: string;
  phone?: string; // ✅ ACTUALMENTE EN USO - Formulario add-tutor-dialog
  photo_url?: string;
  max_hours_per_week: number;
  bio: string;
  birth_language: string;
  experience_level: ExperienceLevel | number; // ✅ ACTUALMENTE EN USO - Formularios soportan ambos tipos
  hourly_rate: number;
  hourly_rate_currency?: string; // ✅ IMPLEMENTADO - Sistema de postulantes usa este campo
  institution_id?: string; // ✅ ACTUALMENTE EN USO - Formularios de instituciones
  availability?: Availability[]; // ✅ COMPLETAMENTE IMPLEMENTADO - Sistema de disponibilidad funcional
  languages?: UserLanguage[]; // ✅ SERVICIO IMPLEMENTADO - tutor-language.service.ts
  certifications?: TeachingCertification[]; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  language_certifications?: LanguageCertification[]; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  dialectal_variant?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  linkedin_profile?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  status?: UserStatus; // TODO: Implementar gestión de estado de tutores
  rating?: number; // TODO: Implementar sistema de calificaciones promedio
  total_classes?: number; // TODO: Implementar contador de clases
  created_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
  updated_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
  timezone?: string; // Zona horaria del tutor
}

export interface Student {
  user_id: string;
  full_name: string;
  phone?: string; // ✅ ACTUALMENTE EN USO - Formulario add-student-dialog
  goals?: Goal[]; // ✅ SERVICIO IMPLEMENTADO - goal.service.ts
  institution_id?: string; // ✅ ACTUALMENTE EN USO - Sistema de instituciones
  level_cefr?: LevelCEFR; // ✅ ACTUALMENTE EN USO - Formularios de estudiantes
  target_language?: string; // ✅ ACTUALMENTE EN USO - Formularios de estudiantes
  country?: string; // ✅ ACTUALMENTE EN USO - Formularios de estudiantes
  birth_date?: Date; // ✅ ACTUALMENTE EN USO - Formularios de estudiantes
  enrollment_date?: Date; // ✅ ACTUALMENTE EN USO - Formularios de estudiantes
  status?: UserStatus; // TODO: Implementar gestión de estado de estudiantes
  photo_url?: string; // TODO: Implementar subida de fotos de perfil
  preferred_tutor_ids?: string[]; // TODO: Sistema de tutores favoritos
  total_classes?: number; // TODO: Implementar contador de clases tomadas
  created_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
  updated_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
  age: number;
  level_group: string; // e.g., "Madrid Musketeers (7–9 años)"
  individual_duration_minutes?: number;
  allergies_conditions?: string;
  responsible_person: string;
  contact_phone: string;
  additional_notes?: string;
  timezone?: string; // Zona horaria del estudiante
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
  contact_email?: string; // TODO: Implementar en formularios (actualmente no se usa)
  address?: string; // TODO: Implementar en formularios (referenciado en servicios pero no usado)
  description: string;
  logo_url?: string; // ✅ ACTUALMENTE EN USO - Formulario de registro de instituciones
  website_url?: string; // TODO: Agregar al formulario de registro
  contact_person?: string; // ✅ ACTUALMENTE EN USO - Formulario de registro de instituciones
  languages_offered?: string[]; // ✅ ACTUALMENTE EN USO - Formulario de registro de instituciones
  tutors?: string[]; // ✅ ACTUALMENTE EN USO - Sistema de gestión de tutores
  students?: string[]; // ✅ ACTUALMENTE EN USO - Sistema de gestión de estudiantes
  status?: UserStatus; // TODO: Implementar gestión de estado de instituciones
  subscription_plan?: string; // TODO: Sistema de suscripciones/planes
  max_tutors?: number; // TODO: Límites basados en planes de suscripción
  max_students?: number; // TODO: Límites basados en planes de suscripción
  created_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
  updated_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
}

export interface Language {
  id: string;
  code: string; // ISO 639‑1
  name: string; // Default name (English)
  name_es?: string; // Spanish translation
  name_en?: string; // English translation (fallback)
  is_active?: boolean; // TODO: Sistema de activación/desactivación de idiomas en admin panel
  created_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
}

export interface UserLanguage {
  user_id: string;
  language_id: string;
  level_cefr: LevelCEFR;
  is_native?: boolean; // TODO: Implementar en formularios de tutores
  is_teaching?: boolean; // TODO: Implementar diferenciación entre idiomas que habla vs enseña
  created_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
}

export interface Availability {
  week_day: string; // ISO 8601 format (e.g., "Monday")
  hours: number[]; // Array of hours in 24-hour format (e.g., [9, 10, 13, 14]) for 9 AM, 10 AM, 1 PM, and 2 PM
  timezone?: string; // TODO: Implementar soporte de zonas horarias
  is_recurring?: boolean; // TODO: Disponibilidad puntual vs recurrente
}

export interface Course {
  id: string;
  institution_id: string;
  title: string;
  description: string;
  language_code: string; // TODO: default es 'es' (español)
  level_cefr?: LevelCEFR;
  capacity: number; //TODO: 0 is unlimited
  current_enrollment?: number; // TODO: Implementar contador automático de inscritos
  start_date: Date;
  end_date?: Date;
  price?: number; // TODO: Sistema de precios para cursos
  currency?: string; // TODO: Soporte multi-moneda
  status?: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'; // TODO: Estados de cursos
  tutor_id?: string; // TODO: Asignación de tutores principales
  students?: string[]; // ✅ SERVICIO IMPLEMENTADO - course.service.ts
  non_registered_students?: string[]; // TODO: Implementar gestión de estudiantes no registrados
  created_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
  updated_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
}

export interface Class {
  id: string;
  course_id?: string; // ✅ IMPLEMENTADO - Soporta clases individuales y de curso
  scheduled_at: FieldValue | Timestamp;
  duration_minutes: number;
  price_per_hour: number;
  currency?: string; // TODO: Soporte multi-moneda para clases
  status?: 'scheduled' | 'ongoing' | 'completed' | 'cancelled' | 'no-show'; // TODO: Estados de clases
  meeting_url?: string; // TODO: Integración con Zoom/Meet
  notes?: string; // TODO: Sistema de notas de clase
  completed_at?: FieldValue | Timestamp; // TODO: Tracking de finalización
  created_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
  updated_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
  // TODO: Check if job posting covers the criteria
}

export interface Feedback {
  id: string;
  class_id: string;
  tutor_id?: string; // TODO: Implementar en formularios de feedback
  student_id?: string; // TODO: Implementar en formularios de feedback
  rating: number; // 1-5
  comment: string;
  is_public?: boolean; // TODO: Sistema de feedback público/privado
  helpful_count?: number; // TODO: Sistema de "útil" para feedback
  created_at: FieldValue | Timestamp; // ✅ SERVICIO IMPLEMENTADO - feedback.service.ts
  updated_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
}

export interface Payment {
  id: string;
  payer_id: string;   // student or institution
  payee_id: string;   // tutor
  class_id?: string;  // TODO: Relacionar pagos con clases específicas
  amount: number;
  currency: string;
  paid_at?: Date;
  status: PaymentStatus; // ✅ SERVICIO IMPLEMENTADO - payment.service.ts
  payment_method?: string; // TODO: Integración con pasarelas de pago
  transaction_id?: string; // TODO: IDs de transacciones externas
  fees?: number; // TODO: Sistema de comisiones
  net_amount?: number; // TODO: Cálculo automático de montos netos
  description?: string; // TODO: Descripciones de pagos
  created_at: FieldValue | Timestamp; // ✅ SERVICIO IMPLEMENTADO - payment.service.ts
  updated_at?: FieldValue | Timestamp; // ✅ Implementado en servicios
}

export interface TeachingCertification {
  name: string;
  description: string;
  link?: string;
  issuer?: string; // TODO: Validación de emisores de certificaciones
  issue_date?: Date; // TODO: Fechas de certificaciones en formularios
  expiry_date?: Date; // TODO: Validación de certificaciones vigentes
  is_verified?: boolean; // TODO: Sistema de verificación de certificaciones
}

export interface LanguageCertification {
  name: string;
  link?: string;
  level?: LevelCEFR; // TODO: Relacionar certificaciones con niveles CEFR
  language?: string; // TODO: Especificar idioma de la certificación
  issuer?: string; // TODO: Validación de emisores de certificaciones
  issue_date?: Date; // TODO: Fechas de certificaciones en formularios
  expiry_date?: Date; // TODO: Validación de certificaciones vigentes
  is_verified?: boolean; // TODO: Sistema de verificación de certificaciones
}

export interface Reference {
  name: string;
  contact: string;
  relationship?: string; // TODO: Tipo de relación con la referencia
  organization?: string; // TODO: Organización de la referencia
  is_verified?: boolean; // TODO: Sistema de verificación de referencias
}

export interface Postulant {
  id?: string;
  // Paso 1 - Datos personales
  temporal: boolean; // ✅ ACTUALMENTE EN USO - Control de estado temporal
  full_name?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  email?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  phone?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  has_whatsapp?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  country?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  linkedin_profile?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  
  // Paso 2 - Competencia Lingüística
  native_language?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  other_languages?: string[]; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  teaching_certifications?: TeachingCertification[]; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  language_certifications?: LanguageCertification[]; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  has_dialectal_variant?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  dialectal_variant?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  
  // Paso 3 - Pedagogía & Metodología
  knows_cervantes_education?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  methodology_description?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  adaptive_material_link?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  class_adaptation_description?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  
  // Paso 4 - Experiencia & Referencias
  teaching_experience_amount?: number; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  teaching_experience_unit?: 'hours' | 'years'; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  references?: Reference[]; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  has_portfolio?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  portfolio_link?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  recorded_class_link?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  has_curriculum?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  curriculum_link?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  
  // Paso 5 - Habilidades y disponibilidad
  knows_zoom?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  knows_airtm?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  knows_crypto_platform?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  crypto_platform_name?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  has_hd_equipment?: boolean; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  internet_speed_test_link?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  weekly_availability_description?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  hourly_rate_amount?: number; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  hourly_rate_currency?: string; // ✅ ACTUALMENTE EN USO - Formulario de postulantes
  
  created_at?: FieldValue | Timestamp; // ✅ SERVICIO IMPLEMENTADO - postulant.service.ts
  updated_at?: FieldValue | Timestamp; // ✅ SERVICIO IMPLEMENTADO - postulant.service.ts
}

// Nuevas interfaces útiles para el sistema

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  is_read: boolean;
  action_url?: string; // URL a la que redirigir al hacer click
  created_at: FieldValue | Timestamp;
  // TODO: Implementar sistema completo de notificaciones push
}

export interface Session {
  id: string;
  class_id: string;
  tutor_id: string;
  student_id: string;
  start_time: FieldValue | Timestamp;
  end_time?: FieldValue | Timestamp;
  actual_duration?: number; // Duración real en minutos
  recording_url?: string; // URL de la grabación si existe
  materials_shared?: string[]; // URLs de materiales compartidos
  homework_assigned?: string; // Tarea asignada
  notes_tutor?: string; // Notas del tutor
  notes_student?: string; // Notas del estudiante
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  created_at: FieldValue | Timestamp;
  updated_at?: FieldValue | Timestamp;
  // TODO: Implementar interfaz de sesiones detalladas (complementa Class)
}

export interface TutorApplication {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  country: string;
  linkedin_profile?: string;
  native_language: string;
  other_languages: string[];
  teaching_experience: number;
  bio: string;
  certifications: TeachingCertification[];
  hourly_rate: number;
  status: 'pending' | 'approved' | 'rejected' | 'interview_scheduled';
  rejection_reason?: string;
  approved_by?: string; // ID del admin que aprobó
  interview_scheduled_at?: FieldValue | Timestamp;
  created_at: FieldValue | Timestamp;
  updated_at?: FieldValue | Timestamp;
  // TODO: Implementar flujo de aplicaciones (diferente a Postulant, más formal)
}

export interface SystemSettings {
  id: string;
  key: string;
  value: any;
  description?: string;
  category?: string;
  is_public?: boolean; // Si la configuración es pública o solo para admins
  updated_by?: string; // ID del admin que actualizó
  updated_at: FieldValue | Timestamp;
  // TODO: Panel de administración para configuraciones del sistema
}

// Tipos para sistema de convocatorias/trabajos
export type ClassType = 'prueba' | 'regular' | 'recurrente' | 'intensiva';
export type ClassModality = 'presencial' | 'virtual' | 'hibrida';
export type JobPostingStatus = 'draft' | 'published' | 'assigned' | 'completed' | 'cancelled';
export type FrequencyType = 'unica' | 'semanal' | 'diario' | 'otro';
export type PostulationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';
export type ClassStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';

export interface TutorPostulation {
  id?: string;
  job_posting_id: string;
  tutor_id: string;
  institution_id: string;
  proposed_hourly_rate: number;
  currency: string;
  cover_letter: string;
  teaching_approach: string;
  availability_confirmation: boolean;
  status: PostulationStatus;
  postulated_at: FieldValue | Timestamp;
  responded_at?: FieldValue | Timestamp;
  response_notes?: string;
  created_at: FieldValue | Timestamp;
  updated_at?: FieldValue | Timestamp;
}

export interface StudentDetails {
  name: string;
  age: number;
  email?: string;
  level_group: string; // e.g., "Madrid Musketeers (7–9 años)"
  individual_duration_minutes?: number;
  allergies_conditions?: string;
  responsible_person: string;
  contact_phone: string;
  additional_notes?: string;
  
  // Campos para gestión de estudiantes registrados
  is_registered?: boolean; // Si el estudiante está registrado en el sistema
  user_id?: string; // ID del usuario estudiante si está registrado
  created_during_job_posting?: boolean; // Si se creó durante el proceso de job posting
  timezone?: string; // Zona horaria del estudiante
}

export interface JobPosting {
  id: string;
  institution_id: string;
  
  // Bloque 1 - Información General
  title: string;
  class_type: ClassType;
  modality: ClassModality;
  program: string; // "Trial Class", "Programa Base", "Avanzado", "Otro…"
  additional_comment?: string;
  
  // Bloque 2 - Detalles de la(s) clase(s)
  class_date: Date;
  start_time: string; // formato HH:mm
  total_duration_minutes: number;
  is_divided_by_students: boolean;
  frequency: FrequencyType;
  frequency_other?: string; // si frequency === 'otro'
  location?: string; // para clases presenciales
  location_latitude?: number;
  location_longitude?: number;
  video_call_link?: string; // para clases virtuales
  
  // Bloque 3 - Estudiantes & Logística
  students: StudentDetails[];
  
  // Gestión del trabajo
  status: JobPostingStatus;
  assigned_tutor_id?: string;
  assigned_at?: Date;
  hourly_rate?: number;
  currency?: string;
  total_payment?: number;
  
  // Zona horaria
  timezone: string; // Zona horaria de la institución
  
  // Metadata
  created_by: string; // user_id de quien creó la convocatoria
  created_at: FieldValue | Timestamp;
  updated_at?: FieldValue | Timestamp;
  
  // TODO: Sistema de notificaciones cuando se asigna tutor
  // TODO: Integración automática con Zoom para generar meeting
}

// Tipos para clases generadas
export interface ClassInstance {
  id?: string;
  course_id: string;
  job_posting_id?: string; // Referencia a la convocatoria original
  postulation_id?: string; // Referencia a la postulación aceptada
  institution_id: string;
  tutor_id: string;
  class_date: Date | FieldValue | Timestamp;
  start_time: string;
  duration_minutes: number;
  location?: string;
  video_call_link?: string;
  modality: ClassModality;
  status: ClassStatus;
  students: StudentDetails[];
  hourly_rate: number;
  currency: string;
  timezone: string;
  notes?: string;
  created_at: FieldValue | Timestamp;
  updated_at?: FieldValue | Timestamp;
}
