import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TutorService, UserService } from '../../../../../services';
import { EmailService, WelcomeEmailData } from '../../../../../services/email.service';
import { PasswordGeneratorService } from '../../../../../services/password-generator.service';
import { Tutor, User, UserRole, UserStatus } from '../../../../../types/firestore.types';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

interface StatusOption {
  value: UserStatus;
  label: string;
}

@Component({
  selector: 'app-add-tutor-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './add-tutor-dialog.component.html',
  styleUrls: ['./add-tutor-dialog.component.scss']
})
export class AddTutorDialogComponent {
  private dialogRef = inject(MatDialogRef<AddTutorDialogComponent>);
  private fb = inject(FormBuilder);
  private tutorService = inject(TutorService);
  private userService = inject(UserService);
  private emailService = inject(EmailService);
  private passwordGenerator = inject(PasswordGeneratorService);
  private snackBar = inject(MatSnackBar);

  statusOptions: StatusOption[] = [
    { value: 'active', label: 'Activo' },
    { value: 'pending', label: 'Pendiente de verificación' },
    { value: 'verified', label: 'Verificado' },
    { value: 'inactive', label: 'Inactivo' },
    { value: 'suspended', label: 'Suspendido' }
  ];

  constructor(@Inject(MAT_DIALOG_DATA) public data: { institutionId: string }) {
    // Establecer el institution_id automáticamente
    this.tutorForm.patchValue({
      institution_id: this.data.institutionId
    });

    // Configurar validación de email en tiempo real
    this.setupEmailValidation();
  }

  tutorForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email], [this.emailExistsValidator.bind(this)]],
    full_name: ['', [Validators.required, Validators.minLength(2)]],
    birth_date: ['', Validators.required],
    country: ['', Validators.required],
    photo_url: [''],
    max_hours_per_week: [20, [Validators.required, Validators.min(1), Validators.max(168)]],
    bio: ['', [Validators.required, Validators.minLength(10)]],
    birth_language: ['', Validators.required],
    experience_level: [1, [Validators.required, Validators.min(0)]],
    hourly_rate: [15, [Validators.required, Validators.min(1)]],
    institution_id: ['', Validators.required],
    status: ['verified', [Validators.required]], // Estado por defecto: verificado (institución lo crea)
    rating: [0, [Validators.min(0), Validators.max(5)]] // Calificación inicial: 0
  });

  private setupEmailValidation(): void {
    const emailControl = this.tutorForm.get('email');
    if (emailControl) {
      emailControl.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(email => {
          if (email && this.isValidEmail(email)) {
            return this.userService.getUserByEmail(email);
          }
          return of([]);
        })
      ).subscribe(users => {
        if (users.length > 0) {
          emailControl.setErrors({ emailExists: true });
        }
      });
    }
  }

  private async emailExistsValidator(control: AbstractControl): Promise<{[key: string]: any} | null> {
    if (!control.value || !this.isValidEmail(control.value)) {
      return null;
    }

    try {
      const exists = await this.userService.emailExists(control.value);
      return exists ? { emailExists: true } : null;
    } catch (error) {
      return null;
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  countries = [
    'Bolivia', 'Ecuador', 'Perú', 'España'
  ];

  languages = [
    'Español', 'Inglés', 'Francés', 'Alemán', 'Chino',
    'Japonés', 'Portugués', 'Otro(s)'
  ];

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSubmit(): Promise<void> {
    if (this.tutorForm.valid) {
      try {
        const formValue = this.tutorForm.value;
        console.log('Form Value:', formValue);
        
        // Generar contraseña temporal
        const temporaryPassword = this.passwordGenerator.generateTemporaryPassword();
        console.log('Generated temporary password:', temporaryPassword);
        
        // Crear usuario con contraseña temporal
        const userId = await this.userService.createEmptyUser(
          formValue.email, 
          ['tutor' as UserRole], 
          temporaryPassword
        );
        console.log('Created user ID:', userId);

        // Crear el perfil de tutor con el user_id generado
        const tutorData: Tutor = {
          user_id: userId,
          full_name: formValue.full_name,
          birth_date: new Date(formValue.birth_date),
          country: formValue.country,
          photo_url: formValue.photo_url,
          max_hours_per_week: formValue.max_hours_per_week,
          bio: formValue.bio,
          birth_language: formValue.birth_language,
          experience_level: formValue.experience_level,
          hourly_rate: formValue.hourly_rate,
          institution_id: formValue.institution_id,
          status: formValue.status,
          rating: formValue.rating
        };

        await this.tutorService.createTutor(tutorData);
        
        // Enviar email de bienvenida con credenciales
        try {
          const emailData: WelcomeEmailData = {
            tutorName: formValue.full_name,
            email: formValue.email,
            temporaryPassword: temporaryPassword,
            institutionName: 'My Tutors', // TODO: Obtener nombre real de la institución
            loginUrl: `${window.location.origin}/login`
          };
          
          await this.emailService.sendTutorWelcomeEmail(emailData);
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Error sending welcome email:', emailError);
          // No fallar la creación del tutor si el email falla
        }
        
        this.snackBar.open(
          `Tutor creado exitosamente. Se ha enviado un email a ${formValue.email} con las credenciales de acceso.`, 
          'Cerrar', 
          { duration: 6000 }
        );
        
        this.dialogRef.close(true);
      } catch (error) {
        console.error('Error creating tutor:', error);
        this.snackBar.open('Error al crear el tutor. Intenta de nuevo.', 'Cerrar', {
          duration: 3000
        });
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.tutorForm.controls).forEach(key => {
      const control = this.tutorForm.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.tutorForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('email')) {
      return 'El email no tiene un formato válido';
    }
    if (control?.hasError('emailExists')) {
      return 'Este email ya está registrado. El tutor ya existe.';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo ${control.getError('minlength')?.requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `Valor mínimo: ${control.getError('min')?.min}`;
    }
    if (control?.hasError('max')) {
      return `Valor máximo: ${control.getError('max')?.max}`;
    }
    return '';
  }
}
