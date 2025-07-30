import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map, switchMap, of } from 'rxjs';
import { Auth, user } from '@angular/fire/auth';
import { UserService } from './user.service';
import { UserRole } from '../types/firestore.types';

@Injectable({
  providedIn: 'root'
})
export class MultiRoleService {
  private auth = inject(Auth);
  private userService = inject(UserService);
  
  private currentRoleSubject = new BehaviorSubject<UserRole | null>(null);
  public currentRole$ = this.currentRoleSubject.asObservable();

  // Observable con todos los roles del usuario actual
  public userRoles$: Observable<UserRole[]> = user(this.auth).pipe(
    switchMap(authUser => {
      if (authUser) {
        return this.userService.getUserRoles(authUser.uid);
      }
      return of([]);
    })
  );

  // Observable con el rol activo actual
  public activeRole$: Observable<UserRole | null> = combineLatest([
    this.userRoles$,
    this.currentRole$
  ]).pipe(
    map(([roles, currentRole]) => {
      if (roles.length === 0) return null;
      
      // Si no hay rol seleccionado o el rol seleccionado no está en la lista, usar el primero
      if (!currentRole || !roles.includes(currentRole)) {
        const firstRole = roles[0];
        this.currentRoleSubject.next(firstRole);
        return firstRole;
      }
      
      return currentRole;
    })
  );

  // Cambiar el rol activo
  switchRole(role: UserRole): void {
    this.currentRoleSubject.next(role);
    localStorage.setItem('activeRole', role);
  }

  // Obtener el rol activo desde localStorage al inicializar
  initializeFromStorage(): void {
    const storedRole = localStorage.getItem('activeRole') as UserRole;
    if (storedRole) {
      this.currentRoleSubject.next(storedRole);
    }
  }

  // Verificar si el usuario actual tiene un rol específico
  hasRole(role: UserRole): Observable<boolean> {
    return this.userRoles$.pipe(
      map(roles => roles.includes(role))
    );
  }

  // Obtener rutas disponibles según los roles del usuario
  getAvailableRoutes(): Observable<string[]> {
    return this.userRoles$.pipe(
      map(roles => {
        const routes: string[] = ['/dashboard'];
        
        if (roles.includes('student')) {
          routes.push('/student/tutors');
        }
        
        if (roles.includes('tutor')) {
          routes.push('/tutor/students', '/tutor/availability');
        }
        
        if (roles.includes('institution')) {
          routes.push('/institution/tutors', '/institution/students');
        }
        
        if (roles.includes('admin')) {
          routes.push('/admin/users', '/admin/settings');
        }
        
        return routes;
      })
    );
  }

  // Obtener el rol principal del usuario (primary_role o el primero de la lista)
  getPrimaryRole(): Observable<UserRole | null> {
    return user(this.auth).pipe(
      switchMap(authUser => {
        if (authUser) {
          return this.userService.getUser(authUser.uid).pipe(
            map(userData => {
              if (!userData) return null;
              
              // Primero intentar usar primary_role
              if (userData.primary_role) {
                return userData.primary_role;
              }
              
              // Si no existe, usar el primer rol de la lista
              if (userData.roles && userData.roles.length > 0) {
                return userData.roles[0];
              }
              
              // No hay rol disponible
              return null;
            })
          );
        }
        return of(null);
      })
    );
  }

  // Establecer el rol principal
  async setPrimaryRole(role: UserRole): Promise<void> {
    const authUser = this.auth.currentUser;
    if (authUser) {
      await this.userService.setPrimaryRole(authUser.uid, role);
    }
  }
}
