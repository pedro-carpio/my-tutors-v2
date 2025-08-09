import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';

// Componentes internos
import { ToolbarComponent } from '../../../SharedModule/toolbar/toolbar.component';
import { LayoutComponent } from '../../../SharedModule/layout/layout.component';
import { TranslatePipe } from '../../../pipes/translate.pipe';

// Servicios
import { TimezoneService } from '../../../services/timezone.service';
import { LocationService } from '../../../services/location.service';

interface TimezoneConversionResult {
  location: string;
  timezone: string;
  localDateTime: string;
  utcDateTime: string;
  isDST: boolean;
  utcOffset: string;
}

interface LocationOption {
  display: string;
  countryCode: string;
  stateCode?: string;
  timezone?: string;
}

@Component({
  selector: 'app-timezone-calculator',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTableModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
    MatMenuModule,
    ToolbarComponent,
    LayoutComponent,
    TranslatePipe
  ],
  templateUrl: './timezone-calculator.component.html',
  styleUrls: ['./timezone-calculator.component.scss']
})
export class TimezoneCalculatorComponent implements OnInit {
  private fb = inject(FormBuilder);
  private timezoneService = inject(TimezoneService);
  private locationService = inject(LocationService);

  // Formularios
  calculatorForm: FormGroup;
  locationForm: FormGroup;

  // Estado del componente
  isLoading = false;
  availableLocations: LocationOption[] = [];
  selectedLocations: LocationOption[] = [];
  conversionResults: TimezoneConversionResult[] = [];
  
  // Columnas para la tabla de resultados
  displayedColumns: string[] = ['location', 'timezone', 'localDateTime', 'utcDateTime', 'isDST', 'actions'];

  // Estadísticas de testing
  testingStats = {
    totalLocations: 0,
    dstAwareLocations: 0,
    multiTimezoneStates: 0,
    supportedCountries: 0
  };

