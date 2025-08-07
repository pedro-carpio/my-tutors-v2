// Export all services for easy importing
export * from './user.service';
export * from './multi-role.service'; // Nuevo servicio de múltiples roles
export * from './tutor.service';
export * from './student.service';
export * from './institution.service';
export * from './language.service';
export * from './teaching-certification.service'; // Servicio de certificaciones de enseñanza
export * from './language-certification.service'; // Servicio de certificaciones de idiomas
export * from './class.service';
export * from './class-instance.service'; // Nuevo servicio de instancias de clase
export * from './course.service';
export * from './payment.service';
export * from './availability.service';
export * from './feedback.service';
export * from './chat.service';
export * from './session.service';
export * from './postulant.service';
export * from './goal.service';
export * from './email.service';
export * from './password-generator.service';
export * from './loading.service';
export * from './pending-configurations.service';
export * from './job-posting.service'; // Nuevo servicio de convocatorias
export * from './tutor-postulation.service'; // Nuevo servicio de postulaciones
export * from './i18n.service'; // Servicio de internacionalización
export * from './tutor-language.service'; // Servicio de idiomas de tutores
export * from './meta.service'; // Servicio de meta tags

// Export types explicitly to avoid conflicts
export type {
  User,
  Student,
  Tutor,
  Institution,
  Course,
  ClassInstance,
  TutorPostulation,
  PostulationStatus,
  ClassStatus,
  JobPosting,
  UserRole
} from '../types/firestore.types';
