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
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';

import { SessionService } from '../../../../services/session.service';
import { I18nService } from '../../../../services/i18n.service';
import { GoalService } from '../../../../services/goal.service';
import { ToolbarComponent } from '../../../../SharedModule/toolbar/toolbar.component';
import { TranslatePipe } from "../../../../pipes/translate.pipe";
import { Goal } from '../../../../types/firestore.types';

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
    MatExpansionModule,
    MatSelectModule,
    MatChipsModule,
    ToolbarComponent,
    TranslatePipe
],
  templateUrl: './student-register.component.html',
  styleUrls: ['./student-register.component.scss']
})
export class StudentRegisterComponent {
  private fb = inject(FormBuilder);
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private i18nService = inject(I18nService);
  private goalService = inject(GoalService);

  // Stepper forms
  basicInfoForm: FormGroup;
  securityForm: FormGroup;
  goalsForm: FormGroup;
  
  isLinear = true;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;
  isGoogleLoading = false;
  googleUserData: any = null;
  
  // Goals data
  availableGoals: Goal[] = [];
  selectedGoals: Goal[] = [];

  constructor() {
    this.basicInfoForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });

    this.securityForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.goalsForm = this.fb.group({
      selectedGoals: [[], [Validators.required]]
    });

    // Load available goals
    this.loadGoals();
  }

  // Getter para el idioma actual
  get currentLanguage() {
    return this.i18nService.getCurrentLanguage();
  }
  
  changeLanguage() {
    this.i18nService.toggleLanguage();
  }

  loadGoals() {
    this.goalService.getAllGoals().subscribe({
      next: (goals) => {
        this.availableGoals = goals;
      },
      error: (error) => {
        console.error('Error loading goals:', error);
        // Fallback to default goals if service fails
          // { name: 'Conversación', description: 'Mejorar habilidades de conversación', lang: this.currentLanguage },
          // { name: 'Gramática', description: 'Aprender y practicar gramática', lang: this.currentLanguage },
          // { name: 'Escritura', description: 'Desarrollar habilidades de escritura', lang: this.currentLanguage },
          // { name: 'Comprensión auditiva', description: 'Mejorar la comprensión oral', lang: this.currentLanguage },
          // { name: 'Preparación de exámenes', description: 'Prepararse para exámenes oficiales', lang: this.currentLanguage },
          // { name: 'Vocabulario', description: 'Ampliar vocabulario', lang: this.currentLanguage },
          // { name: 'Pronunciación', description: 'Mejorar la pronunciación', lang: this.currentLanguage },
          // { name: 'Negocios', description: 'Inglés para negocios y trabajo', lang: this.currentLanguage }
      }
    });
  }

  onGoalsSelectionChange(selectedGoals: Goal[]) {
    this.selectedGoals = selectedGoals;
    this.goalsForm.patchValue({ selectedGoals });
  }

  compareGoals(goal1: Goal, goal2: Goal): boolean {
    return goal1 && goal2 ? goal1.name === goal2.name : goal1 === goal2;
  }

  removeGoal(goalToRemove: Goal) {
    this.selectedGoals = this.selectedGoals.filter(goal => goal.name !== goalToRemove.name);
    this.goalsForm.patchValue({ selectedGoals: this.selectedGoals });
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
        
        this.snackBar.open(this.i18nService.translate('register.google.dataLoaded'), this.i18nService.translate('common.close'), {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } else {
        this.snackBar.open(result.error || this.i18nService.translate('register.google.connectionError'), this.i18nService.translate('common.close'), {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    } catch (error: any) {
      this.snackBar.open(this.i18nService.translate('register.google.registerError'), this.i18nService.translate('common.close'), {
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
    this.goalsForm.reset();
    this.selectedGoals = [];
    
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
    if (this.basicInfoForm.valid && this.securityForm.valid && this.goalsForm.valid) {
      this.isLoading = true;
      
      try {
        const studentData = {
          goals: this.selectedGoals
        };

        // For Google users, we don't need to create auth account again
        if (this.googleUserData) {
          // Register student with goals
          const result = await this.sessionService.registerStudent(
            this.basicInfoForm.get('email')?.value,
            'google-auth', // No password needed for Google users
            this.basicInfoForm.get('fullName')?.value,
            studentData
          );

          if (result.success) {
            this.snackBar.open(this.i18nService.translate('register.student.registerSuccess'), this.i18nService.translate('common.close'), {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Navigate based on role
            this.router.navigate(['/dashboard']);
          } else {
            throw new Error(result.error);
          }
        } else {
          // Regular email/password registration
          const formValue = {
            ...this.basicInfoForm.value,
            ...this.securityForm.value
          };
          
          const result = await this.sessionService.registerStudent(
            formValue.email,
            formValue.password,
            formValue.fullName,
            studentData
          );

          if (result.success) {
            this.snackBar.open(this.i18nService.translate('register.student.registerSuccess'), this.i18nService.translate('common.close'), {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Navigate to student dashboard
            this.router.navigate(['/dashboard']);
          } else {
            throw new Error(result.error);
          }
        }
      } catch (error: any) {
        let errorMessage = this.i18nService.translate('register.student.registerError');
        
        if (error.code === 'auth/email-already-in-use') {
          errorMessage = this.i18nService.translate('register.student.emailExists');
        } else if (error.code === 'auth/weak-password') {
          errorMessage = this.i18nService.translate('register.student.weakPassword');
        }
        
        this.snackBar.open(errorMessage, this.i18nService.translate('common.close'), {
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
