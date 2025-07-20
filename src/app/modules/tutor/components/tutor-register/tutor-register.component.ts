import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatStepperModule } from '@angular/material/stepper';

import { SessionService } from '../../../../services/session.service';

interface LanguageOption {
  value: string;
  label: string;
}

interface ExperienceLevel {
  value: string;
  label: string;
}

@Component({
  selector: 'app-tutor-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatStepperModule
  ],
  templateUrl: './tutor-register.component.html',
  styleUrls: ['./tutor-register.component.scss']
})
export class TutorRegisterComponent implements OnInit {
  // Stepper forms
  basicInfoForm!: FormGroup;
  professionalInfoForm!: FormGroup;
  securityForm!: FormGroup;
  
  isLinear = true;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  isGoogleLoading = false;
  googleUserData: any = null;

  availableLanguages: LanguageOption[] = [
    { value: 'spanish', label: 'Español' },
    { value: 'english', label: 'Inglés' },
    { value: 'french', label: 'Francés' },
    { value: 'german', label: 'Alemán' },
    { value: 'italian', label: 'Italiano' },
    { value: 'portuguese', label: 'Portugués' },
    { value: 'mandarin', label: 'Mandarín' },
    { value: 'japanese', label: 'Japonés' },
    { value: 'korean', label: 'Coreano' },
    { value: 'arabic', label: 'Árabe' },
    { value: 'russian', label: 'Ruso' },
    { value: 'dutch', label: 'Holandés' }
  ];

  experienceLevels: ExperienceLevel[] = [
    { value: 'beginner', label: 'Principiante (0-1 años)' },
    { value: 'intermediate', label: 'Intermedio (2-4 años)' },
    { value: 'advanced', label: 'Avanzado (5-9 años)' },
    { value: 'expert', label: 'Experto (10+ años)' }
  ];

  constructor(
    private fb: FormBuilder,
    private sessionService: SessionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  private initForm(): void {
    this.basicInfoForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.professionalInfoForm = this.fb.group({
      languages: [[], [Validators.required]],
      experienceLevel: ['', [Validators.required]],
      bio: ['', [Validators.required, Validators.minLength(50)]],
      hourlyRate: ['', [Validators.required, Validators.min(5), Validators.max(200)]]
    });

    this.securityForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    // Clear the error if passwords match
    if (confirmPassword.hasError('passwordMismatch')) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      const hasErrors = Object.keys(errors).length > 0;
      confirmPassword.setErrors(hasErrors ? errors : null);
    }

    return null;
  }

  async onSubmit(): Promise<void> {
    if (this.basicInfoForm.valid && this.professionalInfoForm.valid && this.securityForm.valid) {
      this.isLoading = true;
      
      try {
        // For Google users, we don't need to create auth account again
        if (this.googleUserData) {
          this.snackBar.open(
            '¡Cuenta de tutor creada exitosamente! Te contactaremos pronto para verificar tus credenciales.',
            'Cerrar',
            {
              duration: 6000,
              panelClass: ['success-snackbar']
            }
          );
          
          this.router.navigate(['/tutor/pending-verification']);
        } else {
          // Regular email/password registration
          const formValue = {
            ...this.basicInfoForm.value,
            ...this.professionalInfoForm.value,
            ...this.securityForm.value
          };
          
          const result = await this.sessionService.registerTutor(
            formValue.email,
            formValue.password,
            formValue.fullName,
            {
              languages: formValue.languages,
              experienceLevel: formValue.experienceLevel,
              bio: formValue.bio,
              hourlyRate: formValue.hourlyRate
            }
          );

          if (result.success) {
            this.snackBar.open(
              '¡Cuenta de tutor creada exitosamente! Te contactaremos pronto para verificar tus credenciales.',
              'Cerrar',
              {
                duration: 6000,
                panelClass: ['success-snackbar']
              }
            );
            
            this.router.navigate(['/tutor/pending-verification']);
          } else {
            this.snackBar.open(
              result.error || 'Error al crear la cuenta. Intenta nuevamente.',
              'Cerrar',
              {
                duration: 5000,
                panelClass: ['error-snackbar']
              }
            );
          }
        }
      } catch (error) {
        console.error('Error en registro:', error);
        this.snackBar.open(
          'Error inesperado. Por favor, intenta nuevamente.',
          'Cerrar',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      } finally {
        this.isLoading = false;
      }
    }
  }

  async registerWithGoogle() {
    this.isGoogleLoading = true;
    
    try {
      const result = await this.sessionService.registerWithGoogle('tutor');
      
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
    this.professionalInfoForm.reset();
    this.securityForm.reset();
    
    // Re-enable email field
    this.basicInfoForm.get('email')?.enable();
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  navigateToStudentRegister(): void {
    this.router.navigate(['/register/student']);
  }

  navigateToInstitutionRegister(): void {
    this.router.navigate(['/register/institution']);
  }

  // Helper methods for the confirmation step
  getLanguageLabel(value: string): string {
    const language = this.availableLanguages.find(lang => lang.value === value);
    return language ? language.label : value;
  }

  getExperienceLabel(value: string): string {
    const experience = this.experienceLevels.find(exp => exp.value === value);
    return experience ? experience.label : value;
  }
}
