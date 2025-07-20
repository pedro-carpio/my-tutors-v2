import { inject, Injectable } from '@angular/core';
import {
  Auth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  user,
  User,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { UserRole } from '../types/firestore.types';

export interface RegistrationData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  auth: Auth = inject(Auth);
  router: Router = inject(Router);
  userService: UserService = inject(UserService);
  private provider = new GoogleAuthProvider();

  // observable that is updated when the auth state changes
  user$ = user(this.auth);
  currentUser: User | null = this.auth.currentUser;
  userSubscription: Subscription;
  
  constructor() {
    // Configure Google provider with custom parameters
    this.provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
        this.currentUser = aUser;
    });
  }

  // Google login
  login() {
    signInWithPopup(this.auth, this.provider).then(async (result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        
        if (result.user) {
          // Check if user exists in Firestore
          const users = await this.userService.getUserByEmail(result.user.email!).toPromise();
          const userData = users?.[0];
          
          if (userData) {
            // Navigate based on role
            this.navigateBasedOnRole(userData.role);
          } else {
            // New Google user - create basic profile and redirect to role selection
            const newUser = {
              uid: result.user.uid,
              email: result.user.email!,
              name: result.user.displayName || 'Usuario',
              role: 'student' as UserRole, // Default role
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await this.userService.createUser(newUser);
            this.router.navigate(['/student/dashboard']);
          }
        }
        
        return credential;
    }).catch((error) => {
        console.error('Google login error:', error);
        // Fallback to redirect if popup fails
        if (error.code === 'auth/popup-blocked' || error.message.includes('Cross-Origin-Opener-Policy')) {
          this.loginWithRedirect();
        } else {
          throw error;
        }
    });
  }

  // Alternative login method using redirect (fallback for COOP issues)
  async loginWithRedirect() {
    try {
      await signInWithRedirect(this.auth, this.provider);
    } catch (error) {
      console.error('Google redirect login error:', error);
      throw error;
    }
  }

  // Handle redirect result (call this in app initialization)
  async handleRedirectResult(): Promise<any> {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        
        if (result.user) {
          // Check if user exists in Firestore
          const users = await this.userService.getUserByEmail(result.user.email!).toPromise();
          const userData = users?.[0];
          
          if (userData) {
            // Navigate based on role
            this.navigateBasedOnRole(userData.role);
          } else {
            // New Google user - create basic profile and redirect to role selection
            const newUser = {
              uid: result.user.uid,
              email: result.user.email!,
              name: result.user.displayName || 'Usuario',
              role: 'student' as UserRole, // Default role
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            await this.userService.createUser(newUser);
            this.router.navigate(['/student/dashboard']);
          }
        }
        
        return credential;
      }
      return null;
    } catch (error) {
      console.error('Handle redirect result error:', error);
      throw error;
    }
  }

  // Google registration for specific role
  async registerWithGoogle(role: UserRole): Promise<{success: boolean, error?: string, userData?: any}> {
    try {
      const result = await signInWithPopup(this.auth, this.provider);
      
      if (result.user) {
        // Check if user already exists
        const existingUsers = await this.userService.getUserByEmail(result.user.email!).toPromise();
        
        if (existingUsers && existingUsers.length > 0) {
          // User already exists, sign them out and return error
          await signOut(this.auth);
          return { success: false, error: 'Este email ya está registrado. Por favor, inicia sesión.' };
        }

        // Create new user profile with specified role
        const userProfile = {
          uid: result.user.uid,
          email: result.user.email!,
          name: result.user.displayName || 'Usuario',
          role: role,
          isActive: role === 'student', // Students are active by default, others need approval
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.userService.createUser(userProfile);
        
        return { 
          success: true, 
          userData: {
            name: result.user.displayName || 'Usuario',
            email: result.user.email!,
            photoURL: result.user.photoURL
          }
        };
      } else {
        return { success: false, error: 'Error al conectar con Google' };
      }
    } catch (error: any) {
      console.error('Google registration error:', error);
      
      // Sign out on any error to clean up state
      try {
        await signOut(this.auth);
      } catch (signOutError) {
        console.error('Error signing out after failed registration:', signOutError);
      }
      
      if (error.code === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Registro cancelado por el usuario' };
      } else if (error.code === 'auth/popup-blocked') {
        return { success: false, error: 'Popup bloqueado. Permite ventanas emergentes para este sitio.' };
      }
      
      return { success: false, error: error.message || 'Error al registrarse con Google' };
    }
  }

  private navigateBasedOnRole(role: UserRole): void {
    switch (role) {
      case 'student':
        this.router.navigate(['/student/dashboard']);
        break;
      case 'tutor':
        this.router.navigate(['/tutor/dashboard']);
        break;
      case 'institution':
        this.router.navigate(['/institution/dashboard']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }

  // Email/Password registration
  async register(registrationData: RegistrationData): Promise<User> {
    try {
      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        registrationData.email,
        registrationData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: registrationData.fullName
      });

      // Create user document in Firestore
      await this.userService.createUser({
        email: registrationData.email,
        role: registrationData.role
      });

      // Navigate to onboarding
      this.router.navigate(['/user/onboarding'], {
        queryParams: { role: registrationData.role }
      });

      return userCredential.user;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async registerTutor(email: string, password: string, fullName: string, tutorData: any): Promise<{success: boolean, error?: string}> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, { 
          displayName: fullName 
        });

        // Create tutor profile
        const tutorProfile = {
          uid: userCredential.user.uid,
          email: email,
          name: fullName,
          role: 'tutor' as UserRole,
          isActive: false, // Tutors need approval
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.userService.createUser(tutorProfile);
        
        return { success: true };
      } else {
        return { success: false, error: 'Error al crear el usuario' };
      }
    } catch (error: any) {
      console.error('Error registering tutor:', error);
        return { success: false, error: error.message || 'Error al registrar el tutor' };
    }
  }

  // Email/Password login
  async loginWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Get user role from Firestore
      const user = this.userService.getUserByEmail(email);

      this.router.navigate(['/home']);

      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Password reset
  async resetPassword(email: string): Promise<{success: boolean, error?: string}> {
    try {
      await sendPasswordResetEmail(this.auth, email);
      return { 
        success: true 
      };
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      let errorMessage = 'Error al enviar el email de recuperación';
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No existe una cuenta con este email';
          break;
        case 'auth/invalid-email':
          errorMessage = 'El email no es válido';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Demasiados intentos. Intenta de nuevo más tarde';
          break;
        default:
          errorMessage = error.message || 'Error al enviar el email de recuperación';
      }
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  }

  logout() {
    signOut(this.auth).then(() => {
        this.router.navigate(['/', 'login'])
        console.log('signed out');
    }).catch((error) => {
        console.log('sign out error: ' + error);
    })
  }

  async registerInstitution(email: string, password: string, contactPerson: string, institutionData: any): Promise<{success: boolean, error?: string}> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, { 
          displayName: contactPerson 
        });

        // Create institution profile
        const institutionProfile = {
          uid: userCredential.user.uid,
          email: email,
          name: contactPerson,
          role: 'institution' as UserRole,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await this.userService.createUser(institutionProfile);
        
        return { success: true };
      } else {
        return { success: false, error: 'Error al crear el usuario' };
      }
    } catch (error: any) {
      console.error('Error registering institution:', error);
      return { success: false, error: error.message || 'Error al registrar la institución' };
    }
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
