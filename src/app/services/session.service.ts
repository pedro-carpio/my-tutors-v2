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
  User as FirebaseUser,
  sendPasswordResetEmail,
} from '@angular/fire/auth';
import { 
  FieldValue, 
  serverTimestamp, 
  Firestore,
  doc,
  setDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { UserService } from './user.service';
import { TutorService } from './tutor.service';
import { StudentService } from './student.service';
import { InstitutionService } from './institution.service';
import { 
  User, 
  UserRole, 
  Tutor, 
  Student, 
  Institution 
} from '../types/firestore.types';

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
  firestore: Firestore = inject(Firestore);
  router: Router = inject(Router);
  userService: UserService = inject(UserService);
  tutorService: TutorService = inject(TutorService);
  studentService: StudentService = inject(StudentService);
  institutionService: InstitutionService = inject(InstitutionService);
  private provider = new GoogleAuthProvider();

  // observable that is updated when the auth state changes
  user$ = user(this.auth);
  currentUser: FirebaseUser | null = this.auth.currentUser;
  userSubscription: Subscription;
  
  constructor() {
    // Configure Google provider with custom parameters
    this.provider.setCustomParameters({
      prompt: 'select_account'
    });
    
    this.userSubscription = this.user$.subscribe((aUser: FirebaseUser | null) => {
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
            const newUser: User = {
              id: result.user.uid,
              email: result.user.email!,
              role: 'student' as UserRole,
              created_at: serverTimestamp()
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
            const newUser: User = {
              id: result.user.uid,
              email: result.user.email!,
              role: 'student' as UserRole,
              created_at: serverTimestamp()
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
        const userProfile: User = {
          id: result.user.uid,
          email: result.user.email!,
          role: role,
          created_at: serverTimestamp()
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
  async register(registrationData: RegistrationData): Promise<FirebaseUser> {
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

        // Create user profile first
        const userProfile: User = {
          id: userCredential.user.uid,
          email: email,
          role: 'tutor' as UserRole,
          created_at: serverTimestamp()
        };

        await this.userService.createUser(userProfile);
        
        // Create tutor specific data
        const tutorProfile: Tutor = {
          user_id: userCredential.user.uid,
          full_name: fullName,
          birth_date: tutorData.birth_date || new Date(),
          country: tutorData.country || '',
          photo_url: tutorData.photo_url,
          max_hours_per_week: tutorData.max_hours_per_week || 40,
          bio: tutorData.bio || '',
          birth_language: tutorData.birth_language || '',
          experience_level: tutorData.experience_level || 0,
          hourly_rate: tutorData.hourly_rate || 0,
          institution_id: tutorData.institution_id || null
        };

        await this.tutorService.createTutor(tutorProfile);
        
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
  async loginWithEmail(email: string, password: string): Promise<FirebaseUser> {
    try {
      // First check if user needs activation before attempting login
      const needsActivation = await this.userService.needsActivation(email);
      if (needsActivation) {
        // Check if the provided password is the temporary password
        const userData = await this.userService.getUserByEmailAsync(email);
        if (userData && userData.temporary_password === password) {
          // User provided correct temporary password, needs activation
          throw new Error('NEEDS_ACTIVATION');
        } else if (userData && userData.temporary_password) {
          // User provided wrong temporary password
          throw new Error('Contraseña temporal incorrecta');
        } else {
          // User exists in Firestore but needs Firebase Auth account
          throw new Error('NEEDS_ACTIVATION');
        }
      }

      const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
      
      // Get user role from Firestore to navigate correctly
      const userData = await this.userService.getUserByEmailAsync(email);
      
      if (userData) {
        this.navigateBasedOnRole(userData.role);
      } else {
        this.router.navigate(['/home']);
      }

      return userCredential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Re-throw the NEEDS_ACTIVATION error
      if (error.message === 'NEEDS_ACTIVATION' || error.message === 'Contraseña temporal incorrecta') {
        throw error;
      }
      
      // Check if user exists in Firestore but not in Firebase Auth (needs activation)
      if (error.code === 'auth/user-not-found') {
        const needsActivation = await this.userService.needsActivation(email);
        if (needsActivation) {
          // User exists in Firestore but needs Firebase Auth account
          throw new Error('NEEDS_ACTIVATION');
        }
      }
      
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

  async registerStudent(email: string, password: string, fullName: string, studentData: any): Promise<{success: boolean, error?: string}> {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      if (userCredential.user) {
        await updateProfile(userCredential.user, { 
          displayName: fullName 
        });

        // Create user profile first
        const userProfile: User = {
          id: userCredential.user.uid,
          email: email,
          role: 'student' as UserRole,
          created_at: serverTimestamp()
        };

        await this.userService.createUser(userProfile);
        
        // Create student specific data
        const studentProfile: Student = {
          user_id: userCredential.user.uid,
          full_name: fullName,
          goals: studentData.goals || []
        };

        await this.studentService.createStudent(studentProfile);
        
        return { success: true };
      } else {
        return { success: false, error: 'Error al crear el usuario' };
      }
    } catch (error: any) {
      console.error('Error registering student:', error);
      return { success: false, error: error.message || 'Error al registrar el estudiante' };
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
        
        // Create user profile first
        const userProfile: User = {
          id: userCredential.user.uid,
          email: email,
          role: 'institution' as UserRole,
          created_at: serverTimestamp()
        };

        await this.userService.createUser(userProfile);
        
        // Create institution specific data
        const institutionProfile: Institution = {
          user_id: userCredential.user.uid,
          name: institutionData.name || contactPerson,
          country: institutionData.country || '',
          phone: institutionData.phone || '',
          description: institutionData.description || '',
          logo_url: institutionData.logo_url || ''
        };

        await this.institutionService.createInstitution(institutionProfile);
        
        return { success: true };
      } else {
        return { success: false, error: 'Error al crear el usuario' };
      }
    } catch (error: any) {
      console.error('Error registering institution:', error);
      return { success: false, error: error.message || 'Error al registrar la institución' };
    }
  }

  // Activate account for users created administratively
  async activateAccount(email: string, newPassword: string): Promise<{success: boolean, error?: string}> {
    try {
      // Get user from Firestore to verify they exist and need activation
      const users = await this.userService.getUserByEmail(email).toPromise();
      const userData = users?.[0];
      
      if (!userData) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, newPassword);
      
      if (userCredential.user) {
        // Update the user document to include the Firebase Auth ID
        await this.userService.updateUser(userData.id, {
          id: userCredential.user.uid
        });

        // Navigate based on role
        this.navigateBasedOnRole(userData.role);
        
        return { success: true };
      } else {
        return { success: false, error: 'Error al activar la cuenta' };
      }
    } catch (error: any) {
      console.error('Error activating account:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        // If the email is already in Firebase Auth, try to sign in
        try {
          const userCredential = await signInWithEmailAndPassword(this.auth, email, newPassword);
          const users = await this.userService.getUserByEmail(email).toPromise();
          const userData = users?.[0];
          
          if (userData) {
            this.navigateBasedOnRole(userData.role);
            return { success: true };
          }
        } catch (signInError) {
          return { success: false, error: 'Credenciales incorrectas' };
        }
      }
      
      return { success: false, error: error.message || 'Error al activar la cuenta' };
    }
  }

  // First time login for users created administratively
  async firstTimeLogin(email: string, newPassword: string): Promise<{success: boolean, error?: string}> {
    try {
      // Check if user exists in Firestore and needs activation
      const userData = await this.userService.getUserByEmailAsync(email);
      console.log("The user data: ", userData);
      
      if (!userData) {
        return { success: false, error: 'Usuario no encontrado' };
      }

      // Verify this user needs activation
      // if (!needsActivation) {
      //   return { success: false, error: 'Esta cuenta ya está activada' };
      // }

      // Create Firebase Auth account with the new password
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, newPassword);
      
      if (userCredential.user) {
        // Clean temporary password data before migration
        const cleanUserData = {
          ...userData,
          temporary_password: undefined,
          needs_password_change: false
        };
        
        // Migrate user document from Firestore auto-ID to Firebase Auth UID
        await this.userService.migrateUserToFirebaseAuth(userData.id, userCredential.user.uid, cleanUserData);
        
        // Update display name if available
        if (userCredential.user) {
          await updateProfile(userCredential.user, {
            displayName: email.split('@')[0] // Use email prefix as display name for now
          });
        }

        // Navigate based on role
        this.navigateBasedOnRole(userData.role);
        
        return { success: true };
      } else {
        return { success: false, error: 'Error al activar la cuenta' };
      }
    } catch (error: any) {
      console.error('Error in first time login:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'Este email ya tiene una cuenta activa' };
      }
      
      return { success: false, error: error.message || 'Error al activar la cuenta' };
    }
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
}
