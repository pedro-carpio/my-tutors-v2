import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { SessionService } from '../../../services/session.service';
import { I18nService } from '../../../services/i18n.service';
import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';

@Component({
  selector: 'app-forgotpassword',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatButton,
    MatIcon,
    MatProgressSpinner,
    ToolbarComponent,
    TranslatePipe
  ],
  templateUrl: './forgotpassword.component.html',
  styleUrl: './forgotpassword.component.scss'
})
export class ForgotpasswordComponent {
  private fb = inject(FormBuilder);
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  public i18nService = inject(I18nService);

  resetForm: FormGroup;
  isLoading = false;
  emailSent = false;
  errorMessage = '';

  constructor() {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  // Getter para el idioma actual
  get currentLanguage() {
    return this.i18nService.getCurrentLanguage();
  }
  
  changeLanguage() {
    this.i18nService.toggleLanguage();
    console.log('Language changed to:', this.i18nService.getCurrentLanguage());
  }

  async onResetPassword() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.resetForm.get('email')?.value;

    try {
      const result = await this.sessionService.resetPassword(email);

      if (result.success) {
        this.emailSent = true;
        this.snackBar.open(this.i18nService.translate('auth.forgotPassword.emailSentMessage'), this.i18nService.translate('common.close'), {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      } else {
        this.errorMessage = result.error || this.i18nService.translate('auth.forgotPassword.emailError');
        this.snackBar.open(this.errorMessage, this.i18nService.translate('common.close'), {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    } catch (error: any) {
      this.errorMessage = this.i18nService.translate('auth.forgotPassword.unexpectedError');
      this.snackBar.open(this.errorMessage, this.i18nService.translate('common.close'), {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      console.error('Reset password error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getEmailErrorMessage(): string {
    const emailControl = this.resetForm.get('email');
    if (emailControl?.hasError('required')) {
      return this.i18nService.translate('errors.required');
    }
    if (emailControl?.hasError('email')) {
      return this.i18nService.translate('errors.email');
    }
    return '';
  }

  goBackToLogin() {
    this.router.navigate(['/login']);
  }

  resendEmail() {
    this.emailSent = false;
    this.errorMessage = '';
    this.onResetPassword();
  }
}