  constructor() {
    this.calculatorForm = this.fb.group({
      testDateTime: [new Date(), Validators.required],
      selectedTimezone: ['', Validators.required]
    });

    this.locationForm = this.fb.group({
      selectedLocation: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadAvailableLocations();
    this.calculateTestingStats();
    this.initializeWithCurrentDateTime();
  }

  /**
   * Carga todas las ubicaciones disponibles del TimezoneService
   */
  private loadAvailableLocations(): void {
    console.log('🧪 TimezoneCalculator: Cargando ubicaciones disponibles para testing');
    
    try {
      const allLocations = this.timezoneService.getAllSupportedLocations();
      this.availableLocations = allLocations.map(location => ({
        display: `${location.name} (${location.timezones.length} ${location.timezones.length === 1 ? 'timezone' : 'timezones'})`,
        countryCode: location.country,
        stateCode: location.state,
        timezone: location.timezones.length === 1 ? location.timezones[0].timezone : undefined
      }));
      
      console.log(`✅ Cargadas ${this.availableLocations.length} ubicaciones para testing`);
    } catch (error) {
      console.error('❌ Error cargando ubicaciones:', error);
    }
  }

  /**
   * Calcula estadísticas de testing del TimezoneService
   */
  private calculateTestingStats(): void {
    try {
      const allLocations = this.timezoneService.getAllSupportedLocations();
      
      this.testingStats.totalLocations = allLocations.length;
      this.testingStats.dstAwareLocations = allLocations.filter(loc => 
        loc.timezones.some(tz => tz.dst_aware)
      ).length;
      this.testingStats.multiTimezoneStates = allLocations.filter(loc => 
        loc.timezones.length > 1
      ).length;
      
      // Contar países únicos
      const uniqueCountries = new Set(allLocations.map(loc => loc.country));
      this.testingStats.supportedCountries = uniqueCountries.size;
      
      console.log('📊 Estadísticas de testing calculadas:', this.testingStats);
    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
    }
  }

  /**
   * Inicializa con fecha/hora actual
   */
  private initializeWithCurrentDateTime(): void {
    const now = new Date();
    this.calculatorForm.patchValue({
      testDateTime: now
    });
  }

  /**
   * Añade una ubicación a la lista de conversiones
   */
  addLocation(): void {
    const selectedLocationValue = this.locationForm.get('selectedLocation')?.value;
    if (!selectedLocationValue) return;

    const locationOption = this.availableLocations.find(loc => 
      `${loc.countryCode}-${loc.stateCode || 'null'}` === selectedLocationValue
    );

    if (!locationOption) return;

    // Verificar si ya está añadida
    const alreadyAdded = this.selectedLocations.find(loc => 
      loc.countryCode === locationOption.countryCode && 
      loc.stateCode === locationOption.stateCode
    );

    if (alreadyAdded) {
      console.warn('⚠️ Ubicación ya añadida para testing');
      return;
    }

    this.selectedLocations.push(locationOption);
    this.locationForm.reset();
    this.updateConversions();
    
    console.log(`✅ Ubicación añadida para testing: ${locationOption.display}`);
  }

  /**
   * Remueve una ubicación de la lista
   */
  removeLocation(index: number): void {
    if (index >= 0 && index < this.selectedLocations.length) {
      const removed = this.selectedLocations.splice(index, 1)[0];
      this.updateConversions();
      console.log(`🗑️ Ubicación removida: ${removed.display}`);
    }
  }

  /**
   * Actualiza las conversiones para todas las ubicaciones seleccionadas
   */
  updateConversions(): void {
    if (!this.calculatorForm.valid) return;

    const testDateTime = this.calculatorForm.get('testDateTime')?.value;
    if (!testDateTime) return;

    this.conversionResults = [];

    this.selectedLocations.forEach(location => {
      try {
        const timezonesInfo = this.timezoneService.getTimezonesForLocation(
          location.countryCode, 
          location.stateCode
        );

        if (timezonesInfo) {
          // Si hay múltiples timezones, crear una entrada por cada una
          timezonesInfo.timezones.forEach(timezone => {
            // Encontrar la información específica del timezone
            const timezoneInfo = timezonesInfo.timezone_info.find(tz => tz.timezone === timezone);
            
            if (timezoneInfo) {
              // Convertir a UTC y de vuelta para testing
              const utcResult = this.timezoneService.convertToUTC(testDateTime, timezone, location.countryCode, location.stateCode);
              const localResult = this.timezoneService.convertFromUTC(testDateTime, timezone, location.countryCode, location.stateCode);
              const isDST = this.timezoneService.isDSTActive(testDateTime, timezoneInfo);
              
              this.conversionResults.push({
                location: `${location.display} - ${timezoneInfo.display_name}`,
                timezone: timezone,
                localDateTime: localResult?.local_datetime || testDateTime.toLocaleString(),
                utcDateTime: utcResult?.utc_datetime || testDateTime.toUTCString(),
                isDST: isDST,
                utcOffset: timezoneInfo.utc_offset || 'N/A'
              });
            }
          });
        }
      } catch (error) {
        console.error(`❌ Error procesando ${location.display}:`, error);
      }
    });

    console.log(`🧮 Conversiones actualizadas para ${this.conversionResults.length} timezones`);
  }

  /**
   * Limpia todas las ubicaciones seleccionadas
   */
  clearAllLocations(): void {
    this.selectedLocations = [];
    this.conversionResults = [];
    console.log('🧹 Todas las ubicaciones limpiadas');
  }

  /**
   * Actualiza conversiones cuando cambia la fecha/hora
   */
  onDateTimeChange(): void {
    this.updateConversions();
  }

  /**
   * Añade ubicaciones de prueba predefinidas
   */
  addSampleLocations(): void {
    const sampleLocations = [
      { countryCode: 'US', stateCode: 'NY' },  // Nueva York
      { countryCode: 'US', stateCode: 'CA' },  // California
      { countryCode: 'US', stateCode: 'TX' },  // Texas (múltiples timezones)
      { countryCode: 'MX', stateCode: undefined }, // México
      { countryCode: 'GB', stateCode: undefined }  // Reino Unido
    ];

    sampleLocations.forEach(sample => {
      const locationOption = this.availableLocations.find(loc => 
        loc.countryCode === sample.countryCode && 
        loc.stateCode === sample.stateCode
      );

      if (locationOption) {
        const alreadyAdded = this.selectedLocations.find(loc => 
          loc.countryCode === locationOption.countryCode && 
          loc.stateCode === locationOption.stateCode
        );

        if (!alreadyAdded) {
          this.selectedLocations.push(locationOption);
        }
      }
    });

    this.updateConversions();
    console.log('✅ Ubicaciones de muestra añadidas para testing');
  }

  /**
   * Exporta los resultados para debugging
   */
  exportResults(): void {
    const exportData = {
      testDateTime: this.calculatorForm.get('testDateTime')?.value,
      locations: this.selectedLocations,
      results: this.conversionResults,
      stats: this.testingStats,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Resultados de testing exportados:', exportData);
    
    // En un entorno real, podrías descargar como JSON
    const dataStr = JSON.stringify(exportData, null, 2);
    console.log('📄 JSON Export:', dataStr);
  }

  /**
   * Obtiene el valor para el selector de ubicaciones
   */
  getLocationValue(location: LocationOption): string {
    return `${location.countryCode}-${location.stateCode || 'null'}`;
  }

  /**
   * Prueba de DST con fechas específicas
   */
  testDSTTransitions(): void {
    const dstTestDates = [
      new Date('2024-03-10T10:00:00'), // Inicio DST 2024 (marzo)
      new Date('2024-11-03T10:00:00'), // Fin DST 2024 (noviembre)
      new Date('2024-07-15T10:00:00'), // Pleno verano
      new Date('2024-12-15T10:00:00')  // Pleno invierno
    ];

    dstTestDates.forEach(testDate => {
      console.log(`🕐 Testing DST para ${testDate.toLocaleDateString()}:`);
      
      this.calculatorForm.patchValue({ testDateTime: testDate });
      this.updateConversions();
      
      this.conversionResults.forEach(result => {
        console.log(`  - ${result.location}: ${result.isDST ? 'DST activo' : 'DST inactivo'}`);
      });
    });
  }
}
