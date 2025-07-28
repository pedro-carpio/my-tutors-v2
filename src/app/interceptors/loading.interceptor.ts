import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private loadingService = inject(LoadingService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Mostrar loading al iniciar la petición
    this.loadingService.show();

    return next.handle(req).pipe(
      finalize(() => {
        // Ocultar loading al finalizar la petición (exitosa o con error)
        this.loadingService.hide();
      })
    );
  }
}
