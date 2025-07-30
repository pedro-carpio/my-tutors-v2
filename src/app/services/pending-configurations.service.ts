import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, switchMap, of } from 'rxjs';
import { UserRole, User } from '../types/firestore.types';
import { UserService, TutorService, StudentService, InstitutionService, MultiRoleService } from './index';
import { Auth, user, User as FirebaseUser } from '@angular/fire/auth';

export interface PendingConfiguration {
  id: string;
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  action: string; // Ruta o acción a ejecutar
  completed: boolean;
  translationKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class PendingConfigurationsService {
  private auth = inject(Auth);
  private userService = inject(UserService);
  private multiRoleService = inject(MultiRoleService);
  private tutorService = inject(TutorService);
  private studentService = inject(StudentService);
  private institutionService = inject(InstitutionService);

  // Configuraciones base por rol
  private baseConfigurations: Record<UserRole, PendingConfiguration[]> = {
    student: [
      {
        id: 'complete-profile',
        title: 'Completar perfil',
        description: 'Completa tu información personal para una mejor experiencia',
        icon: 'account_circle',
        priority: 'high',
        action: '/profile',
        completed: false,
        translationKey: 'dashboard.pendingConfig.completeProfile'
      },
      {
        id: 'set-learning-goals',
        title: 'Establecer objetivos de aprendizaje',
        description: 'Define tus metas y objetivos de aprendizaje',
        icon: 'flag',
        priority: 'medium',
        action: '/configuration',
        completed: false,
        translationKey: 'dashboard.pendingConfig.setLearningGoals'
      },
      {
        id: 'find-tutors',
        title: 'Buscar tutores',
        description: 'Explora y encuentra tutores que se adapten a tus necesidades',
        icon: 'search',
        priority: 'medium',
        action: '/student/tutors',
        completed: false,
        translationKey: 'dashboard.pendingConfig.findTutors'
      },
      {
        id: 'schedule-first-class',
        title: 'Programar primera clase',
        description: 'Agenda tu primera clase con un tutor',
        icon: 'event',
        priority: 'high',
        action: '/calendar',
        completed: false,
        translationKey: 'dashboard.pendingConfig.scheduleFirstClass'
      }
    ],
    tutor: [
      {
        id: 'complete-profile',
        title: 'Completar perfil',
        description: 'Completa tu información profesional y experiencia',
        icon: 'account_circle',
        priority: 'high',
        action: '/profile',
        completed: false,
        translationKey: 'dashboard.pendingConfig.completeProfile'
      },
      {
        id: 'set-availability',
        title: 'Configurar disponibilidad',
        description: 'Establece tu horario de disponibilidad para clases',
        icon: 'schedule',
        priority: 'high',
        action: '/configuration',
        completed: false,
        translationKey: 'dashboard.pendingConfig.setAvailability'
      },
      {
        id: 'set-hourly-rate',
        title: 'Establecer tarifa horaria',
        description: 'Define tu precio por hora de enseñanza',
        icon: 'attach_money',
        priority: 'high',
        action: '/configuration',
        completed: false,
        translationKey: 'dashboard.pendingConfig.setHourlyRate'
      },
      {
        id: 'view-job-postings',
        title: 'Ver convocatorias',
        description: 'Revisa las convocatorias de clases disponibles',
        icon: 'work',
        priority: 'medium',
        action: '/job-postings',
        completed: false,
        translationKey: 'dashboard.pendingConfig.viewJobPostings'
      },
      {
        id: 'upload-certifications',
        title: 'Subir certificaciones',
        description: 'Agrega tus certificaciones y títulos académicos',
        icon: 'school',
        priority: 'medium',
        action: '/profile',
        completed: false,
        translationKey: 'dashboard.pendingConfig.uploadCertifications'
      }
    ],
    institution: [
      {
        id: 'complete-profile',
        title: 'Completar perfil institucional',
        description: 'Completa la información de tu institución',
        icon: 'business',
        priority: 'high',
        action: '/profile',
        completed: false,
        translationKey: 'dashboard.pendingConfig.completeInstitutionProfile'
      },
      {
        id: 'add-tutors',
        title: 'Agregar tutores',
        description: 'Invita y gestiona tutores para tu institución',
        icon: 'person_add',
        priority: 'high',
        action: '/institution/tutors',
        completed: false,
        translationKey: 'dashboard.pendingConfig.addTutors'
      },
      {
        id: 'add-students',
        title: 'Agregar estudiantes',
        description: 'Registra estudiantes en tu institución',
        icon: 'group_add',
        priority: 'high',
        action: '/institution/students',
        completed: false,
        translationKey: 'dashboard.pendingConfig.addStudents'
      },
      {
        id: 'create-job-posting',
        title: 'Publicar convocatoria',
        description: 'Crea convocatorias para clases y cursos',
        icon: 'campaign',
        priority: 'medium',
        action: '/job-postings',
        completed: false,
        translationKey: 'dashboard.pendingConfig.createJobPosting'
      },
      {
        id: 'configure-languages',
        title: 'Configurar idiomas',
        description: 'Establece los idiomas que ofrece tu institución',
        icon: 'language',
        priority: 'medium',
        action: '/configuration',
        completed: false,
        translationKey: 'dashboard.pendingConfig.configureLanguages'
      }
    ],
    admin: [
      {
        id: 'system-overview',
        title: 'Revisar estado del sistema',
        description: 'Revisa métricas y estado general del sistema',
        icon: 'dashboard',
        priority: 'high',
        action: '/admin/overview',
        completed: false,
        translationKey: 'dashboard.pendingConfig.systemOverview'
      },
      {
        id: 'user-management',
        title: 'Gestión de usuarios',
        description: 'Administra usuarios y permisos del sistema',
        icon: 'admin_panel_settings',
        priority: 'medium',
        action: '/admin/users',
        completed: false,
        translationKey: 'dashboard.pendingConfig.userManagement'
      },
      {
        id: 'system-settings',
        title: 'Configuración del sistema',
        description: 'Ajusta configuraciones globales del sistema',
        icon: 'settings',
        priority: 'medium',
        action: '/admin/settings',
        completed: false,
        translationKey: 'dashboard.pendingConfig.systemSettings'
      }
    ]
  };

  /**
   * Obtiene las configuraciones pendientes para el usuario actual
   * Ahora considera todos los roles del usuario, no solo uno
   */
  getPendingConfigurations(): Observable<PendingConfiguration[]> {
    return user(this.auth).pipe(
      switchMap((authUser: FirebaseUser | null) => {
        if (!authUser) return of([]);
        
        return this.multiRoleService.userRoles$.pipe(
          switchMap((roles: UserRole[]) => {
            if (roles.length === 0) return of([]);
            
            // Combinar configuraciones de todos los roles
            const allConfigurations: PendingConfiguration[] = [];
            
            roles.forEach(role => {
              const roleConfigurations = this.baseConfigurations[role] || [];
              allConfigurations.push(...roleConfigurations);
            });

            // Eliminar duplicados por ID
            const uniqueConfigurations = allConfigurations.filter((config, index, self) => 
              index === self.findIndex(c => c.id === config.id)
            );

            return this.evaluateMultiRoleConfigurations(uniqueConfigurations, roles, authUser.uid);
          })
        );
      })
    );
  }

  /**
   * Evalúa configuraciones para múltiples roles
   */
  private evaluateMultiRoleConfigurations(
    configurations: PendingConfiguration[], 
    roles: UserRole[], 
    userId: string
  ): Observable<PendingConfiguration[]> {
    // Crear observables para cada rol
    const roleEvaluations = roles.map(role => {
      const roleConfigs = configurations.filter(config => 
        this.baseConfigurations[role]?.some(baseConfig => baseConfig.id === config.id)
      );
      return this.evaluateConfigurations(roleConfigs, role, userId);
    });

    return combineLatest(roleEvaluations).pipe(
      map(evaluatedConfigLists => {
        // Combinar y eliminar duplicados
        const combined = evaluatedConfigLists.flat();
        return combined.filter((config, index, self) => 
          index === self.findIndex(c => c.id === config.id)
        );
      })
    );
  }

  /**
   * Evalúa qué configuraciones están completadas basado en los datos del usuario
   */
  private evaluateConfigurations(configurations: PendingConfiguration[], role: UserRole, userId: string): Observable<PendingConfiguration[]> {
    switch (role) {
      case 'student':
        return this.evaluateStudentConfigurations(configurations, userId);
      case 'tutor':
        return this.evaluateTutorConfigurations(configurations, userId);
      case 'institution':
        return this.evaluateInstitutionConfigurations(configurations, userId);
      case 'admin':
        return this.evaluateAdminConfigurations(configurations, userId);
      default:
        return new Observable(observer => observer.next(configurations));
    }
  }

  /**
   * Evalúa configuraciones específicas para estudiantes
   */
  private evaluateStudentConfigurations(configurations: PendingConfiguration[], userId: string): Observable<PendingConfiguration[]> {
    return this.studentService.getStudent(userId).pipe(
      map(studentData => {
        return configurations.map(config => {
          const updatedConfig = { ...config };
          
          switch (config.id) {
            case 'complete-profile':
              updatedConfig.completed = !!(studentData?.full_name && studentData?.phone && studentData?.country);
              break;
            case 'set-learning-goals':
              updatedConfig.completed = !!(studentData?.goals && studentData.goals.length > 0);
              break;
            case 'schedule-first-class':
              // TODO: Implementar verificación de clases programadas
              updatedConfig.completed = false;
              break;
          }
          
          return updatedConfig;
        });
      })
    );
  }

  /**
   * Evalúa configuraciones específicas para tutores
   */
  private evaluateTutorConfigurations(configurations: PendingConfiguration[], userId: string): Observable<PendingConfiguration[]> {
    return this.tutorService.getTutor(userId).pipe(
      map(tutorData => {
        return configurations.map(config => {
          const updatedConfig = { ...config };
          
          switch (config.id) {
            case 'complete-profile':
              updatedConfig.completed = !!(tutorData?.full_name && tutorData?.bio && tutorData?.phone);
              break;
            case 'set-availability':
              updatedConfig.completed = !!(tutorData?.availability && tutorData.availability.length > 0 && 
                tutorData.availability.some(day => day.hours.length > 0));
              break;
            case 'set-hourly-rate':
              updatedConfig.completed = !!(tutorData?.hourly_rate && tutorData.hourly_rate > 0);
              break;
            case 'upload-certifications':
              updatedConfig.completed = !!(tutorData?.certifications && tutorData.certifications.length > 0);
              break;
          }
          
          return updatedConfig;
        });
      })
    );
  }

  /**
   * Evalúa configuraciones específicas para instituciones
   */
  private evaluateInstitutionConfigurations(configurations: PendingConfiguration[], userId: string): Observable<PendingConfiguration[]> {
    return this.institutionService.getInstitution(userId).pipe(
      map(institutionData => {
        return configurations.map(config => {
          const updatedConfig = { ...config };
          
          switch (config.id) {
            case 'complete-profile':
              updatedConfig.completed = !!(institutionData?.name && institutionData?.description && institutionData?.contact_email);
              break;
            case 'add-tutors':
              updatedConfig.completed = !!(institutionData?.tutors && institutionData.tutors.length > 0);
              break;
            case 'add-students':
              updatedConfig.completed = !!(institutionData?.students && institutionData.students.length > 0);
              break;
            case 'configure-languages':
              updatedConfig.completed = !!(institutionData?.languages_offered && institutionData.languages_offered.length > 0);
              break;
          }
          
          return updatedConfig;
        });
      })
    );
  }

  /**
   * Evalúa configuraciones específicas para administradores
   */
  private evaluateAdminConfigurations(configurations: PendingConfiguration[], userId: string): Observable<PendingConfiguration[]> {
    // Para admin, todas las configuraciones siempre están disponibles
    return new Observable(observer => {
      observer.next(configurations.map(config => ({ ...config, completed: false })));
    });
  }

  /**
   * Marca una configuración como completada
   */
  markAsCompleted(configurationId: string): void {
    // Esta función podría guardar el estado en localStorage o en Firestore
    localStorage.setItem(`config_${configurationId}_completed`, 'true');
  }

  /**
   * Obtiene configuraciones pendientes (no completadas) de alta prioridad
   */
  getHighPriorityPendingConfigurations(): Observable<PendingConfiguration[]> {
    return this.getPendingConfigurations().pipe(
      map(configs => configs.filter(config => !config.completed && config.priority === 'high'))
    );
  }

  /**
   * Obtiene el conteo de configuraciones pendientes
   */
  getPendingConfigurationsCount(): Observable<number> {
    return this.getPendingConfigurations().pipe(
      map(configs => configs.filter(config => !config.completed).length)
    );
  }
}
