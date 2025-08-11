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
import { Observable, of } from 'rxjs';
import { map, startWith, timeout, catchError } from 'rxjs/operators';
import { Firestore, collection, getDocs } from '@angular/fire/firestore';

import { TutorService } from '../../../../services/tutor.service';
import { JobPostingService } from '../../../../services/job-posting.service';
import { EmailService, JobAssignmentEmailData } from '../../../../services/email.service';
import { UserService } from '../../../../services/user.service';
import { TimezoneService } from '../../../../services/timezone.service';
import { ClassInstanceService } from '../../../../services/class-instance.service';
import { JobPosting, Tutor, User } from '../../../../types/firestore.types';

export interface AssignTutorDialogData {
  jobPosting: JobPosting;
}

interface TutorWithUser extends Tutor {
  userData?: User | null;
  displayName: string;
  email: string;
}

// Interfaces para tipos de Firestore
interface FirestoreTimestamp {
  toDate(): Date;
}

interface SerializedTimestamp {
  seconds: number;
  nanoseconds?: number;
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
  private userService = inject(UserService);
  private firestore = inject(Firestore);
  private timezoneService = inject(TimezoneService);
  private classInstanceService = inject(ClassInstanceService);

  assignForm: FormGroup;
  isAssigning = false;
  private emailsLoading = new Set<string>(); // Track which user emails are being loaded
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
      
      // 🔧 REMOVIDO: setupTutorSearch() - ahora se llama después de cargar tutores
      
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
    this.isAssigning = true;
    
    console.log('📞 Llamando al servicio TutorService.getAllTutors()...');
    
