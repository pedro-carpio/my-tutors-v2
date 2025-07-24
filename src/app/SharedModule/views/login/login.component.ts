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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { RouterModule } from '@angular/router';

// Services
import { SessionService } from '../../../services/session.service';
import { I18nService } from '../../../services/i18n.service';
import { UserService } from '../../../services/user.service';
import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { PasswordSetupDialogComponent, PasswordSetupData, PasswordSetupResult } from './password-setup-dialog.component';

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
    MatDialogModule,
    ToolbarComponent,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private sessionService = inject(SessionService);
  private router = inject(Router);
  private formBuilder = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private userService = inject(UserService);
  public i18nService = inject(I18nService);

  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;

  constructor() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
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
        
        // Check if user needs activation
        if (error.message === 'NEEDS_ACTIVATION') {
          this.handleFirstTimeUser(this.loginForm.value.email, this.loginForm.value.password);
          return;
        }
        
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

  private async handleFirstTimeUser(email: string, password: string): Promise<void> {
    try {
      // Open password setup dialog
      const dialogRef = this.dialog.open(PasswordSetupDialogComponent, {
        data: { email } as PasswordSetupData,
        disableClose: true,
        width: '450px',
        panelClass: 'password-setup-dialog'
      });

      const result = await dialogRef.afterClosed().toPromise() as PasswordSetupResult;
      
      console.log('result', result);
      if (result && result.confirmed && result.password) {
        // User confirmed and provided a new password
        const activationResult = await this.sessionService.firstTimeLogin(email, result.password);
        
        if (activationResult.success) {
          this.snackBar.open(
            this.i18nService.translate('auth.passwordSetup.success'),
            this.i18nService.translate('common.close'),
            {
              duration: 5000,
              panelClass: ['success-snackbar']
            }
          );
        } else {
          this.snackBar.open(
            activationResult.error || this.i18nService.translate('auth.passwordSetup.error'),
            this.i18nService.translate('common.close'),
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      } else {
        // User cancelled the dialog
        this.snackBar.open(
          this.i18nService.translate('auth.passwordSetup.cancelled'),
          this.i18nService.translate('common.close'),
          {
            duration: 3000,
            panelClass: ['info-snackbar']
          }
        );
      }
    } catch (error) {
      console.error('Error activating first time user:', error);
      this.snackBar.open(
        this.i18nService.translate('auth.passwordSetup.error'),
        this.i18nService.translate('common.close'),
        {
          duration: 5000,
          panelClass: ['error-snackbar']
        }
      );
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

  // Debug methods - remove in production
  async debugListAllUsers(): Promise<void> {
    console.log('=== DEBUG: Listing all users ===');
    await this.userService.debugListAllUsers();
  }

  async debugSearchUsers(email: string): Promise<void> {
    console.log(`=== DEBUG: Searching for users with email containing "${email}" ===`);
    await this.userService.debugSearchUsersByPartialEmail(email);
  }

  async debugTestEmailQuery(): Promise<void> {
    const email = this.loginForm.get('email')?.value;
    if (email) {
      console.log(`=== DEBUG: Testing query for exact email "${email}" ===`);
      
      // Test the async method
      const user = await this.userService.getUserByEmailAsync(email);
      console.log('Async method result:', user);
      
      // Test the observable method
      this.userService.getUserByEmail(email).subscribe(users => {
        console.log('Observable method result:', users);
      });
      
      // Test needs activation
      const needsActivation = await this.userService.needsActivation(email);
      console.log('Needs activation:', needsActivation);
    } else {
      console.log('Please enter an email to test');
    }
  }
}
