import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, switchMap, map } from 'rxjs/operators';
import { Auth, user, signOut } from '@angular/fire/auth';
import { MultiRoleService } from '../../../services/multi-role.service';
import { UserService } from '../../../services/user.service';
import { TutorProfileComponent } from './tutor-profile/tutor-profile.component';
import { LayoutComponent } from '../../layout/layout.component';
import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { UserRole, User } from '../../../types/firestore.types';
import { TranslatePipe } from '../../../pipes/translate.pipe';
import { InstitutionProfileComponent } from './intitution-profile/institution-profile.component';

@Component({
  selector: 'app-profile',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTooltipModule,
    TutorProfileComponent,
    InstitutionProfileComponent,
    LayoutComponent,
    ToolbarComponent,
    TranslatePipe
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private auth = inject(Auth);
  private router = inject(Router);
  private multiRoleService = inject(MultiRoleService);
  private userService = inject(UserService);

  currentUser$: Observable<User | null> = of(null);
  activeRole$: Observable<UserRole | null> = of(null);
  userRoles$: Observable<UserRole[]> = of([]);
  showingRole: UserRole | null = null;

  ngOnInit(): void {
    // Obtener usuario actual
    this.currentUser$ = user(this.auth).pipe(
      switchMap(authUser => {
        if (authUser) {
          return this.userService.getUser(authUser.uid).pipe(
            map(userData => userData || null)
          );
        }
        return of(null);
      })
    );

    // Obtener roles y rol activo
    this.userRoles$ = this.multiRoleService.userRoles$;
    this.activeRole$ = this.multiRoleService.activeRole$;

    // Sincronizar el rol que se está mostrando con el rol activo
    this.activeRole$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(activeRole => {
      // Solo cambiar automáticamente si el rol activo es tutor o institution
      if (activeRole === 'tutor' || activeRole === 'institution') {
        this.showingRole = activeRole;
      } else if (!this.showingRole) {
        // Si no hay rol seleccionado, inicializar con el rol activo si es apropiado
        this.showingRole = activeRole;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Cambiar vista del perfil
  switchProfileView(role: UserRole): void {
    this.showingRole = role;
    // Opcional: también cambiar el rol activo en el sistema
    // this.multiRoleService.switchRole(role);
  }

  // Sincronizar la vista del perfil con el rol activo
  syncWithActiveRole(): void {
    this.activeRole$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(activeRole => {
      if (activeRole === 'tutor' || activeRole === 'institution') {
        this.showingRole = activeRole;
      }
    });
  }

  // Verificar si el usuario tiene múltiples roles
  get hasMultipleRoles(): Observable<boolean> {
    return this.userRoles$.pipe(
      map(roles => roles.length > 1)
    );
  }

  // Obtener roles disponibles para mostrar
  getAvailableProfileRoles(): Observable<UserRole[]> {
    return this.userRoles$.pipe(
      map(roles => roles.filter(role => role === 'tutor' || role === 'institution'))
    );
  }

  // Métodos para el toolbar y layout
  async onLogout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.router.navigate(['/auth/login']);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  toggleMenu(): void {
    // Este método será manejado por el layout component
    // No necesitamos implementar nada aquí
  }
}
