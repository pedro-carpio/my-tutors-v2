import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../services/i18n.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false // Para que se actualice cuando cambie el idioma
})
export class TranslatePipe implements PipeTransform {
  private i18nService = inject(I18nService);

  transform(key: string, params?: Record<string, any>): string {
    let translation = this.i18nService.translate(key);
    
    // Reemplazar parámetros si se proporcionan
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{${param}}`, 'g'), params[param]);
      });
    }
    
    return translation;
  }
}