    this.tutorService.getAllTutors().subscribe({
      next: (tutors) => {
        console.log('✅ Tutores obtenidos de Firestore:', {
          count: tutors?.length || 0,
          data: tutors || []
        });

        if (!tutors || tutors.length === 0) {
          console.warn('⚠️ No se encontraron tutores en la base de datos');
          this.tutors = [];
          this.isAssigning = false;
          this.setupTutorSearch();
          return;
        }

        // Procesar tutores inmediatamente sin esperar datos de usuario
        const processedTutors: TutorWithUser[] = tutors.map(tutor => ({
          ...tutor,
          userData: undefined,
          displayName: tutor.full_name || 'Tutor sin nombre',
          email: 'Cargando...' // Se actualizará después
        }));

        console.log('🎉 Tutores procesados:', {
          totalCount: processedTutors.length,
          tutorNames: processedTutors.map(t => t.displayName)
        });

        this.tutors = processedTutors;
        this.setupTutorSearch();
        this.isAssigning = false;
        
        // Cargar emails en segundo plano
        this.loadTutorEmails(tutors);
        
        console.log('🏁 Carga de tutores finalizada exitosamente.');
      },
      error: (error) => {
        console.error('❌ Error loading tutors:', error);
        this.snackBar.open('Error al cargar los tutores', 'Cerrar', { duration: 3000 });
        this.isAssigning = false;
      }
    });
  }

  private loadTutorEmails(tutors: Tutor[]): void {
    console.log('📧 Cargando emails de tutores en segundo plano...');
    
    tutors.forEach((tutor, index) => {
      // Verificar si ya estamos cargando este email o si ya lo tenemos
      if (this.emailsLoading.has(tutor.user_id)) {
        console.log(`📧 Ya se está cargando email para tutor ${index + 1}: ${tutor.user_id}`);
        return;
      }

      const existingTutor = this.tutors.find(t => t.user_id === tutor.user_id);
      if (existingTutor && existingTutor.email && existingTutor.email !== 'Cargando...') {
        console.log(`📧 Email ya disponible para tutor ${index + 1}: ${existingTutor.email}`);
        return; // Skip si ya tenemos el email
      }

      // Marcar como en proceso de carga
      this.emailsLoading.add(tutor.user_id);

      this.userService.getUser(tutor.user_id).pipe(
        timeout(5000),
        catchError(error => {
          console.warn(`⚠️ Error obteniendo usuario ${tutor.user_id}:`, error);
          
          // Verificar si ya hay un email válido antes de retornar null
          const currentTutor = this.tutors.find(t => t.user_id === tutor.user_id);
          const currentEmail = currentTutor?.email;
          
          if (currentEmail && currentEmail !== 'Email no disponible' && currentEmail.includes('@')) {
            console.log(`✅ Manteniendo email existente tras error para ${tutor.user_id}: ${currentEmail}`);
            // Retornar los datos actuales para evitar sobrescribir
            return of(null);
          }
          
          return of(null);
        })
      ).subscribe({
        next: (userData) => {
          const newEmail = userData?.['email'] || 'Email no disponible';
          
          // Actualizar el tutor específico en la lista SOLO si no se ha actualizado ya
          const tutorIndex = this.tutors.findIndex(t => t.user_id === tutor.user_id);
          if (tutorIndex !== -1) {
            const currentEmail = this.tutors[tutorIndex].email;
            
            // Solo actualizar si:
            // 1. No hay email actual
            // 2. El email actual es "Email no disponible"
            // 3. El nuevo email es válido (contiene @) y el actual no lo es
            const shouldUpdate = !currentEmail || 
              currentEmail === 'Email no disponible' || 
              (newEmail.includes('@') && !currentEmail.includes('@'));
            
            if (shouldUpdate) {
              this.tutors[tutorIndex] = {
                ...this.tutors[tutorIndex],
                userData: userData && typeof userData === 'object' && 'id' in userData ? userData : undefined,
                email: newEmail
              };
              console.log(`📧 Email actualizado para tutor ${index + 1}: ${newEmail}`);
            } else {
              console.log(`� Email mantenido para tutor ${index + 1}: ${currentEmail} (no se sobrescribe con: ${newEmail})`);
            }
          }
          
          // Remover del tracking de carga
          this.emailsLoading.delete(tutor.user_id);
        },
        error: (error) => {
          console.error(`❌ Error fatal obteniendo usuario ${tutor.user_id}:`, error);
          // Remover del tracking de carga en caso de error
          this.emailsLoading.delete(tutor.user_id);
        }
      });
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
        tutor.email.toLowerCase().includes(term) ||
        tutor.bio?.toLowerCase().includes(term) ||
        tutor.birth_language.toLowerCase().includes(term);
      
      console.log(`👨‍🏫 Tutor ${index + 1} (${tutor.displayName}):`, {
        displayName: tutor.displayName,
        email: tutor.email,
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

  /**
   * ✅ NUEVO: Método para probar el envío de emails desde la consola del navegador
   */
  async testEmailSystem(): Promise<void> {
    console.log('🧪 Iniciando prueba del sistema de emails...');
    
    try {
      // Usar el email del primer tutor disponible o un email de prueba
      const testEmail = this.selectedTutor?.email || this.tutors[0]?.email || 'test@example.com';
      
      await this.emailService.testEmailSystem(testEmail);
      
      console.log('✅ Prueba del sistema de emails completada exitosamente');
      this.snackBar.open('Email de prueba enviado correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
    } catch (error) {
      console.error('❌ Error en la prueba del sistema de emails:', error);
      this.snackBar.open(`Error en prueba de email: ${error}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  /**
   * ✅ NUEVO: Método para probar específicamente el envío del email de asignación
   */
  async testAssignmentEmail(): Promise<void> {
    if (!this.selectedTutor) {
      console.warn('⚠️ No hay tutor seleccionado para la prueba');
      this.snackBar.open('Selecciona un tutor primero', 'Cerrar', { duration: 3000 });
      return;
    }

    console.log('🧪 Probando email de asignación específico...');
    
    try {
      await this.sendAssignmentEmail();
      
      console.log('✅ Prueba de email de asignación completada exitosamente');
      this.snackBar.open('Email de asignación de prueba enviado correctamente', 'Cerrar', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });
      
    } catch (error) {
      console.error('❌ Error en la prueba del email de asignación:', error);
      this.snackBar.open(`Error en prueba de asignación: ${error}`, 'Cerrar', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
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

      // ✅ NUEVO: Crear instancia de clase automáticamente
      try {
        console.log('📚 Creando instancia de clase...');
        
        // Crear datos para la instancia de clase
        const classInstanceData = {
          course_id: `course_${this.data.jobPosting.id}`, // Usar el ID del job posting como referencia
          job_posting_id: this.data.jobPosting.id,
          institution_id: this.data.jobPosting.institution_id,
          tutor_id: this.selectedTutor.user_id,
          class_datetime: this.data.jobPosting.class_datetime_utc || 
                          this.buildDateTimeFromJobPosting(),
          duration_minutes: this.data.jobPosting.total_duration_minutes,
          location: this.data.jobPosting.location || '',
          video_call_link: this.data.jobPosting.video_call_link || '',
          modality: this.data.jobPosting.modality,
          status: 'scheduled' as const,
          students: this.data.jobPosting.students,
          hourly_rate: this.selectedTutor.hourly_rate,
          currency: this.selectedTutor.hourly_rate_currency || 'USD',
          timezone: this.data.jobPosting.job_timezone || 'UTC',
          notes: formValue.assignmentNotes || ''
        };

        const classId = await this.classInstanceService.createClassInstance(classInstanceData);
        console.log('✅ Instancia de clase creada con ID:', classId);
        
        // Enviar email de notificación si está habilitado (con link de clase)
        if (formValue.sendNotificationEmail && this.selectedTutor.email) {
          try {
            console.log('📧 Enviando email de notificación al tutor...');
            await this.sendAssignmentEmail(classId);
            console.log('✅ Email de notificación enviado exitosamente');
            
            this.snackBar.open('Tutor asignado, clase creada y email enviado', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          } catch (emailError) {
            console.error('❌ Error al enviar email de notificación:', emailError);
            
            // Determinar el tipo de error para mostrar mensaje más específico
            const errorMessage = String(emailError).toLowerCase();
            let userMessage = 'Tutor asignado y clase creada, pero no se pudo enviar el email de notificación';
            
            if (errorMessage.includes('no autenticado') || errorMessage.includes('unauthenticated')) {
              userMessage += ' (problema de autenticación)';
            } else if (errorMessage.includes('permission') || errorMessage.includes('permisos')) {
              userMessage += ' (problema de permisos)';
            } else if (errorMessage.includes('firestore')) {
              userMessage += ' (problema de base de datos)';
            }
            
            this.snackBar.open(userMessage, 'Cerrar', { 
              duration: 7000, 
              panelClass: ['warning-snackbar'] 
            });
          }
        } else {
          this.snackBar.open('Tutor asignado y clase creada correctamente', 'Cerrar', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        }
        
      } catch (classError) {
        console.error('❌ Error al crear instancia de clase:', classError);
        
        // Enviar email sin link de clase como fallback
        if (formValue.sendNotificationEmail && this.selectedTutor.email) {
          try {
            console.log('📧 Enviando email de notificación al tutor (sin link de clase)...');
            await this.sendAssignmentEmail();
            console.log('✅ Email de notificación enviado exitosamente');
            
            this.snackBar.open('Tutor asignado y email enviado (clase no creada)', 'Cerrar', {
              duration: 5000,
              panelClass: ['warning-snackbar']
            });
          } catch (emailError) {
            console.error('❌ Error al enviar email de notificación:', emailError);
            this.snackBar.open('Tutor asignado, pero errores en clase y email', 'Cerrar', { 
              duration: 5000, 
              panelClass: ['error-snackbar'] 
            });
          }
        } else {
          this.snackBar.open('Tutor asignado, pero error al crear clase', 'Cerrar', {
            duration: 5000,
            panelClass: ['warning-snackbar']
          });
        }
      }

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

  private async sendAssignmentEmail(classId?: string): Promise<void> {
    if (!this.selectedTutor?.email) return;

    try {
      // ✅ NUEVO: Construir datos con soporte para ambos formatos
      const emailData: JobAssignmentEmailData = {
        tutorName: this.selectedTutor.displayName,
        tutorEmail: this.selectedTutor.email,
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
        location: this.data.jobPosting.location,
        classDate: '', // Se asignará abajo
        startTime: '', // Se asignará abajo
        classDateTime: '' // Se asignará abajo
      };

      // ✅ NUEVO: Manejar formato combinado o separado
      if (this.data.jobPosting.class_datetime_utc) {
        emailData.classDateTime = this.formatDateTime(this.data.jobPosting.class_datetime_utc);
        // Extraer fecha y hora por separado para retrocompatibilidad
        const dateTime = new Date(this.data.jobPosting.class_datetime_utc);
        emailData.classDate = dateTime.toLocaleDateString();
        emailData.startTime = `${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
      } else {
        // Fallback a campos separados
        emailData.classDate = this.formatDate(this.data.jobPosting.class_date || new Date());
        emailData.startTime = this.data.jobPosting.start_time || '00:00';
      }

      // ✅ NUEVO: Agregar link de clase si está disponible
      if (classId) {
        (emailData as JobAssignmentEmailData & { classId: string; classLink: string }).classId = classId;
        (emailData as JobAssignmentEmailData & { classId: string; classLink: string }).classLink = `${window.location.origin}/class/${classId}`;
      }

      await this.emailService.sendJobAssignmentEmailToTutor(emailData);
    } catch (error) {
      console.error('Error enviando email:', error);
      // No mostrar error al usuario, es funcionalidad secundaria
    }
  }

  formatDate(date: unknown): string {
    if (!date) return '';
    
    // Si es un Timestamp de Firestore
    if (date && typeof date === 'object' && 'toDate' in date && typeof (date as FirestoreTimestamp).toDate === 'function') {
      return (date as FirestoreTimestamp).toDate().toLocaleDateString('es-ES');
    }
    
    if (date instanceof Date) {
      return date.toLocaleDateString('es-ES');
    }
    
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString('es-ES');
    }
    
    // Si es un objeto con seconds (Timestamp serializado)
    if (date && typeof date === 'object' && 'seconds' in date && typeof (date as SerializedTimestamp).seconds === 'number') {
      return new Date((date as SerializedTimestamp).seconds * 1000).toLocaleDateString('es-ES');
    }
    
    return String(date);
  }

  // ✅ NUEVO: Método para formatear fecha y hora combinadas
  formatDateTime(dateTime: unknown): string {
    if (!dateTime) return '';
    
    // Si es un Timestamp de Firestore
    if (dateTime && typeof dateTime === 'object' && 'toDate' in dateTime && typeof (dateTime as FirestoreTimestamp).toDate === 'function') {
      return (dateTime as FirestoreTimestamp).toDate().toLocaleString('es-ES');
    }
    
    if (dateTime instanceof Date) {
      return dateTime.toLocaleString('es-ES');
    }
    
    if (typeof dateTime === 'string') {
      return new Date(dateTime).toLocaleString('es-ES');
    }
    
    // Si es un objeto con seconds (Timestamp serializado)
    if (dateTime && typeof dateTime === 'object' && 'seconds' in dateTime && typeof (dateTime as SerializedTimestamp).seconds === 'number') {
      return new Date((dateTime as SerializedTimestamp).seconds * 1000).toLocaleString('es-ES');
    }
    
    return String(dateTime);
  }

  getModalityLabel(modality: string): string {
    const labels: Record<string, string> = {
      'presencial': 'Presencial',
      'virtual': 'Virtual',
      'hibrida': 'Híbrida'
    };
    return labels[modality] || modality;
  }

  getExperienceLabel(experience: unknown): string {
    if (typeof experience === 'string') {
      const labels: Record<string, string> = {
        'beginner': 'Principiante',
        'intermediate': 'Intermedio',
        'advanced': 'Avanzado',
        'expert': 'Experto'
      };
      return labels[experience] || experience;
    }
    
    if (typeof experience === 'number') {
      return `${experience} años de experiencia`;
    }
    
    return 'No especificado';
  }

  /**
   * Devuelve string con la fecha/hora en la zona del job posting y la local del usuario
   */
  formatJobPostingDateTimes(jobPosting: JobPosting): string {
    console.log('🕐 [AssignTutor] formatJobPostingDateTimes called with jobPosting:', {
      id: jobPosting?.id,
      title: jobPosting?.title,
      class_datetime_utc: jobPosting?.class_datetime_utc,
      job_timezone: jobPosting?.job_timezone,
      location_country: jobPosting?.location_country,
      location_state: jobPosting?.location_state,
      class_date: jobPosting?.class_date,
      start_time: jobPosting?.start_time
    });

    // Verificar si tenemos job_timezone
    if (!jobPosting?.job_timezone) {
      console.log('❌ [AssignTutor] formatJobPostingDateTimes: Missing job_timezone');
      return '';
    }

    let utcDate: Date | null = null;

    // Opción 1: Si existe class_datetime_utc, usarlo
    if (jobPosting.class_datetime_utc) {
      console.log('✅ [AssignTutor] Using class_datetime_utc');
      utcDate = new Date(jobPosting.class_datetime_utc);
    } 
    // Opción 2: Fallback usando class_date y start_time
    else if (jobPosting.class_date && jobPosting.start_time) {
      console.log('🔄 [AssignTutor] Fallback: Using class_date + start_time');
      
      // Convertir class_date a string si es necesario
      let classDateStr: string;
      if (jobPosting.class_date instanceof Date) {
        classDateStr = jobPosting.class_date.toISOString().split('T')[0];
      } else if (typeof jobPosting.class_date === 'string') {
        classDateStr = jobPosting.class_date;
      } else if (jobPosting.class_date && typeof jobPosting.class_date === 'object' && 'toDate' in jobPosting.class_date) {
        // Firestore Timestamp
        classDateStr = (jobPosting.class_date as { toDate(): Date }).toDate().toISOString().split('T')[0];
      } else {
        console.log('❌ [AssignTutor] Cannot parse class_date:', jobPosting.class_date);
        return '';
      }

      // Construir datetime string y convertir usando el timezone del job
      const localDateTimeStr = `${classDateStr}T${jobPosting.start_time}:00`;
      console.log('🔧 [AssignTutor] Constructed datetime string:', localDateTimeStr);
      
      // Crear fecha asumiendo que está en el timezone del job posting
      const localDate = new Date(localDateTimeStr);
      
      // Usar TimezoneService para convertir a UTC
      const utcConversion = this.timezoneService.convertToUTC(
        localDate, 
        jobPosting.job_timezone,
        jobPosting.location_country || '',
        jobPosting.location_state || ''
      );
      
      if (utcConversion) {
        utcDate = new Date(utcConversion.utc_datetime);
        console.log('✅ [AssignTutor] Converted to UTC:', utcDate.toISOString());
      } else {
        console.log('❌ [AssignTutor] Failed to convert to UTC');
        return '';
      }
    } else {
      console.log('❌ [AssignTutor] formatJobPostingDateTimes: Missing required data', {
        hasClassDatetimeUtc: !!jobPosting?.class_datetime_utc,
        hasClassDate: !!jobPosting?.class_date,
        hasStartTime: !!jobPosting?.start_time,
        hasJobTimezone: !!jobPosting?.job_timezone
      });
      return '';
    }
    
    const jobTimezone = jobPosting.job_timezone;
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    console.log('🕐 [AssignTutor] formatJobPostingDateTimes: Processing data', {
      utcDate: utcDate.toISOString(),
      jobTimezone,
      userTimezone
    });
    
    // Obtener nombre legible de la zona horaria del job posting
    const jobTzInfo = this.timezoneService.getTimezonesForLocation(
      jobPosting.location_country || '',
      jobPosting.location_state || ''
    )?.timezone_info.find(tz => tz.timezone === jobTimezone);
    
    const jobTzName = jobTzInfo?.display_name || jobTimezone;
    
    // Obtener nombre legible de la zona horaria local
    const localTzName = userTimezone;
    
    // Convertir UTC a hora local del job posting
    const jobTime = utcDate.toLocaleString('es-ES', { timeZone: jobTimezone });
    // Convertir UTC a hora local del usuario
    const localTime = utcDate.toLocaleString('es-ES', { timeZone: userTimezone });
    
    const result = `${jobTime} ${jobTzName}<br>(${localTime} ${localTzName})`;

    console.log('✅ [AssignTutor] formatJobPostingDateTimes: Result', {
      jobTime,
      jobTzName,
      localTime,
      localTzName,
      result
    });
    
    return result;
  }

  /**
   * Construye una fecha y hora combinada a partir de los campos separados del JobPosting
   */
  private buildDateTimeFromJobPosting(): Date {
    const jobPosting = this.data.jobPosting;
    
    if (jobPosting.class_date && jobPosting.start_time) {
      let baseDate: Date;
      
      // Manejar diferentes tipos de fecha
      if (jobPosting.class_date instanceof Date) {
        baseDate = new Date(jobPosting.class_date);
      } else if (typeof jobPosting.class_date === 'object' && jobPosting.class_date && 'toDate' in jobPosting.class_date) {
        baseDate = (jobPosting.class_date as FirestoreTimestamp).toDate();
      } else {
        baseDate = new Date(jobPosting.class_date);
      }
      
      // Parsear la hora
      const [hours, minutes] = jobPosting.start_time.split(':').map(Number);
      baseDate.setHours(hours, minutes, 0, 0);
      
      return baseDate;
    }
    
    // Fallback a ahora si no hay datos
    return new Date();
  }
}
