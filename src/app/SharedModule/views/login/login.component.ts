import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

// Services
import { SessionService } from '../../../services/session.service';
import { I18nService } from '../../../services/i18n.service';
import { ToolbarComponent } from '../../toolbar/toolbar.component';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule,
    ToolbarComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  public i18nService = inject(I18nService);

  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  showEmailLogin = false;

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  toggleLoginMethod(): void {
    this.showEmailLogin = !this.showEmailLogin;
    if (!this.showEmailLogin) {
      this.loginForm.reset();
    }
  }

  async onEmailLogin(): Promise<void> {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      try {
        const { email, password } = this.loginForm.value;
        await this.sessionService.loginWithEmail(email, password);
        
        this.snackBar.open(this.i18nService.translate('auth.login.loginSuccess'), this.i18nService.translate('common.close'), {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } catch (error: any) {
        console.error('Login error:', error);
        
        let errorMessage = this.i18nService.translate('auth.login.loginError');
        
        if (error.code === 'auth/user-not-found') {
          errorMessage = this.i18nService.translate('auth.login.userNotFound');
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = this.i18nService.translate('auth.login.wrongPassword');
        } else if (error.code === 'auth/invalid-email') {
          errorMessage = this.i18nService.translate('auth.login.invalidEmail');
        } else if (error.code === 'auth/user-disabled') {
          errorMessage = this.i18nService.translate('auth.login.userDisabled');
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = this.i18nService.translate('auth.login.tooManyRequests');
        }
        
        this.snackBar.open(errorMessage, this.i18nService.translate('common.close'), {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      } finally {
        this.isLoading = false;
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return this.i18nService.translate('errors.required');
    }
    if (emailControl?.hasError('email')) {
      return this.i18nService.translate('errors.email');
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return this.i18nService.translate('errors.required');
    }
    if (passwordControl?.hasError('minlength')) {
      return this.i18nService.translate('errors.minlength', { min: 6 });
    }
    return '';
  }

  login() {
    this.sessionService.login();
  }

  navigateToRegister(role: string): void {
    this.router.navigate(['/register', role]);
  }

  navigateToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
