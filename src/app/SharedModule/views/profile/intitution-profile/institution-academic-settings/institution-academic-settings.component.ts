import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SessionService } from '../../../../../services/session.service';
import { InstitutionService } from '../../../../../services/institution.service';
import { LocationService } from '../../../../../services/location.service';
import { I18nService } from '../../../../../services/i18n.service';
import { TimezoneService } from '../../../../../services/timezone.service';
import { TranslatePipe } from '../../../../../pipes/translate.pipe';
import {
  Institution,
  InstitutionCountry,
  InstitutionState,
  StudentLevelGroup
} from '../../../../../types/firestore.types';
import { FieldValue } from 'firebase/firestore';

// ✅ Interfaces locales para tipificar datos del formulario
interface FormStudentCountry {
  code: string;
  name: string;
  states: string[];
}

interface FormStudentLevelGroup {
  id: string;
  name: string;
  min_age: number;
  max_age: number;
  description?: string;
}

interface StateWithTimezone {
  code: string;
  name: string;
  timezone_info?: import('../../../../../services/timezone.service').LocationTimezoneInfo | null;
}

@Component({
  selector: 'app-institution-academic-settings',
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
    MatChipsModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatExpansionModule,
    MatCheckboxModule,
    TranslatePipe
  ],
  templateUrl: './institution-academic-settings.component.html',
  styleUrls: ['./institution-academic-settings.component.scss']
})
export class InstitutionAcademicSettingsComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private sessionService = inject(SessionService);
  private locationService = inject(LocationService);
  private institutionService = inject(InstitutionService);
  private snackBar = inject(MatSnackBar);
  private i18nService = inject(I18nService);
  private timezoneService = inject(TimezoneService);
  private destroy$ = new Subject<void>();

  // Estado del componente
  isLoading = false;
  isSaving = false;
  currentUser = this.sessionService.currentUser;
  institution: Institution | null = null;

  // Formulario principal
  academicForm!: FormGroup;

  // Países disponibles (por ahora solo Estados Unidos y Bolivia)
  availableCountries: InstitutionCountry[] = this.locationService.getCountries();

  ngOnInit(): void {
    console.log('🚀 InstitutionAcademicSettings: Inicializando componente');
    this.initializeForm();
    this.loadInstitutionData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.academicForm = this.fb.group({
      educational_programs: this.fb.array([]),
      class_types: this.fb.array([]),
      student_countries: this.fb.array([]),
      student_level_groups: this.fb.array([])
    });
    
    // Agregar elementos iniciales si es necesario
    this.addInitialItems();
  }
  
  private addInitialItems(): void {
    // Si no hay programas, agregar uno inicial
    if (this.educationalProgramsArray.length === 0) {
      this.addEducationalProgram();
    }
    
    // Si no hay tipos de clase, agregar uno inicial
    if (this.classTypesArray.length === 0) {
      this.addClassType();
    }
  }

  private loadInstitutionData(): void {
    const userId = this.currentUser?.uid;
    if (!userId) {
      console.error('🚨 InstitutionAcademicSettings: No hay usuario autenticado');
      return;
    }

    this.isLoading = true;
    
    this.institutionService.getInstitution(userId).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (institution) => {
        console.log('✅ InstitutionAcademicSettings: Institución cargada', institution);
        this.institution = institution || null;
        if (institution) {
          this.populateForm(institution);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ InstitutionAcademicSettings: Error cargando institución', error);
        this.showMessage('Error cargando la información de la institución', 'error');
        this.isLoading = false;
      }
    });
  }

  private populateForm(institution: Institution): void {
    // Programas educativos
    const educationalPrograms = institution.educational_programs || [];
    const educationalProgramsArray = this.fb.array(
      educationalPrograms.map(program => this.fb.control(program, [Validators.required]))
    );
    this.academicForm.setControl('educational_programs', educationalProgramsArray);

    // Tipos de clase
    const classTypes = institution.class_types || [];
    const classTypesArray = this.fb.array(
      classTypes.map(type => this.fb.control(type, [Validators.required]))
    );
    this.academicForm.setControl('class_types', classTypesArray);

    // Países de estudiantes
    const studentCountries = institution.student_countries || [];
    const studentCountriesArray = this.fb.array(
      studentCountries.map(country => this.createCountryFormGroup(country))
    );
    this.academicForm.setControl('student_countries', studentCountriesArray);

    // Grupos de estudiantes
    const studentLevelGroups = institution.student_level_groups || [];
    const studentLevelGroupsArray = this.fb.array(
      studentLevelGroups.map(group => this.createLevelGroupFormGroup(group))
    );
    this.academicForm.setControl('student_level_groups', studentLevelGroupsArray);
  }

  // Getters para FormArrays
  get educationalProgramsArray(): FormArray {
    return this.academicForm.get('educational_programs') as FormArray;
  }

  get classTypesArray(): FormArray {
    return this.academicForm.get('class_types') as FormArray;
  }

  get studentCountriesArray(): FormArray {
    return this.academicForm.get('student_countries') as FormArray;
  }

  get studentLevelGroupsArray(): FormArray {
    return this.academicForm.get('student_level_groups') as FormArray;
  }

  // Métodos para programas educativos
  addEducationalProgram(): void {
    const programControl = this.fb.control('', [Validators.required]);
    this.educationalProgramsArray.push(programControl);
  }

  removeEducationalProgram(index: number): void {
    this.educationalProgramsArray.removeAt(index);
  }

  // Métodos para tipos de clase
  addClassType(): void {
    const typeControl = this.fb.control('', [Validators.required]);
    this.classTypesArray.push(typeControl);
  }

  removeClassType(index: number): void {
    this.classTypesArray.removeAt(index);
  }

  // Métodos para países de estudiantes
  addStudentCountry(): void {
    const countryGroup = this.createCountryFormGroup();
    this.studentCountriesArray.push(countryGroup);
  }

  removeStudentCountry(index: number): void {
    this.studentCountriesArray.removeAt(index);
  }

  private createCountryFormGroup(country?: InstitutionCountry): FormGroup {
    return this.fb.group({
      code: [country?.code || '', [Validators.required]],
      name: [country?.name || '', [Validators.required]],
      states: [country?.states?.map(state => state.code) || []]
    });
  }

  onCountryChange(countryIndex: number): void {
    const countryGroup = this.studentCountriesArray.at(countryIndex);
    const selectedCountryCode = countryGroup.get('code')?.value;
    
    const selectedCountry = this.availableCountries.find(c => c.code === selectedCountryCode);
    if (selectedCountry) {
      countryGroup.get('name')?.setValue(selectedCountry.name);
      // Limpiar los estados seleccionados cuando se cambia el país
      countryGroup.get('states')?.setValue([]);
    }
  }

  // Métodos para manejo de estados (multi-select)
  getAvailableStatesForCountry(countryIndex: number): InstitutionState[] {
    const countryGroup = this.studentCountriesArray.at(countryIndex);
    const countryCode = countryGroup.get('code')?.value;
    const country = this.availableCountries.find(c => c.code === countryCode);
    return country?.states || [];
  }

  getSelectedStatesForCountry(countryIndex: number): string[] {
    const countryGroup = this.studentCountriesArray.at(countryIndex);
    return countryGroup.get('states')?.value || [];
  }

  areAllStatesSelected(countryIndex: number): boolean {
    const availableStates = this.getAvailableStatesForCountry(countryIndex);
    const selectedStates = this.getSelectedStatesForCountry(countryIndex);
    return availableStates.length > 0 && selectedStates.length === availableStates.length;
  }

  selectAllStates(countryIndex: number): void {
    const countryGroup = this.studentCountriesArray.at(countryIndex);
    const availableStates = this.getAvailableStatesForCountry(countryIndex);
    const allStateCodes = availableStates.map(state => state.code);
    countryGroup.get('states')?.setValue(allStateCodes);
  }

  deselectAllStates(countryIndex: number): void {
    const countryGroup = this.studentCountriesArray.at(countryIndex);
    countryGroup.get('states')?.setValue([]);
  }

  toggleAllStates(countryIndex: number): void {
    if (this.areAllStatesSelected(countryIndex)) {
      this.deselectAllStates(countryIndex);
    } else {
      this.selectAllStates(countryIndex);
    }
  }

  // Métodos para grupos de estudiantes
  addStudentLevelGroup(): void {
    const groupFormGroup = this.createLevelGroupFormGroup();
    this.studentLevelGroupsArray.push(groupFormGroup);
  }

  removeStudentLevelGroup(index: number): void {
    this.studentLevelGroupsArray.removeAt(index);
  }

  private createLevelGroupFormGroup(group?: StudentLevelGroup): FormGroup {
    return this.fb.group({
      id: [group?.id || this.generateGroupId(), [Validators.required]],
      name: [group?.name || '', [Validators.required]],
      min_age: [group?.age_range?.min || null, [Validators.required, Validators.min(1)]],
      max_age: [group?.age_range?.max || null, [Validators.required, Validators.min(1)]],
      description: [group?.description || '']
    });
  }

  private generateGroupId(): string {
    return 'group_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Métodos de guardado
  async onSave(): Promise<void> {
    if (!this.academicForm.valid) {
      console.warn('🚨 InstitutionAcademicSettings: Formulario inválido');
      this.markFormGroupTouched(this.academicForm);
      this.showMessage('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    const userId = this.currentUser?.uid;
    if (!userId) {
      console.error('🚨 InstitutionAcademicSettings: No hay usuario autenticado');
      this.showMessage('Error: Usuario no autenticado', 'error');
      return;
    }

    this.isSaving = true;
    
    try {
      const formData = this.academicForm.value;
      console.log('💾 InstitutionAcademicSettings: Guardando configuración académica', formData);

      // ✅ NUEVO: Procesar países con información de timezones
      const processedStudentCountries = formData.student_countries.map((country: FormStudentCountry) => {
        const selectedCountry = this.availableCountries.find(c => c.code === country.code);
        const selectedStates = selectedCountry?.states?.filter(state => 
          country.states.includes(state.code)
        ) || [];
        
        // ✅ NUEVO: Generar información de timezones para cada país/estado
        const timezoneInfo = this.timezoneService.getTimezonesForLocation(country.code);
        let stateTimezones: StateWithTimezone[] = [];
        
        // Si hay estados seleccionados y es EE.UU., obtener timezone por estado
        if (country.code === 'US' && selectedStates.length > 0) {
          stateTimezones = selectedStates.map(state => ({
            ...state,
            timezone_info: this.timezoneService.getTimezonesForLocation('US', state.code)
          }));
        }
        
        return {
          code: country.code,
          name: country.name,
          states: selectedStates,
          // ✅ NUEVO: Información de timezone agregada
          timezone_info: timezoneInfo,
          state_timezones: stateTimezones
        };
      });

      // ✅ NUEVO: Procesar student_level_groups para coincidir con la interface
      const processedStudentLevelGroups = formData.student_level_groups.map((group: FormStudentLevelGroup) => ({
        id: group.id,
        name: group.name,
        description: group.description || '',
        age_range: {
          min: group.min_age,
          max: group.max_age
        },
        is_active: true // Por defecto activo
      }));

      const updateData: Partial<Institution> = {
        educational_programs: formData.educational_programs,
        class_types: formData.class_types,
        student_countries: processedStudentCountries,
        student_level_groups: processedStudentLevelGroups,
        updated_at: new Date() as unknown as FieldValue
      };

      await this.institutionService.updateInstitution(userId, updateData);
      
      this.showMessage('Configuración académica guardada exitosamente', 'success');
      console.log('✅ Configuración académica guardada');
      
    } catch (error) {
      console.error('❌ Error guardando configuración académica:', error);
      this.showMessage('Error guardando la configuración académica', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  // Métodos de utilidad
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
      
      if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error' = 'success'): void {
    this.snackBar.open(
      message,
      'Cerrar',
      {
        duration: type === 'success' ? 3000 : 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: type === 'success' ? 'success-snackbar' : 'error-snackbar'
      }
    );
  }

  getFormControlError(controlName: string): string {
    const control = this.academicForm.get(controlName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) return 'Este campo es requerido';
      if (control.errors['min']) return `El valor mínimo es ${control.errors['min'].min}`;
    }
    return '';
  }
}
