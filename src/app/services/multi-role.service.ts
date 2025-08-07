import { Injectable, inject, DestroyRef } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest, map, firstValueFrom } from 'rxjs';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { UserService } from './user.service';
import { UserRole } from '../types/firestore.types';

@Injectable({
  providedIn: 'root'
})
export class MultiRoleService {
  private auth = inject(Auth);
  private userService = inject(UserService);
  private destroyRef = inject(DestroyRef);
  
  private currentRoleSubject = new BehaviorSubject<UserRole | null>(null);
  public currentRole$ = this.currentRoleSubject.asObservable();

  // BehaviorSubject for user roles to avoid injection context issues
  private userRolesSubject = new BehaviorSubject<UserRole[]>([]);
  public userRoles$ = this.userRolesSubject.asObservable();

  // Observable con el rol activo actual
  public activeRole$: Observable<UserRole | null>;

  constructor() {
    // Use onAuthStateChanged instead of user() observable to avoid injection context issues
    const unsubscribe = onAuthStateChanged(this.auth, async (authUser) => {
      if (authUser) {
        try {
          // Get user roles directly using the service method
          const roles = await this.getUserRolesDirectly(authUser.uid);
          this.userRolesSubject.next(roles);
        } catch (error) {
          console.error('Error getting user roles:', error);
          this.userRolesSubject.next([]);
        }
      } else {
        this.userRolesSubject.next([]);
      }
    });

    // Clean up the auth state listener when the service is destroyed
    this.destroyRef.onDestroy(() => {
      unsubscribe();
    });

    // Initialize activeRole$
    this.activeRole$ = combineLatest([
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
  }

  // Private method to get user roles directly without causing injection context issues
  private async getUserRolesDirectly(userId: string): Promise<UserRole[]> {
    try {
      // Convert the Observable to Promise to avoid injection context issues
      const roles$ = this.userService.getUserRoles(userId);
      const roles = await firstValueFrom(roles$);
      return roles;
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  }

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
    return this.userRoles$.pipe(
      map(roles => {
        if (!roles || roles.length === 0) return null;
        // Return the first role as primary (we could enhance this logic later)
        return roles[0];
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
