import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Language = 'es' | 'en';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private currentLanguage = signal<Language>('es');
  private languageSubject = new BehaviorSubject<Language>('es');
  
  // Observable para que los componentes puedan suscribirse
  language$ = this.languageSubject.asObservable();
  
  // Signal para acceso reactivo
  currentLang = this.currentLanguage.asReadonly();

  constructor() {
    // Cargar idioma desde localStorage o usar español como default
    const savedLanguage = localStorage.getItem('app-language') as Language;
    if (savedLanguage && (savedLanguage === 'es' || savedLanguage === 'en')) {
      this.setLanguage(savedLanguage);
    }
  }

  setLanguage(language: Language): void {
    this.currentLanguage.set(language);
    this.languageSubject.next(language);
    localStorage.setItem('app-language', language);
  }

  toggleLanguage(): void {
    const newLanguage: Language = this.currentLanguage() === 'es' ? 'en' : 'es';
    this.setLanguage(newLanguage);
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage();
  }

  translate(key: string, params?: Record<string, any>): string {
    const translations = this.getTranslations();
    const languageTranslations = translations[this.currentLanguage()];
    
    // Navegar a través de claves anidadas (ej: "auth.login.title")
    const keys = key.split('.');
    let value: any = languageTranslations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    let translatedText = value || key;
    
    // Reemplazar parámetros si se proporcionan
    if (params && typeof translatedText === 'string') {
      Object.keys(params).forEach(param => {
        translatedText = translatedText.replace(new RegExp(`{${param}}`, 'g'), params[param]);
      });
    }
    
    return translatedText;
  }

  private getTranslations(): Record<Language, any> {
    return {
      es: {
        // Layout y navegación
        layout: {
          menu: 'Menú',
          appName: 'My Tutors',
          title: '¡Inicia sesión con tus credenciales proporcionadas!',
          changeLanguage: 'Cambiar idioma',
          setTimezone: 'Configurar zona horaria',
          logout: 'Cerrar sesión',
          noMenuItems: 'No hay elementos de menú disponibles',
          lost: 'No sé cómo llegué aquí, pero estoy perdido',
        },

        // Navegación
        navigation: {
          dashboard: 'General',
          home: 'Inicio',
          profile: 'Perfil',
          student: 'Estudiante',
          myClasses: 'Mis Clases',
          findTutors: 'Buscar Tutores',
          tutor: 'Tutor',
          myStudents: 'Mis Estudiantes',
          availability: 'Disponibilidad',
          institution: 'Institución',
          manageTutors: 'Mis tutores',
          manageStudents: 'Mis estudiantes',
          work: 'Trabajo',
          jobPostings: 'Ofertas de Trabajo',
          admin: 'Administración',
          userManagement: 'Gestión de Usuarios',
          roleManagement: 'Gestión de Roles',
          systemSettings: 'Configuración del Sistema'
        },

        // Traducciones generales para opciones
        languageOptions: {
          english: 'Inglés',
          spanish: 'Español',
          french: 'Francés',
          portuguese: 'Portugués',
          italian: 'Italiano',
          german: 'Alemán'
        },

        experienceLevels: {
          beginner: 'Principiante',
          intermediate: 'Intermedio',
          advanced: 'Avanzado',
          expert: 'Experto'
        },

        availabilityOptions: {
          morning: 'Mañana',
          afternoon: 'Tarde',
          evening: 'Noche',
          night: 'Madrugada',
          weekends: 'Fines de semana',
          flexible: 'Flexible'
        },

        dialectalVariants: {
          argentino: 'Argentino',
          boliviano: 'Boliviano',
          chileno: 'Chileno',
          colombiano: 'Colombiano',
          ecuatoriano: 'Ecuatoriano',
          español: 'Español (España)',
          mexicano: 'Mexicano',
          peruano: 'Peruano',
          uruguayo: 'Uruguayo',
          venezolano: 'Venezolano'
        },
        
        // Autenticación
        auth: {
          login: {
            title: 'Iniciar Sesión',
            email: 'Correo electrónico',
            password: 'Contraseña',
            emailPlaceholder: 'tu@email.com',
            passwordPlaceholder: 'Tu contraseña',
            loginButton: 'Iniciar sesión',
            loggingIn: 'Iniciando sesión...',
            forgotPassword: '¿Olvidaste tu contraseña?',
            noAccount: '¿No tienes cuenta? Regístrate como:',
            student: 'Estudiante',
            tutor: 'Tutor',
            institution: 'Institución',
            continueWithGoogle: 'Continuar con Google',
            or: 'o',
            loginSuccess: 'Inicio de sesión exitoso',
            loginError: 'Error al iniciar sesión',
            userNotFound: 'No existe una cuenta con este correo electrónico',
            wrongPassword: 'Contraseña incorrecta',
            invalidEmail: 'Correo electrónico inválido',
            userDisabled: 'Esta cuenta ha sido deshabilitada',
            tooManyRequests: 'Demasiados intentos fallidos. Intenta más tarde'
          },
          forgotPassword: {
            title: 'Recuperar Contraseña',
            description: 'Ingresa tu dirección de correo electrónico y te enviaremos un enlace para restablecer tu contraseña.',
            email: 'Correo electrónico',
            emailPlaceholder: 'tu@email.com',
            sendLink: 'Enviar enlace de recuperación',
            sending: 'Enviando...',
            backToLogin: 'Volver al inicio de sesión',
            emailSent: '¡Email enviado!',
            emailSentMessage: 'Email de recuperación enviado exitosamente',
            checkInbox: 'Revisa tu bandeja de entrada, debido a que esta es una prueba beta, probablemente se encuentra en spam. haz clic en el enlace para restablecer tu contraseña.',
            needHelp: '¿Necesitas ayuda adicional?',
            whatsappSupport: 'WhatsApp Support',
            emailSupport: 'Email Support',
            resendEmail: 'Reenviar email',
            emailError: 'Error al enviar el email de recuperación',
            unexpectedError: 'Error inesperado. Por favor, inténtalo de nuevo.'
          },
          passwordSetup: {
            title: 'Configurar Contraseña',
            message: 'Esta es tu primera vez iniciando sesión con {email}. Por favor, crea una contraseña segura para tu cuenta.',
            newPassword: 'Nueva contraseña',
            confirmPassword: 'Confirmar contraseña',
            passwordPlaceholder: 'Mínimo 6 caracteres',
            confirmPasswordPlaceholder: 'Repite tu contraseña',
            confirm: 'Confirmar',
            setting: 'Configurando...',
            success: 'Cuenta activada exitosamente. ¡Bienvenido!',
            error: 'Error al activar la cuenta. Contacta al administrador.',
            cancelled: 'Configuración de contraseña cancelada.'
          }
        },
        
        // Registro
        register: {
          student: {
            title: 'Registro de Estudiante',
            subtitle: 'Únete y comienza a aprender idiomas',
            basicInfo: 'Información básica',
            fullName: 'Nombre completo',
            fullNamePlaceholder: 'Ingresa tu nombre completo',
            email: 'Correo electrónico',
            emailPlaceholder: 'tu-email@ejemplo.com',
            security: 'Configuración de seguridad',
            password: 'Contraseña',
            passwordPlaceholder: 'Mínimo 6 caracteres',
            confirmPassword: 'Confirmar contraseña',
            confirmPasswordPlaceholder: 'Repite tu contraseña',
            confirmation: 'Confirmación',
            haveAccount: '¿Ya tienes cuenta? Inicia sesión',
            registerAs: '¿Quieres registrarte como:',
            tutor: 'Tutor',
            institution: 'Institución',
            next: 'Siguiente',
            back: 'Atrás',
            complete: 'Completar registro',
            reset: 'Reiniciar',
            registering: 'Registrando...',
            registerSuccess: '¡Registro exitoso! Completa tu perfil.',
            registerError: 'Error en el registro. Intenta nuevamente.',
            emailExists: 'Este email ya está registrado.',
            weakPassword: 'La contraseña debe tener al menos 6 caracteres.',
            goals: 'Objetivos',
            goalsDescription: 'Define tus objetivos de aprendizaje.',
            selectGoals: 'Selecciona tus objetivos',
            selectMultipleGoals: 'Puedes seleccionar múltiples objetivos',
            selectedGoals: 'Objetivos seleccionados',
          },
          tutor: {
            title: 'Registro de Tutor',
            subtitle: 'Comparte tu conocimiento y enseña idiomas',
            basicInfo: 'Información básica',
            fullName: 'Nombre completo',
            fullNamePlaceholder: 'Ingresa tu nombre completo',
            email: 'Correo electrónico',
            emailPlaceholder: 'tu-email@ejemplo.com',
            professionalInfo: 'Información profesional',
            languages: 'Idiomas que enseñas',
            languagesPlaceholder: 'Selecciona los idiomas',
            experienceLevel: 'Nivel de experiencia',
            experiencePlaceholder: 'Selecciona tu nivel',
            bio: 'Biografía profesional',
            bioPlaceholder: 'Describe tu experiencia y metodología de enseñanza (mínimo 50 caracteres)',
            hourlyRate: 'Tarifa por hora (USD)',
            hourlyRatePlaceholder: 'Ej: 15',
            security: 'Configuración de seguridad',
            password: 'Contraseña',
            passwordPlaceholder: 'Mínimo 6 caracteres',
            confirmPassword: 'Confirmar contraseña',
            confirmPasswordPlaceholder: 'Repite tu contraseña',
            confirmation: 'Confirmación',
            reviewInfo: 'Revisa tu información',
            reviewDescription: 'Por favor, verifica que todos los datos estén correctos antes de crear tu cuenta.',
            basicInfoSummary: 'Información Básica',
            professionalInfoSummary: 'Información Profesional',
            haveAccount: '¿Ya tienes cuenta? Inicia sesión',
            registerAs: '¿Quieres registrarte como:',
            student: 'Estudiante',
            institution: 'Institución',
            next: 'Siguiente',
            back: 'Atrás',
            complete: 'Completar registro',
            reset: 'Reiniciar',
            registering: 'Registrando...',
            registerSuccess: '¡Registro exitoso! Completa tu perfil.',
            registerError: 'Error en el registro. Intenta nuevamente.'
          },
          institution: {
            title: 'Registro de Institución',
            subtitle: 'Ofrece cursos de idiomas a gran escala',
            basicInfo: 'Información básica',
            institutionDescription: 'El nombre de la institución se mostrará a estudiantes y tutores, puede ser tu nombre.',
            institutionName: 'Nombre de la institución',
            institutionNamePlaceholder: 'Universidad, Academia, Centro de Idiomas...',
            contactPerson: 'Persona de contacto',
            contactPersonPlaceholder: 'Nombre del responsable',
            email: 'Correo electrónico',
            emailPlaceholder: 'contacto@institucion.com',
            contactInfo: 'Información de contacto',
            phone: 'Teléfono',
            phonePlaceholder: '+1234567890',
            country: 'País',
            countryPlaceholder: 'Selecciona tu país',
            educationalInfo: 'Información educativa',
            languagesOffered: 'Idiomas que ofrecen',
            languagesPlaceholder: 'Selecciona los idiomas',
            description: 'Descripción de la institución',
            descriptionPlaceholder: 'Describe tu institución, metodología y servicios (mínimo 100 caracteres)',
            security: 'Configuración de seguridad',
            password: 'Contraseña',
            passwordPlaceholder: 'Mínimo 6 caracteres',
            confirmPassword: 'Confirmar contraseña',
            confirmPasswordPlaceholder: 'Repite tu contraseña',
            confirmation: 'Confirmación',
            haveAccount: '¿Ya tienes cuenta? Inicia sesión',
            registerAs: '¿Quieres registrarte como:',
            student: 'Estudiante',
            tutor: 'Tutor',
            next: 'Siguiente',
            back: 'Atrás',
            complete: 'Completar registro',
            reset: 'Reiniciar',
            registering: 'Registrando...',
            registerSuccess: '¡Registro exitoso! Completa tu perfil.',
            registerError: 'Error en el registro. Intenta nuevamente.'
          },
          google: {
            registerWith: 'Registrarse con Google',
            connecting: 'Conectando...',
            connectedWith: '¡Conectado con Google!',
            dataLoaded: '¡Datos cargados desde Google! Completa el registro.',
            connectionError: 'Error al conectar con Google',
            registerError: 'Error al registrarse con Google'
          }
        },
        
        // Idiomas
        languages: {
          spanish: 'Español',
          english: 'Inglés',
          french: 'Francés',
          german: 'Alemán',
          italian: 'Italiano',
          portuguese: 'Portugués',
          mandarin: 'Mandarín',
          japanese: 'Japonés',
          korean: 'Coreano',
          arabic: 'Árabe',
          russian: 'Ruso',
          dutch: 'Holandés'
        },
        
        // Niveles de experiencia
        experience: {
          beginner: 'Principiante (0-1 años)',
          intermediate: 'Intermedio (2-4 años)',
          advanced: 'Avanzado (5-9 años)',
          expert: 'Experto (10+ años)'
        },

        // Dashboard y configuraciones pendientes
        dashboard: {
          pendingConfig: {
            title: 'Configuraciones Pendientes',
            subtitle: 'Completa estas tareas para mejorar tu experiencia',
            progress: 'Progreso',
            pending: 'Pendientes',
            completed: 'Completadas',
            noConfigurations: 'No hay configuraciones pendientes',
            priority: {
              high: 'Alta',
              medium: 'Media',
              low: 'Baja'
            },
            completeProfile: {
              title: 'Completar perfil',
              description: 'Completa tu información personal para una mejor experiencia'
            },
            setLearningGoals: {
              title: 'Establecer objetivos de aprendizaje',
              description: 'Define tus metas y objetivos de aprendizaje'
            },
            findTutors: {
              title: 'Buscar tutores',
              description: 'Explora y encuentra tutores que se adapten a tus necesidades'
            },
            scheduleFirstClass: {
              title: 'Programar primera clase',
              description: 'Agenda tu primera clase con un tutor'
            },
            setAvailability: {
              title: 'Configurar disponibilidad',
              description: 'Establece tu horario de disponibilidad para clases'
            },
            setHourlyRate: {
              title: 'Establecer tarifa horaria',
              description: 'Define tu precio por hora de enseñanza'
            },
            viewJobPostings: {
              title: 'Ver convocatorias',
              description: 'Revisa las convocatorias de clases disponibles'
            },
            uploadCertifications: {
              title: 'Subir certificaciones',
              description: 'Agrega tus certificaciones y títulos académicos'
            },
            completeInstitutionProfile: {
              title: 'Completar perfil institucional',
              description: 'Completa la información de tu institución'
            },
            addTutors: {
              title: 'Agregar tutores',
              description: 'Invita y gestiona tutores para tu institución'
            },
            addStudents: {
              title: 'Agregar estudiantes',
              description: 'Registra estudiantes en tu institución'
            },
            createJobPosting: {
              title: 'Publicar convocatoria',
              description: 'Crea convocatorias para clases y cursos'
            },
            configureLanguages: {
              title: 'Configurar idiomas',
              description: 'Establece los idiomas que ofrece tu institución'
            },
            systemOverview: {
              title: 'Revisar estado del sistema',
              description: 'Revisa métricas y estado general del sistema'
            },
            userManagement: {
              title: 'Gestión de usuarios',
              description: 'Administra usuarios y permisos del sistema'
            },
            systemSettings: {
              title: 'Configuración del sistema',
              description: 'Ajusta configuraciones globales del sistema'
            }
          }
        },
        
        // Errores comunes
        errors: {
          required: 'Este campo es obligatorio',
          email: 'Ingresa un email válido',
          minlength: 'Mínimo {min} caracteres',
          passwordMismatch: 'Las contraseñas no coinciden'
        },
        
        // Botones comunes
        common: {
          save: 'Guardar',
          cancel: 'Cancelar',
          delete: 'Eliminar',
          edit: 'Editar',
          close: 'Cerrar',
          confirm: 'Confirmar',
          loading: 'Cargando...',
          switchRole: 'Cambiar rol',
          currentRole: 'Rol actual',
          to: 'a',
          saving: 'Guardando...',
          save_configuration: 'Guardar Configuración'
        },

        // Roles
        roles: {
          student: 'Estudiante',
          tutor: 'Tutor',
          institution: 'Institución',
          admin: 'Administrador'
        },

        // Sistema de convocatorias de trabajo
        jobPostings: {
          title: 'Convocatorias de Trabajo',
          createNew: 'Nueva Convocatoria',
          viewAll: 'Ver Todas',
          myPostings: 'Mis Convocatorias',
          availableJobs: 'Trabajos Disponibles',
          assignedJobs: 'Trabajos Asignados',
          
          // Estados
          status: {
            draft: 'Borrador',
            published: 'Publicada',
            assigned: 'Asignada',
            completed: 'Completada',
            cancelled: 'Cancelada'
          },

          // Tipos de clase
          classType: {
            label: 'Tipo de clase',
            prueba: 'Prueba',
            regular: 'Regular',
            recurrente: 'Recurrente',
            intensiva: 'Intensiva'
          },

          // Modalidades
          modality: {
            label: 'Modalidad',
            presencial: 'Presencial',
            virtual: 'Virtual',
            hibrida: 'Híbrida'
          },

          // Frecuencias
          frequency: {
            label: 'Frecuencia',
            unica: 'Única',
            semanal: 'Semanal',
            diario: 'Diario',
            otro: 'Otro'
          },

          // Formulario de creación
          form: {
            createTitle: 'Crear Nueva Convocatoria',
            editTitle: 'Editar Convocatoria',
            subtitle: 'Complete los detalles de la convocatoria de trabajo',
            
            loading: {
              create: 'Creando convocatoria...',
              edit: 'Cargando datos para editar...'
            },
            
            steps: {
              basicInfo: 'Información Básica',
              basicInfoDescription: 'Datos generales de la convocatoria de trabajo',
              classDetails: 'Detalles de la Clase',
              classDetailsDescription: 'Especificaciones de fecha, hora y duración',
              tutorRequirements: 'Requisitos del Tutor',
              tutorRequirementsDescription: 'Especifique los requisitos y preferencias para el tutor',
              students: 'Estudiantes',
              studentsDescription: 'Información de los estudiantes participantes',
              review: 'Revisión',
              reviewDescription: 'Revise todos los datos antes de crear la convocatoria'
            },
            
            fields: {
              title: 'Título de la convocatoria',
              program: 'Programa',
              classType: 'Tipo de clase',
              modality: 'Modalidad',
              additionalComment: 'Comentario adicional',
              classDate: 'Fecha de clase',
              startTime: 'Hora de inicio',
              duration: 'Duración (minutos)',
              frequency: 'Frecuencia',
              frequencyOther: 'Especificar frecuencia',
              location: 'Ubicación',
              videoCallLink: 'Enlace de videollamada',
              hourlyRate: 'Tarifa por hora',
              currency: 'Moneda',
              isDividedByStudents: 'Dividir tiempo por estudiantes',
              // Nuevos campos para requisitos del tutor
              requiredLanguages: 'Idiomas requeridos',
              targetLanguage: 'Idioma objetivo',
              requiredExperienceLevel: 'Nivel de experiencia requerido',
              maxHourlyRate: 'Tarifa máxima por hora'
            },
            
            placeholders: {
              title: 'Ej: Clase de prueba domingo 20 julio – 2 estudiantes',
              additionalComment: 'Ej: Clase dividida en 2 bloques según nivel',
              duration: '60',
              frequencyOther: 'Cada 15 días, mensual, etc.',
              location: 'Ej: 4445 Willard Ave, Ste 600 – Oficina 654, MD 20815',
              videoCallLink: 'https://zoom.us/j/...',
              hourlyRate: '25.00',
              maxHourlyRate: 'Ej: 30.00'
            },
            
            options: {
              program: {
                trial: 'Trial Class',
                base: 'Programa Base',
                advanced: 'Avanzado',
                other: 'Otro'
              },
              saveAsDraft: 'Guardar como borrador'
            },
            
            student: {
              title: 'Estudiante {number}',
              name: 'Nombre',
              age: 'Edad',
              levelGroup: 'Nivel / Grupo',
              levelGroupPlaceholder: 'Ej: Madrid Musketeers (7–9 años)',
              responsiblePerson: 'Persona responsable',
              contactPhone: 'Teléfono de contacto',
              individualDuration: 'Duración individual (min)',
              individualDurationHint: 'Tiempo específico para este estudiante (opcional)',
              allergiesConditions: 'Alergias / Condiciones',
              additionalNotes: 'Notas adicionales'
            },
            
            summary: {
              title: 'Resumen de la Convocatoria',
              basicInfo: 'Información Básica',
              classDetails: 'Detalles de la Clase',
              tutorRequirements: 'Requisitos del Tutor',
              students: 'Estudiantes',
              studentCount: 'Número de estudiantes'
            },
            
            buttons: {
              next: 'Siguiente',
              back: 'Atrás',
              cancel: 'Cancelar',
              create: 'Crear Convocatoria',
              update: 'Actualizar Convocatoria',
              addStudent: 'Agregar Estudiante',
              addRegisteredStudent: 'Usar Estudiante Registrado',
              createFirst: 'Crear Primera Convocatoria'
            },

            hints: {
              duration: 'Duración total de la clase en minutos',
              hourlyRate: 'Tarifa que se pagará al tutor',
              isDividedByStudents: 'Si se marca, el tiempo se dividirá entre los estudiantes',
              saveAsDraft: 'Los borradores no serán visibles para los tutores',
              addStudentOptions: 'Puedes agregar estudiantes manualmente o buscar estudiantes ya registrados en el sistema',
              maxHourlyRate: 'Tarifa máxima que está dispuesto a pagar al tutor'
            },
            
            errors: {
              required: 'Este campo es obligatorio',
              minLength: 'Mínimo {min} caracteres',
              minValue: 'Valor mínimo: {min}',
              maxValue: 'Valor máximo: {max}'
            }
          },
          
          // Filtros y acciones en la lista
          filters: {
            search: 'Buscar',
            searchPlaceholder: 'Buscar por título, programa o estudiante...',
            status: 'Estado',
            type: 'Tipo',
            modality: 'Modalidad',
            allStatuses: 'Todos los estados',
            allTypes: 'Todos los tipos',
            allModalities: 'Todas las modalidades'
          },
          
          actions: {
            create: 'Crear Convocatoria',
            view: 'Ver',
            viewDetails: 'Ver Detalles',
            edit: 'Editar',
            publish: 'Publicar',
            hide: 'Esconder',
            apply: 'Aplicar',
            assignTutor: 'Asignar Tutor',
            complete: 'Completar',
            cancel: 'Cancelar',
            createFirst: 'Crear Primera Convocatoria'
          },
          
          messages: {
            loading: 'Cargando convocatorias...',
            noResults: 'No se encontraron convocatorias',
            noResultsDescription: 'Intenta ajustar los filtros o crear una nueva convocatoria',
            created: 'Convocatoria creada exitosamente',
            updated: 'Convocatoria actualizada exitosamente',
            deleted: 'Convocatoria eliminada',
            applied: 'Aplicación enviada exitosamente',
            tutorAssigned: 'Tutor asignado exitosamente'
          },

          // Diálogo de detalles
          details: {
            basicInfo: 'Información Básica',
            classDetails: 'Detalles de la Clase',
            students: 'Estudiantes',
            additionalComments: 'Comentarios Adicionales',
            metadata: 'Información del Sistema'
          },

          // Campos específicos para el diálogo
          fields: {
            program: 'Programa',
            status: 'Estado',
            classType: 'Tipo de Clase',
            modality: 'Modalidad',
            classDate: 'Fecha de Clase',
            startTime: 'Hora de Inicio',
            duration: 'Duración',
            frequency: 'Frecuencia',
            frequencyOther: 'Otra Frecuencia',
            location: 'Ubicación',
            videoCallLink: 'Enlace de Videollamada',
            hourlyRate: 'Tarifa por Hora',
            individualDuration: 'Duración Individual',
            responsiblePerson: 'Persona Responsable',
            contactPhone: 'Teléfono de Contacto',
            allergiesConditions: 'Alergias / Condiciones',
            additionalNotes: 'Notas Adicionales',
            createdAt: 'Fecha de Creación',
            updatedAt: 'Última Actualización',
            assignedTutor: 'Tutor Asignado'
          },

          // Tipos de clase
          classTypes: {
            prueba: 'Prueba',
            regular: 'Regular',
            recurrente: 'Recurrente',
            intensiva: 'Intensiva'
          },

          // Modalidades
          modalities: {
            presencial: 'Presencial',
            virtual: 'Virtual',
            hibrida: 'Híbrida'
          },

          // Frecuencias
          frequencies: {
            unica: 'Única',
            semanal: 'Semanal',
            diario: 'Diario',
            otro: 'Otro'
          },
          
          // Otros textos
          loading: 'Cargando convocatorias...',
          noResults: 'No se encontraron convocatorias',
          noResultsDescription: 'Intenta ajustar los filtros o crear una nueva convocatoria',
          minutes: 'minutos',
          students: 'estudiantes',
          subtitle: 'Gestiona las convocatorias de trabajo para tutores'
        },

        // Sistema de Perfiles
        profile: {
          title: 'Perfil',
          viewProfile: 'Ver perfil como',
          activeRole: 'Rol activo',
          currentRole: 'Rol actual',
          syncWithActiveRole: 'Sincronizar con rol activo',
          noSpecificProfile: 'No tienes un perfil específico para mostrar',
          
          // Información básica
          basicInfo: 'Información Básica',
          fullName: 'Nombre completo',
          phone: 'Teléfono',
          country: 'País',
          birthDate: 'Fecha de nacimiento',
          birthLanguage: 'Idioma nativo',
          photoUrl: 'URL de foto',
          
          // Información profesional (tutores)
          professionalInfo: 'Información Profesional',
          experience: 'Experiencia',
          experienceLevel: 'Nivel de experiencia',
          hourlyRate: 'Tarifa por hora',
          hour: 'hora',
          maxHours: 'Máximo',
          maxHoursPerWeek: 'Máximo horas por semana',
          week: 'semana',
          weeklyHours: 'horas semanales',
          biography: 'Biografía',
          availability: 'Disponibilidad',
          languages: 'Idiomas',
          teachingLanguages: 'Idiomas que enseña',
          spokenLanguages: 'Otros idiomas que habla',
          noLanguages: 'No hay idiomas configurados',
          noTeachingLanguages: 'No hay idiomas de enseñanza configurados',
          noSpokenLanguages: 'No hay otros idiomas configurados',
          isNativeLanguage: 'Es mi idioma nativo',
          canTeachThisLanguage: 'Puedo enseñar este idioma',
          native: 'Nativo',
          removeLanguage: 'Eliminar idioma',
          certifications: 'Certificaciones',
          socialProfiles: 'Perfiles sociales',
          linkedinProfile: 'Perfil de LinkedIn',
          timezone: 'Zona horaria',
          
          // Información institucional
          institutionName: 'Nombre de la institución',
          contactPerson: 'Persona de contacto',
          contactEmail: 'Email de contacto',
          website: 'Sitio web',
          address: 'Dirección',
          description: 'Descripción',
          languagesOffered: 'Idiomas ofrecidos',
          statistics: 'Estadísticas',
          tutors: 'Tutores',
          students: 'Estudiantes',
          maxTutors: 'Máximo tutores',
          maxStudents: 'Máximo estudiantes',
          recentTutors: 'Tutores recientes',
          recentStudents: 'Estudiantes recientes',
          viewAllTutors: 'Ver todos los tutores',
          viewAllStudents: 'Ver todos los estudiantes',
          noTutors: 'No hay tutores registrados',
          noStudents: 'No hay estudiantes registrados',
          subscriptionPlan: 'Plan de suscripción',
          logoUrl: 'URL del logo',
          
          // Edición
          editInfo: 'Editar información',
          editTutorProfile: 'Editar perfil de tutor',
          editInstitutionProfile: 'Editar perfil de institución',
          servicesAndPlan: 'Servicios y plan',
          languagesManagement: 'Gestión de idiomas',
          addLanguage: 'Agregar idioma',
          addFirstLanguage: 'Agregar primer idioma',
          noLanguagesAdded: 'No se han agregado idiomas',
          language: 'Idioma',
          level: 'Nivel',
          certificationsManagement: 'Gestión de certificaciones',
          addCertification: 'Agregar certificación',
          certificationName: 'Nombre de la certificación',
          issuer: 'Emisor',
          availabilityManagement: 'Gestión de disponibilidad',
          addAvailability: 'Agregar disponibilidad',
          weekDay: 'Día de la semana',
          hours: 'Horas',
          hoursTooltip: 'Ingrese las horas separadas por comas (ej: 9,10,14,15)',
          currency: 'Moneda'
        },

        // Días de la semana
        weekDays: {
          monday: 'Lunes',
          tuesday: 'Martes',
          wednesday: 'Miércoles',
          thursday: 'Jueves',
          friday: 'Viernes',
          saturday: 'Sábado',
          sunday: 'Domingo'
        },

        // Niveles de experiencia
        experienceLevel: {
          beginner: 'Principiante',
          intermediate: 'Intermedio',
          advanced: 'Avanzado',
          expert: 'Experto'
        },

        // Planes de suscripción
        plans: {
          basic: 'Básico',
          premium: 'Premium',
          enterprise: 'Empresarial'
        },

        // Configuración académica institucional
        institution: {
          academic_settings: {
            title: 'Configuración Académica',
            description: 'Configure los programas educativos, tipos de clases y grupos de estudiantes de su institución',
            loading: 'Cargando configuración académica...',
            
            educational_programs: {
              title: 'Programas Educativos',
              description: 'Configure los programas que ofrece su institución',
              program: 'Programa',
              placeholder: 'Ej: Trial Class, DELE preparation',
              add: 'Agregar Programa'
            },
            
            class_types: {
              title: 'Tipos de Clases',
              description: 'Configure los tipos de clases que ofrece',
              type: 'Tipo',
              placeholder: 'Ej: Trial, Intensiva',
              add: 'Agregar Tipo'
            },
            
            student_countries: {
              title: 'Países de Estudiantes',
              description: 'Configure los países donde tienen estudiantes',
              country: 'País',
              states: 'Estados',
              select_states: 'Seleccionar Estados',
              select_all: 'Seleccionar Todos',
              deselect_all: 'Deseleccionar Todos',
              add: 'Agregar País'
            },
            
            student_groups: {
              title: 'Grupos de Estudiantes',
              description: 'Configure los grupos/niveles por edades',
              name: 'Nombre del Grupo',
              name_placeholder: 'Ej: Madrid Musketeers',
              group_description: 'Descripción (opcional)',
              description_placeholder: 'Descripción del grupo o nivel',
              active: 'Activo',
              age_range: 'Rango de Edades',
              age_range_optional: '(Opcional)',
              min_age: 'Edad Mínima',
              max_age: 'Edad Máxima',
              age_optional: 'Opcional',
              cefr_level: 'Nivel CEFR (opcional)',
              no_specific_level: 'Sin nivel específico',
              add: 'Agregar Grupo'
            }
          }
        },

        // Validaciones
        validation: {
          required: 'Este campo es obligatorio',
          min: 'Valor mínimo no alcanzado'
        }
      },
      
      en: {
        // Layout and navigation
        layout: {
          menu: 'Menu',
          appName: 'My Tutors',
          title: 'Log in with your provided credentials!',
          changeLanguage: 'Change language',
          setTimezone: 'Set timezone',
          logout: 'Logout',
          noMenuItems: 'No menu items available',
          lost: 'I don\'t know how i got here, but I\'m lost',
        },

        // Navigation
        navigation: {
          dashboard: 'Dashboard',
          home: 'Home',
          profile: 'Profile',
          student: 'Student',
          myClasses: 'My Classes',
          findTutors: 'Find Tutors',
          tutor: 'Tutor',
          myStudents: 'My Students',
          availability: 'Availability',
          institution: 'Institution',
          manageTutors: 'My tutors',
          manageStudents: 'My students',
          work: 'Work',
          jobPostings: 'Job Postings',
          admin: 'Administration',
          userManagement: 'User Management',
          roleManagement: 'Role Management',
          systemSettings: 'System Settings'
        },

        // General options translations
        languageOptions: {
          english: 'English',
          spanish: 'Spanish',
          french: 'French',
          portuguese: 'Portuguese',
          italian: 'Italian',
          german: 'German'
        },

        experienceLevels: {
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          advanced: 'Advanced',
          expert: 'Expert'
        },

        availabilityOptions: {
          morning: 'Morning',
          afternoon: 'Afternoon',
          evening: 'Evening',
          night: 'Night',
          weekends: 'Weekends',
          flexible: 'Flexible'
        },

        dialectalVariants: {
          argentino: 'Argentinian',
          boliviano: 'Bolivian',
          chileno: 'Chilean',
          colombiano: 'Colombian',
          ecuatoriano: 'Ecuadorian',
          español: 'Spanish (Spain)',
          mexicano: 'Mexican',
          peruano: 'Peruvian',
          uruguayo: 'Uruguayan',
          venezolano: 'Venezuelan'
        },
        
        // Authentication
        auth: {
          login: {
            title: 'Sign In',
            email: 'Email',
            password: 'Password',
            emailPlaceholder: 'your@email.com',
            passwordPlaceholder: 'Your password',
            loginButton: 'Sign in',
            loggingIn: 'Signing in...',
            forgotPassword: 'Forgot your password?',
            noAccount: "Don't have an account? Register as:",
            student: 'Student',
            tutor: 'Tutor',
            institution: 'Institution',
            continueWithGoogle: 'Continue with Google',
            or: 'or',
            loginSuccess: 'Login successful',
            loginError: 'Login error',
            userNotFound: 'No account found with this email',
            wrongPassword: 'Incorrect password',
            invalidEmail: 'Invalid email',
            userDisabled: 'This account has been disabled',
            tooManyRequests: 'Too many failed attempts. Try again later'
          },
          forgotPassword: {
            title: 'Reset Password',
            description: 'Enter your email address and we will send you a link to reset your password.',
            email: 'Email',
            emailPlaceholder: 'your@email.com',
            sendLink: 'Send reset link',
            sending: 'Sending...',
            backToLogin: 'Back to sign in',
            emailSent: 'Email sent!',
            emailSentMessage: 'Recovery email sent successfully',
            checkInbox: 'Check your inbox, since this is a beta test, it is probably in spam. Click the link to reset your password.',
            needHelp: 'Need additional help?',
            whatsappSupport: 'WhatsApp Support',
            emailSupport: 'Email Support',
            resendEmail: 'Resend email',
            emailError: 'Error sending recovery email',
            unexpectedError: 'Unexpected error. Please try again.'
          },
          passwordSetup: {
            title: 'Set Up Password',
            message: 'This is your first time signing in with {email}. Please create a secure password for your account.',
            newPassword: 'New password',
            confirmPassword: 'Confirm password',
            passwordPlaceholder: 'Minimum 6 characters',
            confirmPasswordPlaceholder: 'Repeat your password',
            confirm: 'Confirm',
            setting: 'Setting up...',
            success: 'Account activated successfully. Welcome!',
            error: 'Error activating account. Please contact administrator.',
            cancelled: 'Password setup cancelled.'
          }
        },
        
        // Registration
        register: {
          student: {
            title: 'Student Registration',
            subtitle: 'Join and start learning languages',
            basicInfo: 'Basic information',
            fullName: 'Full name',
            fullNamePlaceholder: 'Enter your full name',
            email: 'Email',
            emailPlaceholder: 'your-email@example.com',
            security: 'Security settings',
            password: 'Password',
            passwordPlaceholder: 'Minimum 6 characters',
            confirmPassword: 'Confirm password',
            confirmPasswordPlaceholder: 'Repeat your password',
            confirmation: 'Confirmation',
            haveAccount: 'Already have an account? Sign in',
            registerAs: 'Want to register as:',
            tutor: 'Tutor',
            institution: 'Institution',
            next: 'Next',
            back: 'Back',
            complete: 'Complete registration',
            reset: 'Reset',
            registering: 'Registering...',
            registerSuccess: 'Registration successful! Complete your profile.',
            registerError: 'Registration error. Please try again.',
            emailExists: 'This email is already registered.',
            weakPassword: 'Password must be at least 6 characters.',
            goals: 'Goals',
            goalsDescription: 'Define your learning goals.',
            selectGoals: 'Select your goals',
            selectMultipleGoals: 'You can select multiple goals',
            selectedGoals: 'Selected goals',
          },
          tutor: {
            title: 'Tutor Registration',
            subtitle: 'Share your knowledge and teach languages',
            basicInfo: 'Basic information',
            fullName: 'Full name',
            fullNamePlaceholder: 'Enter your full name',
            email: 'Email',
            emailPlaceholder: 'your-email@example.com',
            professionalInfo: 'Professional information',
            languages: 'Languages you teach',
            languagesPlaceholder: 'Select languages',
            experienceLevel: 'Experience level',
            experiencePlaceholder: 'Select your level',
            bio: 'Professional biography',
            bioPlaceholder: 'Describe your experience and teaching methodology (minimum 50 characters)',
            hourlyRate: 'Hourly rate (USD)',
            hourlyRatePlaceholder: 'Ex: 15',
            security: 'Security settings',
            password: 'Password',
            passwordPlaceholder: 'Minimum 6 characters',
            confirmPassword: 'Confirm password',
            confirmPasswordPlaceholder: 'Repeat your password',
            confirmation: 'Confirmation',
            reviewInfo: 'Review your information',
            reviewDescription: 'Please verify that all data is correct before creating your account.',
            basicInfoSummary: 'Basic Information',
            professionalInfoSummary: 'Professional Information',
            haveAccount: 'Already have an account? Sign in',
            registerAs: 'Want to register as:',
            student: 'Student',
            institution: 'Institution',
            next: 'Next',
            back: 'Back',
            complete: 'Complete registration',
            reset: 'Reset',
            registering: 'Registering...',
            registerSuccess: 'Registration successful! Complete your profile.',
            registerError: 'Registration error. Please try again.'
          },
          institution: {
            title: 'Institution Registration',
            subtitle: 'Offer language courses at scale',
            basicInfo: 'Basic information',
            institutionDescription: 'The institution name will be displayed to students and tutors, it can be your name.',
            institutionName: 'Institution name',
            institutionNamePlaceholder: 'University, Academy, Language Center...',
            contactPerson: 'Contact person',
            contactPersonPlaceholder: 'Responsible person name',
            email: 'Email',
            emailPlaceholder: 'contact@institution.com',
            contactInfo: 'Contact information',
            phone: 'Phone',
            phonePlaceholder: '+1234567890',
            country: 'Country',
            countryPlaceholder: 'Select your country',
            educationalInfo: 'Educational information',
            languagesOffered: 'Languages offered',
            languagesPlaceholder: 'Select languages',
            description: 'Institution description',
            descriptionPlaceholder: 'Describe your institution, methodology and services (minimum 100 characters)',
            security: 'Security settings',
            password: 'Password',
            passwordPlaceholder: 'Minimum 6 characters',
            confirmPassword: 'Confirm password',
            confirmPasswordPlaceholder: 'Repeat your password',
            confirmation: 'Confirmation',
            haveAccount: 'Already have an account? Sign in',
            registerAs: 'Want to register as:',
            student: 'Student',
            tutor: 'Tutor',
            next: 'Next',
            back: 'Back',
            complete: 'Complete registration',
            reset: 'Reset',
            registering: 'Registering...',
            registerSuccess: 'Registration successful! Complete your profile.',
            registerError: 'Registration error. Please try again.'
          },
          google: {
            registerWith: 'Register with Google',
            connecting: 'Connecting...',
            connectedWith: 'Connected with Google!',
            dataLoaded: 'Data loaded from Google! Complete registration.',
            connectionError: 'Error connecting with Google',
            registerError: 'Error registering with Google'
          }
        },

        // Sistema de Perfiles
        profile: {
          title: 'Profile',
          viewProfile: 'View profile as',
          activeRole: 'Active role',
          currentRole: 'Current role',
          syncWithActiveRole: 'Sync with active role',
          noSpecificProfile: 'You don\'t have a specific profile to show',
          
          // Información básica
          basicInfo: 'Basic Information',
          fullName: 'Full name',
          phone: 'Phone',
          country: 'Country',
          birthDate: 'Birth date',
          birthLanguage: 'Native language',
          photoUrl: 'Photo URL',
          
          // Información profesional (tutores)
          professionalInfo: 'Professional Information',
          experience: 'Experience',
          experienceLevel: 'Experience level',
          hourlyRate: 'Hourly rate',
          hour: 'hour',
          maxHours: 'Max',
          maxHoursPerWeek: 'Max hours per week',
          week: 'week',
          weeklyHours: 'weekly hours',
          biography: 'Biography',
          availability: 'Availability',
          languages: 'Languages',
          teachingLanguages: 'Teaching Languages',
          spokenLanguages: 'Other Spoken Languages',
          noLanguages: 'No languages configured',
          noTeachingLanguages: 'No teaching languages configured',
          noSpokenLanguages: 'No other languages configured',
          isNativeLanguage: 'Is my native language',
          canTeachThisLanguage: 'I can teach this language',
          native: 'Native',
          removeLanguage: 'Remove language',
          certifications: 'Certifications',
          socialProfiles: 'Social profiles',
          linkedinProfile: 'LinkedIn profile',
          timezone: 'Timezone',
          
          // Información institucional
          institutionName: 'Institution name',
          contactPerson: 'Contact person',
          contactEmail: 'Contact email',
          website: 'Website',
          address: 'Address',
          description: 'Description',
          languagesOffered: 'Languages offered',
          statistics: 'Statistics',
          tutors: 'Tutors',
          students: 'Students',
          maxTutors: 'Max tutors',
          maxStudents: 'Max students',
          recentTutors: 'Recent tutors',
          recentStudents: 'Recent students',
          viewAllTutors: 'View all tutors',
          viewAllStudents: 'View all students',
          noTutors: 'No tutors registered',
          noStudents: 'No students registered',
          subscriptionPlan: 'Subscription plan',
          logoUrl: 'Logo URL',
          
          // Edición
          editInfo: 'Edit information',
          editTutorProfile: 'Edit tutor profile',
          editInstitutionProfile: 'Edit institution profile',
          servicesAndPlan: 'Services and plan',
          languagesManagement: 'Languages management',
          addLanguage: 'Add language',
          addFirstLanguage: 'Add first language',
          noLanguagesAdded: 'No languages added',
          language: 'Language',
          level: 'Level',
          certificationsManagement: 'Certifications management',
          addCertification: 'Add certification',
          certificationName: 'Certification name',
          issuer: 'Issuer',
          availabilityManagement: 'Availability management',
          addAvailability: 'Add availability',
          weekDay: 'Week day',
          hours: 'Hours',
          hoursTooltip: 'Enter hours separated by commas (e.g: 9,10,14,15)',
          currency: 'Currency'
        },

        // Días de la semana
        weekDays: {
          monday: 'Monday',
          tuesday: 'Tuesday',
          wednesday: 'Wednesday',
          thursday: 'Thursday',
          friday: 'Friday',
          saturday: 'Saturday',
          sunday: 'Sunday'
        },

        // Niveles de experiencia
        experienceLevel: {
          beginner: 'Beginner',
          intermediate: 'Intermediate',
          advanced: 'Advanced',
          expert: 'Expert'
        },

        // Planes de suscripción
        plans: {
          basic: 'Basic',
          premium: 'Premium',
          enterprise: 'Enterprise'
        },

        // Academic institution settings
        institution: {
          academic_settings: {
            title: 'Academic Settings',
            description: 'Configure educational programs, class types, and student groups for your institution',
            loading: 'Loading academic settings...',
            
            educational_programs: {
              title: 'Educational Programs',
              description: 'Configure the programs offered by your institution',
              program: 'Program',
              placeholder: 'E.g: Trial Class, DELE preparation',
              add: 'Add Program'
            },
            
            class_types: {
              title: 'Class Types',
              description: 'Configure the types of classes you offer',
              type: 'Type',
              placeholder: 'E.g: Trial, Intensive',
              add: 'Add Type'
            },
            
            student_countries: {
              title: 'Student Countries',
              description: 'Configure the countries where you have students',
              country: 'Country',
              states: 'States',
              select_states: 'Select States',
              select_all: 'Select All',
              deselect_all: 'Deselect All',
              add: 'Add Country'
            },
            
            student_groups: {
              title: 'Student Groups',
              description: 'Configure age-based groups/levels',
              name: 'Group Name',
              name_placeholder: 'E.g: Madrid Musketeers',
              group_description: 'Description (optional)',
              description_placeholder: 'Group or level description',
              active: 'Active',
              age_range: 'Age Range',
              age_range_optional: '(Optional)',
              min_age: 'Minimum Age',
              max_age: 'Maximum Age',
              age_optional: 'Optional',
              cefr_level: 'CEFR Level (optional)',
              no_specific_level: 'No specific level',
              add: 'Add Group'
            }
          }
        },

        // Validaciones
        validation: {
          required: 'This field is required',
          min: 'Minimum value not reached'
        },
        
        // Languages
        languages: {
          spanish: 'Spanish',
          english: 'English',
          french: 'French',
          german: 'German',
          italian: 'Italian',
          portuguese: 'Portuguese',
          mandarin: 'Mandarin',
          japanese: 'Japanese',
          korean: 'Korean',
          arabic: 'Arabic',
          russian: 'Russian',
          dutch: 'Dutch'
        },
        
        // Experience levels
        experience: {
          beginner: 'Beginner (0-1 years)',
          intermediate: 'Intermediate (2-4 years)',
          advanced: 'Advanced (5-9 years)',
          expert: 'Expert (10+ years)'
        },

        // Dashboard and pending configurations
        dashboard: {
          pendingConfig: {
            title: 'Pending Configurations',
            subtitle: 'Complete these tasks to improve your experience',
            progress: 'Progress',
            pending: 'Pending',
            completed: 'Completed',
            noConfigurations: 'No pending configurations',
            priority: {
              high: 'High',
              medium: 'Medium',
              low: 'Low'
            },
            completeProfile: {
              title: 'Complete profile',
              description: 'Complete your personal information for a better experience'
            },
            setLearningGoals: {
              title: 'Set learning goals',
              description: 'Define your learning goals and objectives'
            },
            findTutors: {
              title: 'Find tutors',
              description: 'Explore and find tutors that suit your needs'
            },
            scheduleFirstClass: {
              title: 'Schedule first class',
              description: 'Schedule your first class with a tutor'
            },
            setAvailability: {
              title: 'Set availability',
              description: 'Set your availability schedule for classes'
            },
            setHourlyRate: {
              title: 'Set hourly rate',
              description: 'Define your price per teaching hour'
            },
            viewJobPostings: {
              title: 'View job postings',
              description: 'Review available class job postings'
            },
            uploadCertifications: {
              title: 'Upload certifications',
              description: 'Add your certifications and academic degrees'
            },
            completeInstitutionProfile: {
              title: 'Complete institutional profile',
              description: 'Complete your institution information'
            },
            addTutors: {
              title: 'Add tutors',
              description: 'Invite and manage tutors for your institution'
            },
            addStudents: {
              title: 'Add students',
              description: 'Register students in your institution'
            },
            createJobPosting: {
              title: 'Create job posting',
              description: 'Create job postings for classes and courses'
            },
            configureLanguages: {
              title: 'Configure languages',
              description: 'Set the languages offered by your institution'
            },
            systemOverview: {
              title: 'Review system status',
              description: 'Review metrics and general system status'
            },
            userManagement: {
              title: 'User management',
              description: 'Manage users and system permissions'
            },
            systemSettings: {
              title: 'System settings',
              description: 'Adjust global system settings'
            }
          }
        },
        
        // Common errors
        errors: {
          required: 'This field is required',
          email: 'Enter a valid email',
          minlength: 'Minimum {min} characters',
          passwordMismatch: 'Passwords do not match'
        },
        
        // Common buttons
        common: {
          save: 'Save',
          cancel: 'Cancel',
          delete: 'Delete',
          edit: 'Edit',
          close: 'Close',
          confirm: 'Confirm',
          loading: 'Loading...',
          switchRole: 'Switch role',
          currentRole: 'Current role',
          to: 'to',
          saving: 'Saving...',
          save_configuration: 'Save Configuration'
        },

        // Roles
        roles: {
          student: 'Student',
          tutor: 'Tutor',
          institution: 'Institution',
          admin: 'Administrator'
        },

        // Job Postings System
        jobPostings: {
          title: 'Job Postings',
          subtitle: 'Manage work postings for tutors',
          createNew: 'New Posting',
          viewAll: 'View All',
          myPostings: 'My Postings',
          availableJobs: 'Available Jobs',
          assignedJobs: 'Assigned Jobs',
          
          // Status
          status: {
            draft: 'Draft',
            published: 'Published',
            assigned: 'Assigned',
            completed: 'Completed',
            cancelled: 'Cancelled'
          },

          // Class Types
          classType: {
            label: 'Class type',
            prueba: 'Trial',
            regular: 'Regular',
            recurrente: 'Recurring',
            intensiva: 'Intensive'
          },

          // Modalities
          modality: {
            label: 'Modality',
            presencial: 'In-person',
            virtual: 'Virtual',
            hibrida: 'Hybrid'
          },

          // Frequencies
          frequency: {
            label: 'Frequency',
            unica: 'One-time',
            semanal: 'Weekly',
            diario: 'Daily',
            otro: 'Other'
          },

          // Creation form
          form: {
            createTitle: 'Create New Job Posting',
            editTitle: 'Edit Job Posting',
            subtitle: 'Complete the job posting details',
            
            loading: {
              create: 'Creating job posting...',
              edit: 'Loading data for editing...'
            },
            
            steps: {
              basicInfo: 'Basic Information',
              basicInfoDescription: 'General job posting data',
              classDetails: 'Class Details',
              classDetailsDescription: 'Date, time and duration specifications',
              tutorRequirements: 'Tutor Requirements',
              tutorRequirementsDescription: 'Specify tutor requirements and preferences',
              students: 'Students',
              studentsDescription: 'Participating students information',
              review: 'Review',
              reviewDescription: 'Review all data before creating the job posting'
            },
            
            fields: {
              title: 'Job posting title',
              program: 'Program',
              classType: 'Class type',
              modality: 'Modality',
              additionalComment: 'Additional comment',
              classDate: 'Class date',
              startTime: 'Start time',
              duration: 'Duration (minutes)',
              frequency: 'Frequency',
              frequencyOther: 'Specify frequency',
              location: 'Location',
              videoCallLink: 'Video call link',
              hourlyRate: 'Hourly rate',
              currency: 'Currency',
              isDividedByStudents: 'Divide time by students',
              // New tutor requirement fields
              requiredLanguages: 'Required languages',
              targetLanguage: 'Target language',
              requiredExperienceLevel: 'Required experience level',
              maxHourlyRate: 'Maximum hourly rate'
            },
            
            placeholders: {
              title: 'E.g: Trial class Sunday July 20 – 2 students',
              additionalComment: 'E.g: Class divided into 2 blocks by level',
              duration: '60',
              frequencyOther: 'Every 15 days, monthly, etc.',
              location: 'E.g: 4445 Willard Ave, Ste 600 – Office 654, MD 20815',
              videoCallLink: 'https://zoom.us/j/...',
              hourlyRate: '25.00',
              maxHourlyRate: 'E.g: 30.00'
            },
            
            options: {
              program: {
                trial: 'Trial Class',
                base: 'Base Program',
                advanced: 'Advanced',
                other: 'Other'
              },
              saveAsDraft: 'Save as draft'
            },
            
            student: {
              title: 'Student {number}',
              name: 'Name',
              age: 'Age',
              levelGroup: 'Level / Group',
              levelGroupPlaceholder: 'E.g: Madrid Musketeers (7–9 years)',
              responsiblePerson: 'Responsible person',
              contactPhone: 'Contact phone',
              individualDuration: 'Individual duration (min)',
              individualDurationHint: 'Specific time for this student (optional)',
              allergiesConditions: 'Allergies / Conditions',
              additionalNotes: 'Additional notes'
            },
            
            summary: {
              title: 'Job Posting Summary',
              basicInfo: 'Basic Information',
              classDetails: 'Class Details',
              tutorRequirements: 'Tutor Requirements',
              students: 'Students',
              studentCount: 'Number of students'
            },
            
            buttons: {
              next: 'Next',
              back: 'Back',
              cancel: 'Cancel',
              create: 'Create Job Posting',
              update: 'Update Job Posting',
              addStudent: 'Add Student',
              addRegisteredStudent: 'Use Registered Student',
              createFirst: 'Create First Job Posting'
            },

            hints: {
              duration: 'Total class duration in minutes',
              hourlyRate: 'Rate to be paid to the tutor',
              isDividedByStudents: 'If checked, time will be divided among students',
              saveAsDraft: 'Drafts will not be visible to tutors',
              addStudentOptions: 'You can add students manually or search for students already registered in the system',
              maxHourlyRate: 'Maximum rate you are willing to pay to the tutor'
            },
            
            errors: {
              required: 'This field is required',
              minLength: 'Minimum {min} characters',
              minValue: 'Minimum value: {min}',
              maxValue: 'Maximum value: {max}'
            }
          },
          
          // Filters and actions in the list
          filters: {
            search: 'Search',
            searchPlaceholder: 'Search by title, program or student...',
            status: 'Status',
            type: 'Type',
            modality: 'Modality',
            allStatuses: 'All statuses',
            allTypes: 'All types',
            allModalities: 'All modalities'
          },
          
          actions: {
            create: 'Create Job Posting',
            view: 'View',
            viewDetails: 'View Details',
            edit: 'Edit',
            publish: 'Publish',
            hide: 'Hide',
            apply: 'Apply',
            assignTutor: 'Assign Tutor',
            complete: 'Complete',
            cancel: 'Cancel',
            createFirst: 'Create First Job Posting'
          },
          
          messages: {
            loading: 'Loading job postings...',
            noResults: 'No job postings found',
            noResultsDescription: 'Try adjusting filters or create a new job posting',
            created: 'Job posting created successfully',
            updated: 'Job posting updated successfully',
            deleted: 'Job posting deleted',
            applied: 'Application sent successfully',
            tutorAssigned: 'Tutor assigned successfully'
          },

          // Detail dialog
          details: {
            basicInfo: 'Basic Information',
            classDetails: 'Class Details',
            students: 'Students',
            additionalComments: 'Additional Comments',
            metadata: 'System Information'
          },

          // Specific fields for dialog
          fields: {
            program: 'Program',
            status: 'Status',
            classType: 'Class Type',
            modality: 'Modality',
            classDate: 'Class Date',
            startTime: 'Start Time',
            duration: 'Duration',
            frequency: 'Frequency',
            frequencyOther: 'Other Frequency',
            location: 'Location',
            videoCallLink: 'Video Call Link',
            hourlyRate: 'Hourly Rate',
            individualDuration: 'Individual Duration',
            responsiblePerson: 'Responsible Person',
            contactPhone: 'Contact Phone',
            allergiesConditions: 'Allergies / Conditions',
            additionalNotes: 'Additional Notes',
            createdAt: 'Created At',
            updatedAt: 'Last Updated',
            assignedTutor: 'Assigned Tutor'
          },

          // Class types
          classTypes: {
            prueba: 'Trial',
            regular: 'Regular',
            recurrente: 'Recurring',
            intensiva: 'Intensive'
          },

          // Modalities
          modalities: {
            presencial: 'In-person',
            virtual: 'Virtual',
            hibrida: 'Hybrid'
          },

          // Frequencies
          frequencies: {
            unica: 'One-time',
            semanal: 'Weekly',
            diario: 'Daily',
            otro: 'Other'
          },
          
          // Other texts
          loading: 'Loading job postings...',
          noResults: 'No job postings found',
          noResultsDescription: 'Try adjusting filters or create a new job posting',
          minutes: 'minutes',
          students: 'students'
        }
      }
    };
  }
}
