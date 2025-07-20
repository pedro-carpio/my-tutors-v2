import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { map, take } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GuestGuard implements CanActivate {
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return user(this.auth).pipe(
      take(1),
      map(user => {
        if (!user) {
          return true;
        } else {
          // Si el usuario ya está autenticado, redirigir al dashboard
          this.router.navigate(['/dashboard']);
          return false;
        }
      })
    );
  }
}
