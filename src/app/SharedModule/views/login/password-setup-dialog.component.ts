import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { I18nService } from '../../../services/i18n.service';

export interface PasswordSetupData {
  email: string;
}

export interface PasswordSetupResult {
  password: string;
  confirmed: boolean;
}

@Component({
  selector: 'app-password-setup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="password-setup-dialog">
      <h2 mat-dialog-title>{{ i18nService.translate('auth.passwordSetup.title') }}</h2>
      
      <mat-dialog-content>
        <p class="setup-message">
          {{ i18nService.translate('auth.passwordSetup.message', { email: data.email }) }}
        </p>
        
        <form [formGroup]="passwordForm" class="password-form">
          <!-- New Password field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ i18nService.translate('auth.passwordSetup.newPassword') }}</mat-label>
            <input matInput 
                   [type]="hidePassword ? 'password' : 'text'" 
                   formControlName="password"
                   [placeholder]="i18nService.translate('auth.passwordSetup.passwordPlaceholder')"
                   [class.mat-form-field-invalid]="passwordForm.get('password')?.invalid && passwordForm.get('password')?.touched">
            <button mat-icon-button 
                    matSuffix 
                    (click)="hidePassword = !hidePassword"
                    [attr.aria-label]="'Hide password'" 
                    [attr.aria-pressed]="hidePassword"
                    type="button">
              <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordForm.get('password')?.invalid && passwordForm.get('password')?.touched">
              {{ getPasswordErrorMessage() }}
            </mat-error>
          </mat-form-field>

          <!-- Confirm Password field -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ i18nService.translate('auth.passwordSetup.confirmPassword') }}</mat-label>
            <input matInput 
                   [type]="hideConfirmPassword ? 'password' : 'text'" 
                   formControlName="confirmPassword"
                   [placeholder]="i18nService.translate('auth.passwordSetup.confirmPasswordPlaceholder')"
                   [class.mat-form-field-invalid]="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched">
            <button mat-icon-button 
                    matSuffix 
                    (click)="hideConfirmPassword = !hideConfirmPassword"
                    [attr.aria-label]="'Hide password'" 
                    [attr.aria-pressed]="hideConfirmPassword"
                    type="button">
              <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
            </button>
            <mat-error *ngIf="passwordForm.get('confirmPassword')?.invalid && passwordForm.get('confirmPassword')?.touched">
              {{ getConfirmPasswordErrorMessage() }}
            </mat-error>
          </mat-form-field>
        </form>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button 
                type="button"
                (click)="onCancel()"
                [disabled]="isLoading">
          {{ i18nService.translate('common.cancel') }}
        </button>
        <button mat-raised-button 
                color="primary" 
                type="button"
                (click)="onConfirm()"
                [disabled]="passwordForm.invalid || isLoading">
          <mat-spinner *ngIf="isLoading" diameter="20" class="spinner"></mat-spinner>
          <span *ngIf="!isLoading">{{ i18nService.translate('auth.passwordSetup.confirm') }}</span>
          <span *ngIf="isLoading">{{ i18nService.translate('auth.passwordSetup.setting') }}</span>
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .password-setup-dialog {
      min-width: 400px;
      max-width: 500px;
    }
    
    .setup-message {
      margin-bottom: 20px;
      color: #666;
      line-height: 1.5;
    }
    
    .password-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .spinner {
      margin-right: 8px;
    }
    
    mat-dialog-content {
      padding: 20px 24px;
    }
    
    mat-dialog-actions {
      padding: 8px 24px 20px;
    }
  `]
})
export class PasswordSetupDialogComponent {
  private formBuilder = inject(FormBuilder);
  public i18nService = inject(I18nService);

  passwordForm: FormGroup;
  hidePassword = true;
  hideConfirmPassword = true;
  isLoading = false;

  constructor(
    private dialogRef: MatDialogRef<PasswordSetupDialogComponent, PasswordSetupResult>,
    @Inject(MAT_DIALOG_DATA) public data: PasswordSetupData
  ) {
    this.passwordForm = this.formBuilder.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): { [key: string]: boolean } | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.passwordForm.get('password');
    if (passwordControl?.hasError('required')) {
      return this.i18nService.translate('errors.required');
    }
    if (passwordControl?.hasError('minlength')) {
      return this.i18nService.translate('errors.minlength', { min: 6 });
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const confirmPasswordControl = this.passwordForm.get('confirmPassword');
    if (confirmPasswordControl?.hasError('required')) {
      return this.i18nService.translate('errors.required');
    }
    if (this.passwordForm.hasError('passwordMismatch') && confirmPasswordControl?.touched) {
      return this.i18nService.translate('errors.passwordMismatch');
    }
    return '';
  }

  onCancel(): void {
    this.dialogRef.close({ password: '', confirmed: false });
  }

  onConfirm(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;
      const password = this.passwordForm.get('password')?.value;
      
      // Simulate a small delay for better UX
      setTimeout(() => {
        this.dialogRef.close({ password, confirmed: true });
      }, 500);
    }
  }
}
