import { Injectable } from '@angular/core';

export interface TimezoneInfo {
  timezone: string;
  display_name: string;
  utc_offset: string;
}

export interface LocationTimezoneInfo {
  country_code: string;
  state_code?: string;
  timezones: string[];
  multiple_timezones: boolean;
  timezone_info: TimezoneInfo[];
}

export interface ConvertedDateTime {
  local_datetime: string;
  utc_datetime: string;
  timezone: string;
  dst_active: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TimezoneService {

  // Mapeo de estados de EE.UU. con sus timezones (sin DST para simplificación)
  private readonly US_STATE_TIMEZONES: Record<string, TimezoneInfo[]> = {
    // Estados con una sola zona horaria
    'AL': [{ timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' }],
    'AK': [{ timezone: 'America/Anchorage', display_name: 'Alaska Time', utc_offset: 'UTC-9' }],
    'CA': [{ timezone: 'America/Los_Angeles', display_name: 'Pacific Time', utc_offset: 'UTC-8' }],
    'CO': [{ timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7' }],
    'CT': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' }],
    'DE': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' }],
    'GA': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' }],
    'HI': [{ timezone: 'Pacific/Honolulu', display_name: 'Hawaii Time', utc_offset: 'UTC-10' }],
    'IL': [{ timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' }],
    'IN': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' }
    ],
    'NY': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' }],
    
    // Estados con múltiples zonas horarias
    'AZ': [
      { timezone: 'America/Phoenix', display_name: 'Mountain Time (No DST)', utc_offset: 'UTC-7' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7' }
    ],
    'TX': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7' }
    ],
    'FL': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' }
    ],
    'IN_STATE': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' }
    ],
    'KY': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' }
    ],
    'MI': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' }
    ],
    'ND': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7' }
    ],
    'SD': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7' }
    ],
    'TN': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6' }
    ]
  };

  // Timezones por país (para países que no son EE.UU.) - sin DST para simplificación
  private readonly COUNTRY_TIMEZONES: Record<string, TimezoneInfo[]> = {
    'BO': [{ timezone: 'America/La_Paz', display_name: 'Hora de Bolivia', utc_offset: 'UTC-4' }],
    'AR': [{ timezone: 'America/Argentina/Buenos_Aires', display_name: 'Hora de Argentina', utc_offset: 'UTC-3' }],
    'CL': [
      { timezone: 'America/Santiago', display_name: 'Hora de Chile', utc_offset: 'UTC-4' },
      { timezone: 'Pacific/Easter', display_name: 'Hora de Isla de Pascua', utc_offset: 'UTC-6' }
    ],
    'CO': [{ timezone: 'America/Bogota', display_name: 'Hora de Colombia', utc_offset: 'UTC-5' }],
    'EC': [{ timezone: 'America/Guayaquil', display_name: 'Hora de Ecuador', utc_offset: 'UTC-5' }],
    'PE': [{ timezone: 'America/Lima', display_name: 'Hora de Perú', utc_offset: 'UTC-5' }],
    'PY': [{ timezone: 'America/Asuncion', display_name: 'Hora de Paraguay', utc_offset: 'UTC-3' }],
    'UY': [{ timezone: 'America/Montevideo', display_name: 'Hora de Uruguay', utc_offset: 'UTC-3' }],
    'VE': [{ timezone: 'America/Caracas', display_name: 'Hora de Venezuela', utc_offset: 'UTC-4' }],
    'ES': [
      { timezone: 'Europe/Madrid', display_name: 'Hora Central Europea', utc_offset: 'UTC+1' },
      { timezone: 'Atlantic/Canary', display_name: 'Hora de Europa Occidental', utc_offset: 'UTC+0' }
    ],
    'MX': [
      { timezone: 'America/Mexico_City', display_name: 'Central Time', utc_offset: 'UTC-6' },
      { timezone: 'America/Tijuana', display_name: 'Pacific Time', utc_offset: 'UTC-8' },
      { timezone: 'America/Cancun', display_name: 'Eastern Time', utc_offset: 'UTC-5' }
    ],
    'CR': [{ timezone: 'America/Costa_Rica', display_name: 'Central Standard Time', utc_offset: 'UTC-6' }],
    'GT': [{ timezone: 'America/Guatemala', display_name: 'Central Standard Time', utc_offset: 'UTC-6' }],
    'PA': [{ timezone: 'America/Panama', display_name: 'Eastern Standard Time', utc_offset: 'UTC-5' }]
  };

  constructor() {
    console.log('🕐 TimezoneService: Inicializado');
  }

  /**
   * Devuelve listado de estados US soportados (código y nombre)
   */
  getUSStates(): { code: string; name: string }[] {
    return Object.keys(this.US_STATE_TIMEZONES).map(code => ({ code, name: this.getStateName(code) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Devuelve listado de países soportados (código y nombre)
   */
  getCountries(): { code: string; name: string }[] {
    const codes = new Set<string>([...Object.keys(this.COUNTRY_TIMEZONES), 'US']);
    return Array.from(codes).map(code => ({ code, name: code === 'US' ? 'United States' : this.getCountryName(code) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Verifica si un país está soportado por el servicio de timezones
   */
  isCountrySupported(countryCode: string): boolean {
    return countryCode === 'US' || !!this.COUNTRY_TIMEZONES[countryCode];
  }

  /**
   * Obtiene la información de timezones para una ubicación específica
   */
  getTimezonesForLocation(countryCode: string, stateCode?: string): LocationTimezoneInfo | null {
    console.log(`🕐 TimezoneService: Obteniendo timezones para ${countryCode}${stateCode ? '/' + stateCode : ''}`);

    if (countryCode === 'US' && stateCode) {
      const stateTimezones = this.US_STATE_TIMEZONES[stateCode];
      if (stateTimezones) {
        return {
          country_code: countryCode,
          state_code: stateCode,
          timezones: stateTimezones.map(tz => tz.timezone),
          multiple_timezones: stateTimezones.length > 1,
          timezone_info: stateTimezones
        };
      }
    }

    const countryTimezones = this.COUNTRY_TIMEZONES[countryCode];
    if (countryTimezones) {
      return {
        country_code: countryCode,
        timezones: countryTimezones.map(tz => tz.timezone),
        multiple_timezones: countryTimezones.length > 1,
        timezone_info: countryTimezones
      };
    }

    console.warn(`🕐 TimezoneService: No se encontraron timezones para ${countryCode}${stateCode ? '/' + stateCode : ''}`);
    return null;
  }

  /**
   * Verifica si una ubicación tiene múltiples timezones
   */
  hasMultipleTimezones(countryCode: string, stateCode?: string): boolean {
    const locationInfo = this.getTimezonesForLocation(countryCode, stateCode);
    return locationInfo?.multiple_timezones || false;
  }

  /**
   * Obtiene las opciones de timezone disponibles para una ubicación
   */
  getTimezoneOptions(countryCode: string, stateCode?: string): TimezoneInfo[] {
    const locationInfo = this.getTimezonesForLocation(countryCode, stateCode);
    return locationInfo?.timezone_info || [];
  }

  /**
   * Obtiene el offset actual de un timezone (simplificado, sin DST)
   */
  getCurrentOffset(timezone: string): string {
    try {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const targetTime = new Date(utc + (this.getTimezoneOffset(timezone) * 60000));
      
      const offset = targetTime.getTimezoneOffset();
      const hours = Math.floor(Math.abs(offset) / 60);
      const minutes = Math.abs(offset) % 60;
      const sign = offset <= 0 ? '+' : '-';
      
      return `UTC${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    } catch (error) {
      console.error('🕐 TimezoneService: Error obteniendo offset:', error);
      return 'UTC+00:00';
    }
  }

  /**
   * Obtiene el offset en minutos para un timezone
   */
  private getTimezoneOffset(timezone: string): number {
    try {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const targetDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
      
      return (targetDate.getTime() - utc) / 60000;
    } catch (error) {
      console.error('🕐 TimezoneService: Error calculando offset:', error);
      return 0;
    }
  }

  /**
   * Encuentra información de timezone basado en ubicación
   */
  private findTimezoneInfo(timezone: string, countryCode: string, stateCode?: string): TimezoneInfo | undefined {
    console.log(`🔍 TimezoneService: Buscando timezone info para "${timezone}" en ${countryCode}${stateCode ? '/' + stateCode : ''}`);
    
    if (countryCode === 'US' && stateCode) {
      const found = this.US_STATE_TIMEZONES[stateCode]?.find(t => t.timezone === timezone);
      if (found) {
        console.log(`✅ TimezoneService: Encontrado en US/${stateCode}:`, found);
        return found;
      }
      console.log(`⚠️ TimezoneService: No encontrado en US/${stateCode}`);
    }
    
    if (countryCode === 'US') {
      // Buscar en todos los estados si no se provee stateCode (caso excepcional)
      for (const [state, list] of Object.entries(this.US_STATE_TIMEZONES)) {
        const found = list.find(t => t.timezone === timezone);
        if (found) {
          console.log(`✅ TimezoneService: Encontrado en US/${state}:`, found);
          return found;
        }
      }
      console.log(`⚠️ TimezoneService: No encontrado en ningún estado de US`);
    }
    
    const countryTimezones = this.COUNTRY_TIMEZONES[countryCode];
    if (countryTimezones) {
      const found = countryTimezones.find(t => t.timezone === timezone);
      if (found) {
        console.log(`✅ TimezoneService: Encontrado en país ${countryCode}:`, found);
        return found;
      }
      console.log(`⚠️ TimezoneService: Timezone "${timezone}" no encontrado en ${countryCode}. Disponibles:`, countryTimezones.map(t => t.timezone));
    } else {
      console.log(`⚠️ TimezoneService: País "${countryCode}" no está configurado. Países disponibles:`, Object.keys(this.COUNTRY_TIMEZONES));
    }
    
    return undefined;
  }

  /**
   * Parsea una cadena de offset tipo: UTC-6, UTC+1, UTC+05:30, etc.
   * Devuelve minutos (local = UTC + minutos)
   */
  private parseOffsetString(utc_offset: string): number {
    const cleaned = utc_offset.replace('UTC', '').trim();
    const sign = cleaned.startsWith('-') ? -1 : 1;
    const [hStr, mStr] = cleaned.replace(/^[-+]/, '').split(':');
    const hours = parseInt(hStr, 10) || 0;
    const minutes = mStr ? parseInt(mStr, 10) : 0;
    return sign * (hours * 60 + minutes);
  }

  /**
   * Obtiene todas las ubicaciones soportadas con sus timezones
   */
  getAllSupportedLocations(): { country: string; state?: string; name: string; timezones: TimezoneInfo[] }[] {
    const locations: { country: string; state?: string; name: string; timezones: TimezoneInfo[] }[] = [];

    // Agregar estados de EE.UU.
    Object.entries(this.US_STATE_TIMEZONES).forEach(([stateCode, timezones]) => {
      locations.push({
        country: 'US',
        state: stateCode,
        name: `${this.getStateName(stateCode)}, United States`,
        timezones
      });
    });

    // Agregar otros países
    Object.entries(this.COUNTRY_TIMEZONES).forEach(([countryCode, timezones]) => {
      locations.push({
        country: countryCode,
        name: this.getCountryName(countryCode),
        timezones
      });
    });

    return locations;
  }

  /**
   * Obtiene el nombre del estado por su código
   */
  private getStateName(stateCode: string): string {
    const stateNames: Record<string, string> = {
      'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
      'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
      'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
      'IL': 'Illinois', 'IN_STATE': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
      'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
      'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
      'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
      'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
      'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
      'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
      'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
      'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
      'WI': 'Wisconsin', 'WY': 'Wyoming'
    };
    return stateNames[stateCode] || stateCode;
  }

  /**
   * Obtiene el nombre del país por su código
   */
  private getCountryName(countryCode: string): string {
    const countryNames: Record<string, string> = {
      'BO': 'Bolivia',
      'ES': 'Spain',
      'MX': 'Mexico',
      'AR': 'Argentina',
      'CO': 'Colombia'
    };
    return countryNames[countryCode] || countryCode;
  }
}
