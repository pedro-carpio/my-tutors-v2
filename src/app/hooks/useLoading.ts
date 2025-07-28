import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';

/**
 * Hook personalizado para manejar loading en componentes
 * Simplifica el uso del LoadingService
 */
export function useLoading() {
  const loadingService = inject(LoadingService);

  return {
    // Estado de loading
    isLoading: loadingService.isLoading,
    loading$: loadingService.loading$,

    // Métodos de control
    show: () => loadingService.show(),
    hide: () => loadingService.hide(),
    forceHide: () => loadingService.forceHide(),

    // Método principal para ejecutar con loading
    execute: <T>(asyncFn: () => Promise<T>): Promise<T> => {
      return loadingService.executeWithLoading(asyncFn);
    },

    // Método para crear wrapper de funciones
    wrap: <T extends (...args: any[]) => Promise<any>>(fn: T): T => {
      return loadingService.withLoading(fn);
    },

    // Utilidades
    async withMessage<T>(asyncFn: () => Promise<T>, startMessage?: string, endMessage?: string): Promise<T> {
      if (startMessage) console.log(startMessage);
      try {
        const result = await loadingService.executeWithLoading(asyncFn);
        if (endMessage) console.log(endMessage);
        return result;
      } catch (error) {
        console.error('Error during loading operation:', error);
        throw error;
      }
    }
  };
}

/**
 * Composable para casos comunes de loading
 */
export function useAsyncOperation() {
  const { execute, isLoading } = useLoading();

  return {
    isLoading,
    
    // Para operaciones de guardado
    async save<T>(saveFn: () => Promise<T>): Promise<T> {
      return execute(saveFn);
    },

    // Para operaciones de carga de datos
    async load<T>(loadFn: () => Promise<T>): Promise<T> {
      return execute(loadFn);
    },

    // Para operaciones de eliminación
    async delete<T>(deleteFn: () => Promise<T>): Promise<T> {
      return execute(deleteFn);
    },

    // Para navegación con datos
    async navigate<T>(navigationFn: () => Promise<T>): Promise<T> {
      return execute(navigationFn);
    }
  };
}
