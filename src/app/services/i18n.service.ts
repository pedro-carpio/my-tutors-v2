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
          noMenuItems: 'No hay elementos de menú disponibles',
          lost: 'No sé cómo llegué aquí, pero estoy perdido',
        },

        // Navegación
        navigation: {
          dashboard: 'Panel Principal',
          home: 'Inicio',
          student: 'Estudiante',
          myClasses: 'Mis Clases',
          findTutors: 'Buscar Tutores',
          tutor: 'Tutor',
          myStudents: 'Mis Estudiantes',
          availability: 'Disponibilidad',
          institution: 'Institución',
          manageTutors: 'Mis tutores',
          manageStudents: 'Mis estudiantes',
          admin: 'Administración',
          userManagement: 'Gestión de Usuarios',
          systemSettings: 'Configuración del Sistema'
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
          loading: 'Cargando...'
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
          noMenuItems: 'No menu items available',
          lost: 'I don\'t know how i got here, but I\'m lost',
        },

        // Navigation
        navigation: {
          dashboard: 'Dashboard',
          home: 'Home',
          student: 'Student',
          myClasses: 'My Classes',
          findTutors: 'Find Tutors',
          tutor: 'Tutor',
          myStudents: 'My Students',
          availability: 'Availability',
          institution: 'Institution',
          manageTutors: 'My tutors',
          manageStudents: 'My students',
          admin: 'Administration',
          userManagement: 'User Management',
          systemSettings: 'System Settings'
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
          loading: 'Loading...'
        }
      }
    };
  }
}
