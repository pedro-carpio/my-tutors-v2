import { Injectable, signal } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private loadingCount = 0;
  
  // Signal para uso en componentes
  public isLoading = signal<boolean>(false);
  
  // Observable para uso en componentes que prefieren observables
  public loading$ = this.loadingSubject.asObservable();

  constructor() {
    // Sincronizar signal con BehaviorSubject
    this.loading$.subscribe(loading => {
      this.isLoading.set(loading);
    });
  }

  /**
   * Muestra la pantalla de carga
   */
  show(): void {
    this.loadingCount++;
    if (this.loadingCount === 1) {
      this.loadingSubject.next(true);
    }
  }

  /**
   * Oculta la pantalla de carga
   */
  hide(): void {
    if (this.loadingCount > 0) {
      this.loadingCount--;
      if (this.loadingCount === 0) {
        this.loadingSubject.next(false);
      }
    }
  }

  /**
   * Fuerza el ocultado de la pantalla de carga
   */
  forceHide(): void {
    this.loadingCount = 0;
    this.loadingSubject.next(false);
  }

  /**
   * Ejecuta una función async y maneja automáticamente el loading
   */
  async executeWithLoading<T>(asyncFunction: () => Promise<T>): Promise<T> {
    this.show();
    try {
      const result = await asyncFunction();
      return result;
    } finally {
      this.hide();
    }
  }

  /**
   * Wrapper para funciones que retornan Promise
   */
  withLoading<T extends (...args: any[]) => Promise<any>>(fn: T): T {
    return ((...args: any[]) => {
      this.show();
      const promise = fn(...args);
      promise.finally(() => this.hide());
      return promise;
    }) as T;
  }
}
