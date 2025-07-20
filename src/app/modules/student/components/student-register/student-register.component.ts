import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';
import { MatExpansionModule } from '@angular/material/expansion';

import { SessionService } from '../../../../services/session.service';

@Component({
  selector: 'app-student-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule,
    MatExpansionModule
  ],
  templateUrl: './student-register.component.html',
  styleUrls: ['./student-register.component.scss']
})
export class StudentRegisterComponent {
  private fb = inject(FormBuilder);
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Stepper forms
  basicInfoForm: FormGroup;
  securityForm: FormGroup;
  
  isLinear = true;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  isGoogleLoading = false;
  googleUserData: any = null;

  constructor() {
    this.basicInfoForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.securityForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  async registerWithGoogle() {
    this.isGoogleLoading = true;
    
    try {
      const result = await this.sessionService.registerWithGoogle('student');
      
      if (result.success && result.userData) {
        this.googleUserData = result.userData;
        
        // Pre-fill forms with Google data
        this.basicInfoForm.patchValue({
          fullName: result.userData.name,
          email: result.userData.email
        });
        
        // Disable email field since it comes from Google
        this.basicInfoForm.get('email')?.disable();
        
        this.snackBar.open('¡Datos cargados desde Google! Completa el registro.', 'Cerrar', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } else {
        this.snackBar.open(result.error || 'Error al conectar con Google', 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    } catch (error: any) {
      this.snackBar.open('Error al registrarse con Google', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isGoogleLoading = false;
    }
  }

  async resetForm() {
    // Sign out from Google if user was signed in
    if (this.googleUserData) {
      try {
        await this.sessionService.logout();
        this.googleUserData = null;
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
    
    // Reset forms
    this.basicInfoForm.reset();
    this.securityForm.reset();
    
    // Re-enable email field
    this.basicInfoForm.get('email')?.enable();
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  async onSubmit() {
    if (this.basicInfoForm.valid && this.securityForm.valid) {
      this.isLoading = true;
      
      try {
        // For Google users, we don't need to create auth account again
        if (this.googleUserData) {
          this.snackBar.open('¡Registro completado exitosamente!', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Navigate based on role
          this.router.navigate(['/student/dashboard']);
        } else {
          // Regular email/password registration
          const formValue = {
            ...this.basicInfoForm.value,
            ...this.securityForm.value
          };
          
          await this.sessionService.register({
            email: formValue.email,
            password: formValue.password,
            fullName: formValue.fullName,
            role: 'student'
          });

          this.snackBar.open('¡Registro exitoso! Completa tu perfil.', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
      } catch (error: any) {
        let errorMessage = 'Error en el registro. Intenta nuevamente.';
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = 'Este email ya está registrado.';
        } else if (error.code === 'auth/weak-password') {
          errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
        }
        
        this.snackBar.open(errorMessage, 'Cerrar', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      } finally {
        this.isLoading = false;
      }
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  navigateToTutorRegister() {
    this.router.navigate(['/register/tutor']);
  }

  navigateToInstitutionRegister(): void {
    this.router.navigate(['/register/institution']);
  }

}
