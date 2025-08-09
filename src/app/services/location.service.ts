import { Injectable } from '@angular/core';
import { I18nService } from './i18n.service';
import { InstitutionService } from './institution.service';
import { SessionService } from './session.service';
import { InstitutionCountry, InstitutionState } from '../types/firestore.types';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private studentCountriesSubject = new BehaviorSubject<InstitutionCountry[]>([]);
  public studentCountries$ = this.studentCountriesSubject.asObservable();

  constructor(
    private i18nService: I18nService,
    private institutionService: InstitutionService,
    private sessionService: SessionService
  ) {
    this.loadInstitutionCountries();
  }

  // Cargar países de la institución actual
  private loadInstitutionCountries(): void {
    const currentUser = this.sessionService.currentUser;
    
    if (!currentUser?.uid) {
      console.warn('📍 LocationService: No hay usuario autenticado, cargando países vacíos');
      this.studentCountriesSubject.next([]);
      return;
    }

    console.log('📍 LocationService: Cargando países de institución para usuario:', currentUser.uid);

    this.institutionService.getInstitution(currentUser.uid).pipe(
      map(institution => {
        if (institution?.student_countries) {
          console.log('📍 LocationService: Países de institución cargados:', institution.student_countries.length);
          return institution.student_countries;
        }
        console.log('📍 LocationService: Institución sin países definidos, usando array vacío');
        return [];
      }),
      catchError(error => {
        console.error('📍 LocationService: Error cargando países de institución:', error);
        return of([]); // Retornar array vacío en caso de error
      })
    ).subscribe(countries => {
      this.studentCountriesSubject.next(countries);
    });
  }

  // Obtener países disponibles con traducción
  getAvailableCountries(): Observable<InstitutionCountry[]> {
    return this.studentCountries$.pipe(
      map(countries => {
        const currentLang = this.i18nService.getCurrentLanguage();
        return countries.map(country => ({
          ...country,
          name: this.getCountryTranslation(country.code, currentLang) || country.name
        }));
      })
    );
  }

  // Método helper para obtener traducción de países
  private getCountryTranslation(countryCode: string, lang: string): string | null {
    const translations: Record<string, Record<string, string>> = {
      'US': { es: 'Estados Unidos', en: 'United States' },
      'BO': { es: 'Bolivia', en: 'Bolivia' },
      'ES': { es: 'España', en: 'Spain' },
      'MX': { es: 'México', en: 'Mexico' },
      'AR': { es: 'Argentina', en: 'Argentina' },
      'CO': { es: 'Colombia', en: 'Colombia' }
    };

    return translations[countryCode]?.[lang] || null;
  }

  // Obtener un país por su código (método síncrono que necesitan algunos componentes)
  getCountryByCode(code: string): Observable<InstitutionCountry | undefined> {
    return this.studentCountries$.pipe(
      map(countries => {
        const country = countries.find(c => c.code === code);
        if (!country) return undefined;

        const currentLang = this.i18nService.getCurrentLanguage();
        return {
          ...country,
          name: this.getCountryTranslation(country.code, currentLang) || country.name
        };
      })
    );
  }

  // Obtener estados por código de país
  getStatesByCountryCode(countryCode: string): Observable<InstitutionState[]> {
    return this.studentCountries$.pipe(
      map(countries => {
        const country = countries.find(c => c.code === countryCode);
        return country?.states || [];
      })
    );
  }

  // Verificar si un país tiene estados (versión Observable)
  hasStates(countryCode: string): Observable<boolean> {
    return this.studentCountries$.pipe(
      map(countries => {
        const country = countries.find(c => c.code === countryCode);
        return !!(country?.states && country.states.length > 0);
      })
    );
  }

  // Método síncrono para hasStates (compatible con el código existente)
  hasStatesSync(countryCode: string): boolean {
    const countries = this.studentCountriesSubject.getValue();
    const country = countries.find(c => c.code === countryCode);
    return !!(country?.states && country.states.length > 0);
  }

  // Obtener el nombre de un país en el idioma actual
  getCountryName(countryCode: string): Observable<string> {
    return this.studentCountries$.pipe(
      map(countries => {
        const country = countries.find(c => c.code === countryCode);
        const currentLang = this.i18nService.getCurrentLanguage();
        return this.getCountryTranslation(countryCode, currentLang) || country?.name || countryCode;
      })
    );
  }

  // Obtener el nombre de un estado por su código y país
  getStateName(countryCode: string, stateCode: string): Observable<string> {
    return this.getStatesByCountryCode(countryCode).pipe(
      map(states => {
        const state = states.find(s => s.code === stateCode);
        return state?.name || stateCode;
      })
    );
  }

  // Verificar compatibilidad de ubicación para job postings
  isLocationCompatible(
    tutorCountry: string, 
    tutorState: string | undefined, 
    jobCountry: string | undefined, 
    jobState: string | undefined,
    modality: 'virtual' | 'presencial' | 'hibrida'
  ): Observable<boolean> {
    console.log('🗺️ LocationService: Verificando compatibilidad de ubicación', {
      tutorCountry,
      tutorState,
      jobCountry,
      jobState,
      modality
    });

    // Las clases virtuales siempre son compatibles
    if (modality === 'virtual') {
      console.log('✅ LocationService: Clase virtual - Compatible por defecto');
      return of(true);
    }

    return this.studentCountries$.pipe(
      map(() => {
        // Para clases presenciales e híbridas, debe coincidir la ubicación
        if (!jobCountry) {
          console.log('✅ LocationService: Job sin país especificado - Compatible por defecto');
          return true;
        }

        console.log('🔍 LocationService: Comparando ubicaciones:', {
          tutorCountry,
          jobCountry,
          countryMatch: tutorCountry === jobCountry
        });

        // Debe coincidir el país
        if (tutorCountry !== jobCountry) {
          console.log('❌ LocationService: Países no coinciden - Incompatible');
          return false;
        }

        // Si hay estado especificado en el job, debe coincidir
        if (jobState && tutorState !== jobState) {
          console.log('❌ LocationService: Estados no coinciden - Incompatible', {
            tutorState,
            jobState
          });
          return false;
        }

        console.log('✅ LocationService: Ubicación compatible');
        return true;
      })
    );
  }

  // Refrescar los países desde la institución actual
  refreshCountries(): void {
    console.log('🔄 LocationService: Refrescando países desde institución...');
    this.loadInstitutionCountries();
  }

  // Obtener la lista actual de países (sin Observable, para compatibilidad)
  getCurrentCountries(): InstitutionCountry[] {
    return this.studentCountriesSubject.getValue();
  }

  getCountries(): InstitutionCountry[] {
    const availableCountries: InstitutionCountry[] = [
        {
          code: 'US',
          name: 'United States',
          states: [
            { code: 'AL', name: 'Alabama' },
            { code: 'AK', name: 'Alaska' },
            { code: 'AZ', name: 'Arizona' },
            { code: 'AR', name: 'Arkansas' },
            { code: 'CA', name: 'California' },
            { code: 'CO', name: 'Colorado' },
            { code: 'CT', name: 'Connecticut' },
            { code: 'DE', name: 'Delaware' },
            { code: 'FL', name: 'Florida' },
            { code: 'GA', name: 'Georgia' },
            { code: 'HI', name: 'Hawaii' },
            { code: 'ID', name: 'Idaho' },
            { code: 'IL', name: 'Illinois' },
            { code: 'IN', name: 'Indiana' },
            { code: 'IA', name: 'Iowa' },
            { code: 'KS', name: 'Kansas' },
            { code: 'KY', name: 'Kentucky' },
            { code: 'LA', name: 'Louisiana' },
            { code: 'ME', name: 'Maine' },
            { code: 'MD', name: 'Maryland' },
            { code: 'MA', name: 'Massachusetts' },
            { code: 'MI', name: 'Michigan' },
            { code: 'MN', name: 'Minnesota' },
            { code: 'MS', name: 'Mississippi' },
            { code: 'MO', name: 'Missouri' },
            { code: 'MT', name: 'Montana' },
            { code: 'NE', name: 'Nebraska' },
            { code: 'NV', name: 'Nevada' },
            { code: 'NH', name: 'New Hampshire' },
            { code: 'NJ', name: 'New Jersey' },
            { code: 'NM', name: 'New Mexico' },
            { code: 'NY', name: 'New York' },
            { code: 'NC', name: 'North Carolina' },
            { code: 'ND', name: 'North Dakota' },
            { code: 'OH', name: 'Ohio' },
            { code: 'OK', name: 'Oklahoma' },
            { code: 'OR', name: 'Oregon' },
            { code: 'PA', name: 'Pennsylvania' },
            { code: 'RI', name: 'Rhode Island' },
            { code: 'SC', name: 'South Carolina' },
            { code: 'SD', name: 'South Dakota' },
            { code: 'TN', name: 'Tennessee' },
            { code: 'TX', name: 'Texas' },
            { code: 'UT', name: 'Utah' },
            { code: 'VT', name: 'Vermont' },
            { code: 'VA', name: 'Virginia' },
            { code: 'WA', name: 'Washington' },
            { code: 'WV', name: 'West Virginia' },
            { code: 'WI', name: 'Wisconsin' },
            { code: 'WY', name: 'Wyoming' }
          ]
          },
          {
              code: 'BO',
              name: 'Bolivia',
          },
          
        // TODO: Agregar más países en el futuro
    ];
    return availableCountries;
  }


  // Método público para recargar los países de la institución (útil después de cambios)
  reloadInstitutionCountries(): void {
    console.log('� LocationService: Recargando países de institución...');
    this.loadInstitutionCountries();
  }
}
