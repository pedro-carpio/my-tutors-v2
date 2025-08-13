import { Pipe, PipeTransform, inject } from '@angular/core';
import { JobPosting } from '../types/firestore.types';
import { TimezoneService } from '../services/timezone.service';

@Pipe({
  name: 'formatJobDateTime',
  standalone: true,
  pure: true
})
export class FormatJobDateTimePipe implements PipeTransform {
  private timezoneService = inject(TimezoneService);

  transform(jobPosting: JobPosting): string {
    if (!jobPosting) return 'Fecha por confirmar';

    try {
      // Verificar si existe class_datetime_utc
      if (jobPosting.class_datetime_utc) {
        const utcDate = new Date(jobPosting.class_datetime_utc);
        
        if (!isNaN(utcDate.getTime())) {
          // Si hay job_timezone, mostrar en esa zona horaria junto con la local
          if (jobPosting.job_timezone) {
            const jobTimezoneConversion = this.timezoneService.convertFromUTC(
              utcDate, 
              jobPosting.job_timezone
            );
            if (jobTimezoneConversion) {
              const jobLocalDate = new Date(jobTimezoneConversion.local_datetime);
              const userLocalDate = new Date(utcDate.getTime());
              
              return `${jobLocalDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} a las ${jobLocalDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })} (zona institución)<br/>${userLocalDate.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })} (tu zona)`;
            }
          }
          
          // Sin timezone específico, mostrar solo hora local del usuario
          return utcDate.toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          });
        }
      }
      
      // Verificar si existe class_datetime
      if (jobPosting.class_datetime) {
        const date = this.convertToDate(jobPosting.class_datetime as unknown);
        
        if (date && !isNaN(date.getTime())) {
          // Si hay job_timezone, convertir correctamente
          if (jobPosting.job_timezone) {
            // Convertir a UTC primero
            const utcConversion = this.timezoneService.convertToUTC(
              date,
              jobPosting.job_timezone
            );
            
            if (utcConversion) {
              const utcDate = new Date(utcConversion.utc_datetime);
              return `${date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} a las ${date.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })} (zona institución)<br/>${utcDate.toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })} (tu zona)`;
            }
          }
          
          return date.toLocaleString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
      }
      
      // Fallback para formato legacy
      if (jobPosting.class_date && jobPosting.start_time) {
        const legacyDate = this.convertToDate(jobPosting.class_date as unknown);
          
        if (legacyDate && !isNaN(legacyDate.getTime())) {
          const timeString = jobPosting.start_time;
          
          // Si hay job_timezone, mostrar información adicional
          if (jobPosting.job_timezone) {
            const classDateStr = legacyDate.toISOString().split('T')[0];
            const localDateTimeStr = `${classDateStr}T${timeString}:00`;
            const classDateTime = new Date(localDateTimeStr);
            
            const utcConversion = this.timezoneService.convertToUTC(
              classDateTime,
              jobPosting.job_timezone
            );
            
            if (utcConversion) {
              const utcDate = new Date(utcConversion.utc_datetime);
              return `${legacyDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })} a las ${timeString} (zona institución)<br/>${utcDate.toLocaleString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short'
              })} (tu zona)`;
            }
          }
          
          return `${legacyDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} a las ${timeString}`;
        }
      }
      
      return 'Fecha por confirmar';
      
    } catch (error) {
      console.error('❌ [FormatJobDateTimePipe] Error formatting date:', error);
      return 'Fecha por confirmar';
    }
  }

  private convertToDate(dateValue: unknown): Date | null {
    if (!dateValue) return null;

    // Manejar Date object
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Manejar Firestore Timestamp
    if (dateValue && 
        typeof dateValue === 'object' && 
        'toDate' in dateValue &&
        typeof (dateValue as { toDate: unknown }).toDate === 'function') {
      try {
        const result = ((dateValue as { toDate: () => Date }).toDate());
        return result instanceof Date ? result : null;
      } catch {
        return null;
      }
    }

    // Manejar objeto con seconds (Timestamp serializado)
    if (typeof dateValue === 'object' &&
        dateValue !== null &&
        'seconds' in dateValue &&
        typeof (dateValue as { seconds: unknown }).seconds === 'number') {
      try {
        return new Date((dateValue as { seconds: number }).seconds * 1000);
      } catch {
        return null;
      }
    }

    // Manejar string
    if (typeof dateValue === 'string') {
      try {
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date;
      } catch {
        return null;
      }
    }

    return null;
  }
}
