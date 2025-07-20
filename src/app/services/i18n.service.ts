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
          changeLanguage: 'Cambiar idioma',
          setTimezone: 'Configurar zona horaria'
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
          changeLanguage: 'Change language',
          setTimezone: 'Set timezone'
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
