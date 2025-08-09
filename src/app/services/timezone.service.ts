import { Injectable } from '@angular/core';

export interface TimezoneInfo {
  timezone: string;
  display_name: string;
  utc_offset: string;
  dst_aware: boolean;
  dst_start?: string;
  dst_end?: string;
}

export interface LocationTimezoneInfo {
  country_code: string;
  state_code?: string;
  timezones: string[];
  multiple_timezones: boolean;
  dst_aware: boolean;
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

  // Mapeo de estados de EE.UU. con sus timezones
  private readonly US_STATE_TIMEZONES: Record<string, TimezoneInfo[]> = {
    // Estados con una sola zona horaria
    'AL': [{ timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    'AK': [{ timezone: 'America/Anchorage', display_name: 'Alaska Time', utc_offset: 'UTC-9/-8', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    'CA': [{ timezone: 'America/Los_Angeles', display_name: 'Pacific Time', utc_offset: 'UTC-8/-7', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    'CO': [{ timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    'CT': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    'DE': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    'GA': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    'HI': [{ timezone: 'Pacific/Honolulu', display_name: 'Hawaii Time', utc_offset: 'UTC-10', dst_aware: false }], // Hawaii no usa DST
    'IL': [{ timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    'IN': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'NY': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }],
    
    // Estados con múltiples zonas horarias
    'AZ': [
      { timezone: 'America/Phoenix', display_name: 'Mountain Time (No DST)', utc_offset: 'UTC-7', dst_aware: false }, // Arizona no usa DST
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' } // Solo territorio Navajo
    ],
    'TX': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'FL': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'IN_STATE': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'KY': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'MI': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'ND': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'SD': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'TN': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ]
  };

  // Timezones por país (para países que no son EE.UU.)
  private readonly COUNTRY_TIMEZONES: Record<string, TimezoneInfo[]> = {
    'BO': [{ timezone: 'America/La_Paz', display_name: 'Bolivia Time', utc_offset: 'UTC-4', dst_aware: false }],
    'ES': [{ timezone: 'Europe/Madrid', display_name: 'Central European Time', utc_offset: 'UTC+1/+2', dst_aware: true, dst_start: '2024-03-31', dst_end: '2024-10-27' }],
    'MX': [
      { timezone: 'America/Mexico_City', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2024-04-07', dst_end: '2024-10-27' },
      { timezone: 'America/Tijuana', display_name: 'Pacific Time', utc_offset: 'UTC-8/-7', dst_aware: true, dst_start: '2024-03-10', dst_end: '2024-11-03' }
    ],
    'AR': [{ timezone: 'America/Argentina/Buenos_Aires', display_name: 'Argentina Time', utc_offset: 'UTC-3', dst_aware: false }],
    'CO': [{ timezone: 'America/Bogota', display_name: 'Colombia Time', utc_offset: 'UTC-5', dst_aware: false }]
  };

  constructor() {
    console.log('🕐 TimezoneService: Inicializado');
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
          dst_aware: stateTimezones.some(tz => tz.dst_aware),
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
        dst_aware: countryTimezones.some(tz => tz.dst_aware),
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
   * Verifica si una fecha está en horario de verano (DST)
   */
  isDSTActive(date: Date, timezoneInfo: TimezoneInfo): boolean {
    if (!timezoneInfo.dst_aware || !timezoneInfo.dst_start || !timezoneInfo.dst_end) {
      return false;
    }

    const year = date.getFullYear();
    const dstStart = new Date(`${year}-${timezoneInfo.dst_start.substring(5)}`);
    const dstEnd = new Date(`${year}-${timezoneInfo.dst_end.substring(5)}`);

    return date >= dstStart && date < dstEnd;
  }

  /**
   * Convierte una fecha y hora local a UTC considerando DST
   */
  convertToUTC(
    localDateTime: Date,
    timezone: string,
    countryCode: string,
    stateCode?: string
  ): ConvertedDateTime | null {
    try {
      const locationInfo = this.getTimezonesForLocation(countryCode, stateCode);
      if (!locationInfo) {
        console.error(`🕐 TimezoneService: No se pudo obtener información de timezone para ${countryCode}/${stateCode}`);
        return null;
      }

      const timezoneInfo = locationInfo.timezone_info.find(tz => tz.timezone === timezone);
      if (!timezoneInfo) {
        console.error(`🕐 TimezoneService: Timezone ${timezone} no encontrado para ${countryCode}/${stateCode}`);
        return null;
      }

      // Crear una fecha UTC equivalente usando la API nativa de JavaScript
      const utcDate = new Date(localDateTime.toLocaleString('en-US', { timeZone: 'UTC' }));
      
      // Verificar si DST está activo
      const isDstActive = this.isDSTActive(localDateTime, timezoneInfo);

      console.log(`🕐 TimezoneService: Conversión exitosa - Local: ${localDateTime.toISOString()}, UTC: ${utcDate.toISOString()}, DST: ${isDstActive}`);

      return {
        local_datetime: localDateTime.toISOString(),
        utc_datetime: utcDate.toISOString(),
        timezone: timezone,
        dst_active: isDstActive
      };

    } catch (error) {
      console.error('🕐 TimezoneService: Error en conversión a UTC:', error);
      return null;
    }
  }

  /**
   * Convierte una fecha UTC a hora local de un timezone específico
   */
  convertFromUTC(
    utcDateTime: Date,
    timezone: string,
    countryCode: string,
    stateCode?: string
  ): ConvertedDateTime | null {
    try {
      const locationInfo = this.getTimezonesForLocation(countryCode, stateCode);
      if (!locationInfo) {
        return null;
      }

      const timezoneInfo = locationInfo.timezone_info.find(tz => tz.timezone === timezone);
      if (!timezoneInfo) {
        return null;
      }

      // Usar Intl.DateTimeFormat para la conversión
      const localDate = new Date(utcDateTime.toLocaleString('en-US', { timeZone: timezone }));
      const isDstActive = this.isDSTActive(localDate, timezoneInfo);

      return {
        local_datetime: localDate.toISOString(),
        utc_datetime: utcDateTime.toISOString(),
        timezone: timezone,
        dst_active: isDstActive
      };

    } catch (error) {
      console.error('🕐 TimezoneService: Error en conversión desde UTC:', error);
      return null;
    }
  }

  /**
   * Obtiene el offset actual de un timezone considerando DST
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
