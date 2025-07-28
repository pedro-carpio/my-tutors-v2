import { LoadingService } from '../services/loading.service';

/**
 * Decorador que automáticamente maneja el loading para métodos async
 * Úsalo en métodos de servicios que necesiten mostrar loading
 */
export function WithLoading(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(this: any, ...args: any[]) {
    // Buscar el LoadingService en la instancia
    const loadingService = this.loadingService || this.loading;
    
    if (loadingService && typeof loadingService.show === 'function') {
      loadingService.show();
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } finally {
        loadingService.hide();
      }
    } else {
      // Si no hay LoadingService disponible, ejecutar normalmente
      return await originalMethod.apply(this, args);
    }
  };

  return descriptor;
}

/**
 * Decorador que ejecuta una función con loading
 * Para ser usado en componentes o servicios
 */
export function AutoLoading() {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    return WithLoading(target, propertyKey, descriptor);
  };
}
