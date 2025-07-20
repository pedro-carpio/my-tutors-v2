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
    
    return user(this.auth).pipe(
      take(1),
      switchMap(authUser => {
        if (!authUser) {
          this.router.navigate(['/login']);
          return of(false);
        }

        return this.userService.getUser(authUser.uid).pipe(
          map(userData => {
            if (userData && userData.role === requiredRole) {
              return true;
            } else {
              // Redirigir al dashboard apropiado basado en el rol del usuario
              this.redirectBasedOnRole(userData?.role);
              return false;
            }
          })
        );
      })
    );
  }

  private redirectBasedOnRole(role?: UserRole): void {
    switch (role) {
      case 'student':
        this.router.navigate(['/student/dashboard']);
        break;
      case 'tutor':
        this.router.navigate(['/tutor/dashboard']);
        break;
      case 'institution':
        this.router.navigate(['/institution/dashboard']);
        break;
      default:
        this.router.navigate(['/dashboard']);
    }
  }
}
