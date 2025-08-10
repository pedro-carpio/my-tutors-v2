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
    'AL': [{ timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    'AK': [{ timezone: 'America/Anchorage', display_name: 'Alaska Time', utc_offset: 'UTC-9/-8', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    'CA': [{ timezone: 'America/Los_Angeles', display_name: 'Pacific Time', utc_offset: 'UTC-8/-7', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    'CO': [{ timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    'CT': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    'DE': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    'GA': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    'HI': [{ timezone: 'Pacific/Honolulu', display_name: 'Hawaii Time', utc_offset: 'UTC-10', dst_aware: false }], // Hawaii no usa DST
    'IL': [{ timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    'IN': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'NY': [{ timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }],
    
    // Estados con múltiples zonas horarias
    'AZ': [
      { timezone: 'America/Phoenix', display_name: 'Mountain Time (No DST)', utc_offset: 'UTC-7', dst_aware: false }, // Arizona no usa DST
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' } // Solo territorio Navajo
    ],
    'TX': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'FL': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'IN_STATE': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'KY': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'MI': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'ND': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'SD': [
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Denver', display_name: 'Mountain Time', utc_offset: 'UTC-7/-6', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'TN': [
      { timezone: 'America/New_York', display_name: 'Eastern Time', utc_offset: 'UTC-5/-4', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' },
      { timezone: 'America/Chicago', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ]
  };

  // Timezones por país (para países que no son EE.UU.)
  private readonly COUNTRY_TIMEZONES: Record<string, TimezoneInfo[]> = {
    'BO': [{ timezone: 'America/La_Paz', display_name: 'Bolivia Time', utc_offset: 'UTC-4', dst_aware: false }],
    'ES': [{ timezone: 'Europe/Madrid', display_name: 'Central European Time', utc_offset: 'UTC+1/+2', dst_aware: true, dst_start: '2025-03-30', dst_end: '2025-10-26' }],
    'MX': [
      { timezone: 'America/Mexico_City', display_name: 'Central Time', utc_offset: 'UTC-6/-5', dst_aware: true, dst_start: '2025-04-06', dst_end: '2025-10-26' },
      { timezone: 'America/Tijuana', display_name: 'Pacific Time', utc_offset: 'UTC-8/-7', dst_aware: true, dst_start: '2025-03-09', dst_end: '2025-11-02' }
    ],
    'AR': [{ timezone: 'America/Argentina/Buenos_Aires', display_name: 'Argentina Time', utc_offset: 'UTC-3', dst_aware: false }],
    'CO': [{ timezone: 'America/Bogota', display_name: 'Colombia Time', utc_offset: 'UTC-5', dst_aware: false }]
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
      const tzInfo = this.findTimezoneInfo(timezone, countryCode, stateCode);
      if (!tzInfo) {
        console.warn('🕐 TimezoneService: Timezone no encontrado para conversión a UTC', timezone, countryCode, stateCode);
        return null;
      }

      const dstActive = this.isDSTActive(localDateTime, tzInfo);
      const offsetMinutes = this.getEffectiveOffsetMinutes(tzInfo, localDateTime, dstActive);
      // local = UTC + offset -> UTC = local - offset
      const utcDate = new Date(localDateTime.getTime() - offsetMinutes * 60000);

      return {
        local_datetime: localDateTime.toISOString(),
        utc_datetime: utcDate.toISOString(),
        timezone: tzInfo.timezone,
        dst_active: dstActive
      };
    } catch (error) {
      console.error('🕐 TimezoneService: Error en convertToUTC', error);
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
      const tzInfo = this.findTimezoneInfo(timezone, countryCode, stateCode);
      if (!tzInfo) {
        console.warn('🕐 TimezoneService: Timezone no encontrado para conversión desde UTC', timezone, countryCode, stateCode);
        return null;
      }

      // Primero asumimos offset estándar para obtener una fecha local tentativa
      const { standardMinutes, dstMinutes } = this.parseOffsetString(tzInfo.utc_offset);
      let localDate = new Date(utcDateTime.getTime() + standardMinutes * 60000);
  const dstActive = this.isDSTActive(localDate, tzInfo);
      if (dstActive && dstMinutes !== undefined) {
        // Recalcular usando offset DST
        localDate = new Date(utcDateTime.getTime() + dstMinutes * 60000);
      }

      return {
        local_datetime: localDate.toISOString(),
        utc_datetime: utcDateTime.toISOString(),
        timezone: tzInfo.timezone,
        dst_active: dstActive
      };
    } catch (error) {
      console.error('🕐 TimezoneService: Error en convertFromUTC', error);
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
   * Encuentra información de timezone basado en ubicación
   */
  private findTimezoneInfo(timezone: string, countryCode: string, stateCode?: string): TimezoneInfo | undefined {
    if (countryCode === 'US' && stateCode) {
      return this.US_STATE_TIMEZONES[stateCode]?.find(t => t.timezone === timezone);
    }
    if (countryCode === 'US') {
      // Buscar en todos los estados si no se provee stateCode (caso excepcional)
      for (const list of Object.values(this.US_STATE_TIMEZONES)) {
        const found = list.find(t => t.timezone === timezone);
        if (found) return found;
      }
    }
    return this.COUNTRY_TIMEZONES[countryCode]?.find(t => t.timezone === timezone);
  }

  /**
   * Parsea una cadena de offset tipo: UTC-6/-5, UTC+1/+2, UTC-4, UTC+05:30, etc.
   * Devuelve minutos (local = UTC + minutos)
   */
  private parseOffsetString(utc_offset: string): { standardMinutes: number; dstMinutes?: number } {
    const cleaned = utc_offset.replace('UTC', '').trim();
    const parts = cleaned.split('/');
    const parsePart = (p: string) => {
      const sign = p.startsWith('-') ? -1 : 1;
      const [hStr, mStr] = p.replace(/^[-+]/, '').split(':');
      const hours = parseInt(hStr, 10) || 0;
      const minutes = mStr ? parseInt(mStr, 10) : 0;
      return sign * (hours * 60 + minutes);
    };
    const standardMinutes = parsePart(parts[0]);
    const dstMinutes = parts[1] ? parsePart(parts[1]) : undefined;
    return { standardMinutes, dstMinutes };
  }

  /**
   * Obtiene offset efectivo para una fecha considerando DST
   */
  private getEffectiveOffsetMinutes(tzInfo: TimezoneInfo, date: Date, dstActiveOverride?: boolean): number {
    const { standardMinutes, dstMinutes } = this.parseOffsetString(tzInfo.utc_offset);
    if (!tzInfo.dst_aware || dstMinutes === undefined) {
      return standardMinutes;
    }
    const active = dstActiveOverride !== undefined ? dstActiveOverride : this.isDSTActive(date, tzInfo);
    return active ? dstMinutes! : standardMinutes;
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
