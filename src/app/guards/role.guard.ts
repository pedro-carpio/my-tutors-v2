import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { UserService } from '../services/user.service';
import { map, take, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { UserRole } from '../types/firestore.types';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  private userService: UserService = inject(UserService);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const requiredRole = route.data['role'] as UserRole;
    const requiredRoles = route.data['roles'] as UserRole[]; // Nuevo: múltiples roles permitidos
    
    return user(this.auth).pipe(
      take(1),
      switchMap(authUser => {
        if (!authUser) {
          this.router.navigate(['/login']);
          return of(false);
        }

        return this.userService.getUser(authUser.uid).pipe(
          map(userData => {
            if (!userData) {
              this.router.navigate(['/dashboard']);
              return false;
            }

            const userRoles = userData.roles;
            
            // Verificar si tiene al menos uno de los roles requeridos
            if (requiredRoles && requiredRoles.length > 0) {
              const hasAnyRole = requiredRoles.some(role => userRoles.includes(role));
              if (hasAnyRole) return true;
            }
            
            // Verificar rol individual (compatibilidad hacia atrás)
            if (requiredRole && userRoles.includes(requiredRole)) {
              return true;
            }

            this.router.navigate(['/dashboard']);
            return false;
          })
        );
      })
    );
  }
}
