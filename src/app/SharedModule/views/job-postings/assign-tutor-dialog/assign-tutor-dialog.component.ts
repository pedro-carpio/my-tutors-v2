import { Component, Inject, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Observable, of, firstValueFrom } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

import { TutorService } from '../../../../services/tutor.service';
import { JobPostingService } from '../../../../services/job-posting.service';
import { EmailService } from '../../../../services/email.service';
import { JobPosting, Tutor, User } from '../../../../types/firestore.types';

export interface AssignTutorDialogData {
  jobPosting: JobPosting;
}

interface TutorWithUser extends Tutor {
  userData?: User;
  displayName: string;
}

@Component({
  selector: 'app-assign-tutor-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule
  ],
  templateUrl: './assign-tutor-dialog.component.html',
  styleUrl: './assign-tutor-dialog.component.scss'
})
export class AssignTutorDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private tutorService = inject(TutorService);
  private jobPostingService = inject(JobPostingService);
  private emailService = inject(EmailService);
  private firestore = inject(Firestore);

  assignForm: FormGroup;
  isAssigning = false;
  tutors: TutorWithUser[] = [];
  filteredTutors$: Observable<TutorWithUser[]> = of([]);
  selectedTutor: TutorWithUser | null = null;

  constructor(
    public dialogRef: MatDialogRef<AssignTutorDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AssignTutorDialogData
  ) {
    this.assignForm = this.createForm();
  }

  async ngOnInit(): Promise<void> {
    console.log('🚀 Inicializando componente AssignTutorDialogComponent...');
    console.log('📋 Datos del job posting:', this.data.jobPosting);
    
    try {
      console.log('🔧 Verificando conectividad con Firestore...');
      await this.testFirestoreConnection();
      
      console.log('⏳ Cargando tutores disponibles...');
      this.loadAvailableTutors(); // No await porque ahora es una suscripción
      
      console.log('🔧 Configurando búsqueda de tutores...');
      this.setupTutorSearch();
      console.log('✅ Búsqueda configurada exitosamente');
      
    } catch (error) {
      console.error('❌ Error durante la inicialización:', error);
    }
    
    console.log('🏁 Inicialización completada');
  }

  private async testFirestoreConnection(): Promise<void> {
    try {
      console.log('🔌 Probando conexión directa a Firestore...');
      const tutorsCollection = collection(this.firestore, 'tutors');
      console.log('📁 Referencia a colección tutors creada:', tutorsCollection);
      
      const snapshot = await getDocs(tutorsCollection);
      console.log('📊 Snapshot obtenido:', {
        empty: snapshot.empty,
        size: snapshot.size,
        docs: snapshot.docs.length
      });
      
      if (snapshot.empty) {
        console.warn('⚠️ La colección "tutors" está vacía');
        console.log('🔍 Verifica:');
        console.log('   1. Que hayas creado documentos en la colección "tutors"');
        console.log('   2. Que los documentos tengan la estructura correcta');
        console.log('   3. Que las reglas de Firestore permitan lectura');
        
        // Oferta para crear datos de prueba
        console.log('💡 ¿Quieres crear datos de prueba?');
        console.log('   Ejecuta: await this.createSampleTutors()');
      } else {
        console.log('✅ Conectividad con Firestore verificada exitosamente');
        snapshot.docs.forEach((doc, index) => {
          console.log(`📄 Documento ${index + 1}:`, {
            id: doc.id,
            data: doc.data()
          });
        });
      }
    } catch (error) {
      console.error('❌ Error al probar conectividad con Firestore:', error);
      throw error;
    }
  }

  // Método temporal para crear tutores de prueba - SOLO PARA DESARROLLO
  async createSampleTutors(): Promise<void> {
    console.log('🏗️ Creando tutores de prueba...');
    
    const sampleTutors: Tutor[] = [
      {
        user_id: 'tutor-001',
        full_name: 'María García',
        birth_date: new Date('1990-05-15'),
        country: 'España',
        phone: '+34 600 123 456',
        max_hours_per_week: 20,
        bio: 'Profesora de español con 5 años de experiencia enseñando a estudiantes internacionales.',
        birth_language: 'Español',
        experience_level: 'intermediate',
        hourly_rate: 25,
        hourly_rate_currency: 'EUR',
        institution_id: 'inst-001',
        timezone: 'Europe/Madrid'
      },
      {
        user_id: 'tutor-002',
        full_name: 'John Smith',
        birth_date: new Date('1985-03-22'),
        country: 'Estados Unidos',
        phone: '+1 555 987 6543',
        max_hours_per_week: 30,
        bio: 'Native English speaker with expertise in business English and conversation practice.',
        birth_language: 'Inglés',
        experience_level: 'advanced',
        hourly_rate: 35,
        hourly_rate_currency: 'USD',
        institution_id: 'inst-001',
        timezone: 'America/New_York'
      },
      {
        user_id: 'tutor-003',
        full_name: 'Sophie Dubois',
        birth_date: new Date('1992-08-10'),
        country: 'Francia',
        phone: '+33 1 45 67 89 12',
        max_hours_per_week: 25,
        bio: 'Professeure de français langue étrangère certifiée avec expérience en préparation DELF.',
        birth_language: 'Francés',
        experience_level: 'expert',
        hourly_rate: 30,
        hourly_rate_currency: 'EUR',
        institution_id: 'inst-001',
        timezone: 'Europe/Paris'
      }
    ];

    try {
      for (const tutor of sampleTutors) {
        console.log(`👨‍🏫 Creando tutor: ${tutor.full_name}...`);
        await this.tutorService.createTutor(tutor);
        console.log(`✅ Tutor ${tutor.full_name} creado exitosamente`);
      }
      
      console.log('🎉 Todos los tutores de prueba han sido creados');
      
      // Recargar los tutores después de crearlos
      console.log('🔄 Recargando lista de tutores...');
      this.loadAvailableTutors(); // No await porque ahora es una suscripción
      
    } catch (error) {
      console.error('❌ Error creando tutores de prueba:', error);
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      tutorSearch: [''],
      sendNotificationEmail: [true],
      assignmentNotes: ['', [Validators.maxLength(500)]]
    });
  }

  private loadAvailableTutors(): void {
    console.log('🔄 Iniciando carga de tutores disponibles...');
    this.isAssigning = true; // Mostrar loading mientras se cargan tutores
    
    console.log('📞 Llamando al servicio TutorService.getAllTutors()...');
    
    // Suscribirse directamente al Observable (método más eficiente)
    this.tutorService.getAllTutors().subscribe({
      next: (tutors) => {
        console.log('✅ Tutores obtenidos de Firestore:', {
          count: tutors?.length || 0,
          data: tutors || []
        });

        // Asegurar que tutors sea un array válido
        const validTutors = tutors || [];

        if (validTutors.length === 0) {
          console.warn('⚠️ No se encontraron tutores en la base de datos');
          console.log('🔍 Verificar:');
          console.log('   - Que existan documentos en la colección "tutors"');
          console.log('   - Los permisos de lectura en Firestore');
          console.log('   - La configuración de Firebase');
          console.log('   - Los índices compuestos necesarios');
        } else {
          console.log('🎉 Se encontraron tutores. Procesando...');
          
          // Verificar inconsistencias en los datos
          validTutors.forEach((tutor, index) => {
            console.log(`🔍 Analizando tutor ${index + 1}:`, {
              id: tutor.user_id,
              full_name: tutor.full_name,
              hasCountry: !!tutor.country,
              hasCountryTypo: !!(tutor as any).counrty, // Detectar typo
              hasExperience: !!tutor.experience_level,
              hasExperienceTypo: !!(tutor as any).expirience_level, // Detectar typo
              allFields: Object.keys(tutor)
            });
          });
        }
        
        // Enriquecer con datos de usuario y crear nombre para mostrar
        this.tutors = validTutors.map((tutor, index) => {
          console.log(`👨‍🏫 Procesando tutor ${index + 1}:`, {
            user_id: tutor.user_id,
            full_name: tutor.full_name,
            institution_id: tutor.institution_id,
            hourly_rate: tutor.hourly_rate,
            experience_level: tutor.experience_level
          });

          // Normalizar datos con typos comunes
          const normalizedTutor = {
            ...tutor,
            // Corregir typo en country si existe
            country: tutor.country || (tutor as any).counrty || 'No especificado',
            // Corregir typo en experience_level si existe
            experience_level: tutor.experience_level || (tutor as any).expirience_level || 'beginner'
          };

          const enrichedTutor = {
            ...normalizedTutor,
            displayName: normalizedTutor.full_name || 'Tutor sin nombre'
          };

          console.log(`✨ Tutor enriquecido ${index + 1}:`, {
            displayName: enrichedTutor.displayName,
            user_id: enrichedTutor.user_id,
            country: enrichedTutor.country,
            experience_level: enrichedTutor.experience_level,
            normalizedFields: {
              originalCountry: tutor.country,
              typoCountry: (tutor as any).counrty,
              originalExperience: tutor.experience_level,
              typoExperience: (tutor as any).expirience_level
            }
          });

          return enrichedTutor;
        });

        console.log('📋 Lista final de tutores procesados:', {
          totalCount: this.tutors.length,
          tutorNames: this.tutors.map(t => t.displayName)
        });

        this.filteredTutors$ = of(this.tutors);
        console.log('🎯 Observable filteredTutors$ actualizado con', this.tutors.length, 'tutores');
        
        // Verificar que el Observable contenga los datos correctos
        this.filteredTutors$.subscribe(filteredTutors => {
          console.log('🔍 Suscripción a filteredTutors$:', {
            count: filteredTutors.length,
            tutors: filteredTutors.map(t => ({
              displayName: t.displayName,
              user_id: t.user_id
            }))
          });
        });

        this.isAssigning = false; // Ocultar loading
        console.log('🏁 Carga de tutores finalizada exitosamente. isAssigning =', this.isAssigning);
      },
      error: (error) => {
        console.error('❌ Error loading tutors:', error);
        
        // Manejo seguro del error
        const errorDetails: any = error;
        console.error('📊 Detalles del error:', {
          message: errorDetails?.message || 'Error desconocido',
          code: errorDetails?.code || 'N/A',
          name: errorDetails?.name || 'Error',
          toString: error?.toString() || 'Error sin descripción'
        });
        
        // Verificar problemas comunes
        console.log('🔧 Posibles causas del error:');
        console.log('   1. Problemas de conectividad con Firestore');
        console.log('   2. Reglas de seguridad muy restrictivas');
        console.log('   3. Índices compuestos faltantes para orderBy');
        console.log('   4. Configuración incorrecta de Firebase');
        console.log('   5. El usuario no tiene permisos de lectura');
        
        this.snackBar.open('Error al cargar los tutores', 'Cerrar', { duration: 3000 });
        this.isAssigning = false; // Ocultar loading en caso de error
        console.log('🏁 Carga de tutores finalizada con error. isAssigning =', this.isAssigning);
      }
    });
  }

  private setupTutorSearch(): void {
    console.log('🔍 Configurando búsqueda de tutores...');
    console.log('📋 Tutores disponibles para búsqueda:', this.tutors.length);
    
    this.filteredTutors$ = this.assignForm.get('tutorSearch')!.valueChanges.pipe(
      startWith(''),
      map(searchTerm => {
        console.log('🔎 Término de búsqueda:', searchTerm);
        const filtered = this.filterTutors(searchTerm || '');
        console.log('📊 Resultados filtrados:', filtered.length);
        return filtered;
      })
    );
  }

  private filterTutors(searchTerm: string): TutorWithUser[] {
    console.log('🔍 Filtrando tutores con término:', searchTerm);
    console.log('📋 Total de tutores a filtrar:', this.tutors.length);
    
    if (!searchTerm.trim()) {
      console.log('✨ Sin término de búsqueda, devolviendo todos los tutores:', this.tutors.length);
      return this.tutors;
    }

    const term = searchTerm.toLowerCase();
    console.log('🔤 Término normalizado:', term);
    
    const filtered = this.tutors.filter((tutor, index) => {
      const matches = 
        tutor.displayName.toLowerCase().includes(term) ||
        tutor.userData?.email?.toLowerCase().includes(term) ||
        tutor.bio?.toLowerCase().includes(term) ||
        tutor.birth_language.toLowerCase().includes(term);
      
      console.log(`👨‍🏫 Tutor ${index + 1} (${tutor.displayName}):`, {
        displayName: tutor.displayName,
        email: tutor.userData?.email,
        bio: tutor.bio,
        birth_language: tutor.birth_language,
        matches: matches
      });
      
      return matches;
    });
    
    console.log('✅ Tutores que coinciden con la búsqueda:', {
      searchTerm: term,
      matchCount: filtered.length,
      matches: filtered.map(t => t.displayName)
    });
    
    return filtered;
  }

  selectTutor(tutor: TutorWithUser): void {
    this.selectedTutor = tutor;
  }

  // Método público para debugging - llamar desde la consola del navegador
  debugCurrentState(): void {
    console.log('🔧 Estado actual del componente:', {
      tutorsArray: this.tutors,
      tutorsCount: this.tutors.length,
      selectedTutor: this.selectedTutor,
      isAssigning: this.isAssigning,
      formValue: this.assignForm.value
    });

    console.log('🔍 Verificando filteredTutors$ Observable...');
    this.filteredTutors$.subscribe(filtered => {
      console.log('📊 Tutores filtrados actuales:', {
        count: filtered.length,
        tutors: filtered
      });
    });

    console.log('🎯 Para probar, ejecuta: component.createSampleTutors()');
  }

  async assignTutor(): Promise<void> {
    if (!this.selectedTutor) {
      this.snackBar.open('Debe seleccionar un tutor', 'Cerrar', { duration: 3000 });
      return;
    }

    this.isAssigning = true;

    try {
      const formValue = this.assignForm.value;

      // Actualizar el job posting con el tutor asignado
      await this.jobPostingService.assignTutorToJobPosting(
        this.data.jobPosting.id,
        this.selectedTutor.user_id,
        this.selectedTutor.hourly_rate
      );

      // Enviar email de notificación si está habilitado
      if (formValue.sendNotificationEmail && this.selectedTutor.userData?.email) {
        await this.sendAssignmentEmail();
      }

      this.snackBar.open('Tutor asignado correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

      this.dialogRef.close(true);
    } catch (error) {
      console.error('Error al asignar tutor:', error);
      this.snackBar.open('Error al asignar el tutor', 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    } finally {
      this.isAssigning = false;
    }
  }

  private async sendAssignmentEmail(): Promise<void> {
    if (!this.selectedTutor?.userData?.email) return;

    try {
      // ✅ NUEVO: Construir datos con soporte para ambos formatos
      const emailData: any = {
        tutorName: this.selectedTutor.displayName,
        tutorEmail: this.selectedTutor.userData.email,
        institutionName: 'Tu Institución', // TODO: Obtener del contexto
        institutionEmail: 'institucion@example.com', // TODO: Obtener del contexto
        jobTitle: this.data.jobPosting.title,
        duration: this.data.jobPosting.total_duration_minutes,
        students: this.data.jobPosting.students.map(student => ({
          name: student.name,
          age: student.age,
          level: student.level_group
        })),
        modality: this.getModalityLabel(this.data.jobPosting.modality),
        location: this.data.jobPosting.location
      };

      // ✅ NUEVO: Manejar formato combinado o separado
      if (this.data.jobPosting.class_datetime) {
        emailData.classDateTime = this.formatDateTime(this.data.jobPosting.class_datetime);
        // Extraer fecha y hora por separado para retrocompatibilidad
        const dateTime = new Date(this.data.jobPosting.class_datetime);
        emailData.classDate = dateTime.toLocaleDateString();
        emailData.startTime = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
      } else {
        // Fallback a campos separados
        emailData.classDate = this.formatDate(this.data.jobPosting.class_date || new Date());
        emailData.startTime = this.data.jobPosting.start_time || '00:00';
      }

      await this.emailService.sendJobAssignmentEmailToTutor(emailData);
    } catch (error) {
      console.error('Error enviando email:', error);
      // No mostrar error al usuario, es funcionalidad secundaria
    }
  }

  formatDate(date: any): string {
    if (!date) return '';
    
    // Si es un Timestamp de Firestore
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString('es-ES');
    }
    
    if (date instanceof Date) {
      return date.toLocaleDateString('es-ES');
    }
    
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('es-ES');
    }
    
    // Si es un objeto con seconds (Timestamp serializado)
    if (date && typeof date === 'object' && date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString('es-ES');
    }
    
    return date.toString();
  }

  // ✅ NUEVO: Método para formatear fecha y hora combinadas
  formatDateTime(dateTime: any): string {
    if (!dateTime) return '';
    
    // Si es un Timestamp de Firestore
    if (dateTime && typeof dateTime.toDate === 'function') {
      return dateTime.toDate().toLocaleString('es-ES');
    }
    
    if (dateTime instanceof Date) {
      return dateTime.toLocaleString('es-ES');
    }
    
    if (typeof dateTime === 'string') {
      return new Date(dateTime).toLocaleString('es-ES');
    }
    
    // Si es un objeto con seconds (Timestamp serializado)
    if (dateTime && typeof dateTime === 'object' && dateTime.seconds) {
      return new Date(dateTime.seconds * 1000).toLocaleString('es-ES');
    }
    
    return dateTime.toString();
  }

  getModalityLabel(modality: string): string {
    const labels: { [key: string]: string } = {
      'presencial': 'Presencial',
      'virtual': 'Virtual',
      'hibrida': 'Híbrida'
    };
    return labels[modality] || modality;
  }

  getExperienceLabel(experience: any): string {
    if (typeof experience === 'string') {
      const labels: { [key: string]: string } = {
        'beginner': 'Principiante',
        'intermediate': 'Intermedio',
        'advanced': 'Avanzado',
        'expert': 'Experto'
      };
      return labels[experience] || experience;
    }
    
    if (typeof experience === 'number') {
      return `${experience} años`;
    }
    
    return 'No especificado';
  }
}
