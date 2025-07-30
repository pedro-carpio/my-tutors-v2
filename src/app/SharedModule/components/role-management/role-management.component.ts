import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { Subject, Observable, of } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';
import { UserService, MultiRoleService } from '../../../services';
import { User, UserRole } from '../../../types/firestore.types';

@Component({
  selector: 'app-role-management',
  templateUrl: './role-management.component.html',
  styleUrl: './role-management.component.scss',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatSelectModule,
    MatProgressBarModule
  ]
})
export class RoleManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private userService = inject(UserService);
  private multiRoleService = inject(MultiRoleService);

  users$: Observable<User[]> = of([]);
  availableRoles: UserRole[] = ['student', 'tutor', 'institution', 'admin'];
  isLoading = false;

  ngOnInit(): void {
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.users$ = this.userService.getUsers(50); // Cargar más usuarios para administración
  }

  async addRoleToUser(user: User, role: UserRole): Promise<void> {
    if (!user?.id) {
      console.error('Invalid user provided');
      return;
    }
    try {
      this.isLoading = true;
      await this.userService.addRoleToUser(user.id, role);
      console.log(`Rol ${role} agregado a ${user.email}`);
      this.loadUsers();
    } catch (error) {
      console.error('Error adding role:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async removeRoleFromUser(user: User, role: UserRole): Promise<void> {
    if (!user?.id) {
      console.error('Invalid user provided');
      return;
    }
    try {
      this.isLoading = true;
      await this.userService.removeRoleFromUser(user.id, role);
      console.log(`Rol ${role} removido de ${user.email}`);
      this.loadUsers();
    } catch (error) {
      console.error('Error removing role:', error);
    } finally {
      this.isLoading = false;
    }
  }

  async setPrimaryRole(user: User, role: UserRole): Promise<void> {
    if (!user?.id) {
      console.error('Invalid user provided');
      return;
    }
    try {
      this.isLoading = true;
      await this.userService.setPrimaryRole(user.id, role);
      console.log(`Rol principal establecido como ${role} para ${user.email}`);
      this.loadUsers();
    } catch (error) {
      console.error('Error setting primary role:', error);
    } finally {
      this.isLoading = false;
    }
  }

  getUserRoles(user: User): UserRole[] {
    return user?.roles || [];
  }

  canRemoveRole(user: User, role: UserRole): boolean {
    if (!user) return false;
    const userRoles = this.getUserRoles(user);
    return userRoles.length > 1; // No permitir remover si solo tiene un rol
  }

  hasRole(user: User, role: UserRole): boolean {
    if (!user) return false;
    const userRoles = this.getUserRoles(user);
    return userRoles.includes(role);
  }

  getAvailableRolesToAdd(user: User): UserRole[] {
    if (!user) return [];
    const userRoles = this.getUserRoles(user);
    return this.availableRoles.filter(role => !userRoles.includes(role));
  }

  async migrateAllUsers(): Promise<void> {
    try {
      this.isLoading = true;
      // Find users without roles field and assign default roles
      const allUsers = await this.userService.getUsers(1000).toPromise();
      if (allUsers) {
        for (const user of allUsers) {
          if (!user.roles || user.roles.length === 0) {
            // Assign default role based on email or other criteria
            const defaultRole: UserRole = 'student'; // Default to student
            await this.userService.addRoleToUser(user.id, defaultRole);
            console.log(`Assigned default role '${defaultRole}' to user ${user.email}`);
          }
        }
      }
      console.log('Migración completada exitosamente');
      this.loadUsers();
    } catch (error) {
      console.error('Error migrating users:', error);
    } finally {
      this.isLoading = false;
    }
  }
}
