import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatGridListModule } from '@angular/material/grid-list';
import { MetaService } from '../../../../../services/meta.service';
import { generatePlatformOptimizedMetaTags } from '../../../../../constants/meta.constants';

@Component({
  selector: 'app-campaign-tutor-postulate',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatExpansionModule,
    MatSnackBarModule,
    MatDividerModule,
    MatGridListModule
  ],
  templateUrl: './postulate.component.html',
  styleUrl: './postulate.component.scss'
})
export class CampaignTutorPostulateComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private metaService = inject(MetaService);

  preRegistrationForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    languages: ['', Validators.required],
    hasExperience: ['', Validators.required]
  });

  benefits = [
    {
      icon: 'schedule',
      title: 'Flexibilidad total',
      description: 'Tú eliges tus horarios y cuántas horas das por semana.'
    },
    {
      icon: 'public',
      title: 'Alumnos reales cada semana',
      description: 'Trabajamos con instituciones que ya tienen estudiantes activos.'
    },
    {
      icon: 'payments',
      title: 'Pagos seguros y transparentes',
      description: 'Usa Airtm u otras plataformas con tarifas claras.'
    }
  ];

  howItWorks = [
    {
      icon: 'person_add',
      title: 'Postúlate',
      description: 'Completa tu perfil docente'
    },
    {
      icon: 'notifications',
      title: 'Recibe solicitudes',
      description: 'Te contactamos con oportunidades'
    },
    {
      icon: 'check_circle',
      title: 'Acepta horarios',
      description: 'Solo los que se ajusten a ti'
    },
    {
      icon: 'school',
      title: 'Da clases y cobra',
      description: 'Recibe tu pago al final del ciclo'
    }
  ];

  testimonials = [
    {
      text: 'Gracias a My Tutors ahora tengo estudiantes en 3 países distintos. El equipo siempre está ahí para apoyarte.',
      author: 'Valentina R.',
      role: 'Profesora de español (Bolivia)'
    },
    {
      text: 'La clase prueba fue genial y en una semana ya tenía 5 horas semanales asignadas.',
      author: 'David M.',
      role: 'Tutor bilingüe (Bolivia)'
    }
  ];

  requirements = [
    'Ser hablante nativo de algún idioma',
    'Tener experiencia enseñando (formal o informal)',
    'Contar con buena conexión y una laptop',
    'Tener al menos 5 horas semanales disponibles',
    'Ganas de crecer profesionalmente'
  ];

  faqs = [
    {
      question: '¿Necesito estar titulado para postular?',
      answer: 'No. Si tienes experiencia demostrable enseñando, puedes postular sin título.'
    },
    {
      question: '¿Cuánto tiempo tardan en contactarme?',
      answer: 'En general entre 24–48 h después de completar el formulario completo.'
    },
    {
      question: '¿Dónde viven los estudiantes?',
      answer: 'Trabajamos con instituciones en EE.UU., Europa y Latinoamérica.'
    },
    {
      question: '¿Puedo trabajar desde mi casa?',
      answer: '¡Claro! También hay convocatorias presenciales si estás cerca.'
    }
  ];

  experienceOptions = [
    { value: 'yes', label: 'Sí, tengo experiencia' },
    { value: 'no', label: 'No, pero tengo ganas de aprender' }
  ];

  ngOnInit(): void {
    this.setMetaTags();
  }

  ngOnDestroy(): void {
    this.metaService.clearMetaTags();
  }

  private setMetaTags(): void {
    // Usar meta tags optimizadas para Facebook por defecto (funciona bien para compartir)
    const metaData = generatePlatformOptimizedMetaTags('TUTOR_POSTULATE', 'facebook');
    this.metaService.setAllMetaTags(metaData);
  }

  navigateToFullForm(): void {
    this.router.navigate(['/forms/tutor/postular']);
  }

  scrollToForm(): void {
    const element = document.getElementById('pre-registration-form');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  onPreRegistrationSubmit(): void {
    if (this.preRegistrationForm.valid) {
      const formData = this.preRegistrationForm.value;
      
      this.snackBar.open(
        '¡Gracias! Revisa tu correo para completar tu perfil docente.',
        'Cerrar',
        {
          duration: 5000,
          panelClass: ['success-snackbar']
        }
      );

      // Here you would typically send the data to your service
      console.log('Pre-registration data:', formData);
      
      // Redirect to full form after a short delay
      setTimeout(() => {
        this.navigateToFullForm();
      }, 2000);
    }
  }

  getFormFieldError(fieldName: string): string {
    const control = this.preRegistrationForm.get(fieldName);
    if (control?.hasError('required')) {
      return 'Este campo es requerido';
    }
    if (control?.hasError('email')) {
      return 'Ingresa un email válido';
    }
    if (control?.hasError('minlength')) {
      return 'Mínimo 2 caracteres';
    }
    return '';
  }
}
