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
import { TutorService, UserService, SessionService } from '../../../../../services';
import { Tutor, User, UserRole } from '../../../../../types/firestore.types';
import { serverTimestamp } from '@angular/fire/firestore';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { of } from 'rxjs';

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
  private sessionService = inject(SessionService);
  private snackBar = inject(MatSnackBar);

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
    institution_id: ['', Validators.required]
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
    'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica',
    'Cuba', 'Ecuador', 'El Salvador', 'España', 'Guatemala', 'Honduras',
    'México', 'Nicaragua', 'Panamá', 'Paraguay', 'Perú', 'Puerto Rico',
    'República Dominicana', 'Uruguay', 'Venezuela'
  ];

  languages = [
    'Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués',
    'Chino', 'Japonés', 'Árabe', 'Ruso', 'Otro'
  ];

  onCancel(): void {
    this.dialogRef.close();
  }

  async onSubmit(): Promise<void> {
    if (this.tutorForm.valid) {
      try {
        const formValue = this.tutorForm.value;
        
        // Crear usuario sin hacer sign-in automático
        const userId = await this.sessionService.createUserForAdmin(
          formValue.email,
          'tutor'
        );

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
          institution_id: formValue.institution_id
        };

        await this.tutorService.createTutor(tutorData);
        
        this.snackBar.open(
          `Tutor creado exitosamente. El usuario podrá iniciar sesión con su email y configurar su contraseña en el primer acceso.`, 
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
