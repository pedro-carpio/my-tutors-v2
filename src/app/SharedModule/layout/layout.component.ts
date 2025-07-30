import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';
import { Navigation } from '../types/navigation';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UserService } from '../../services/user.service';
import { MultiRoleService } from '../../services/multi-role.service';
import { Auth, user } from '@angular/fire/auth';
import { UserRole } from '../../types/firestore.types';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    AsyncPipe,
    RouterLink,
    RouterLinkActive,
    TranslatePipe
  ]
})
export class LayoutComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private breakpointObserver = inject(BreakpointObserver);
  private i18nService = inject(I18nService);
  private userService = inject(UserService);
  private multiRoleService = inject(MultiRoleService);
  private auth = inject(Auth);

  @ViewChild('drawer') drawer!: MatSidenav;

  currentUserRoles: UserRole[] = [];
  activeRole: UserRole | null = null;
  filteredMenu: Navigation[] = [];
  
  // Flag para desarrollo - mostrar menú incluso sin autenticación
  private showMenuForDevelopment = false; // Cambiar a false en producción

  // Menú completo con roles y traduciones
  private fullMenu: Navigation[] = [
    {
      title: 'navigation.dashboard',
      translationKey: 'navigation.dashboard',
      type: 'group',
      roles: ['student', 'tutor', 'institution', 'admin'],
      children: [
        {
          title: 'navigation.home',
          translationKey: 'navigation.home',
          type: 'item',
          url: '/dashboard',
          matIcon: 'home',
          roles: ['student', 'tutor', 'institution', 'admin']
        }
      ]
    },
    {
      title: 'navigation.student',
      translationKey: 'navigation.student',
      type: 'group',
      roles: ['student'],
      children: [
        {
          title: 'navigation.myClasses',
          translationKey: 'navigation.myClasses',
          type: 'item',
          url: '/student/classes',
          matIcon: 'class',
          roles: ['student']
        },
        {
          title: 'navigation.findTutors',
          translationKey: 'navigation.findTutors',
          type: 'item',
          url: '/student/tutors',
          matIcon: 'search',
          roles: ['student']
        }
      ]
    },
    {
      title: 'navigation.tutor',
      translationKey: 'navigation.tutor',
      type: 'group',
      roles: ['tutor'],
      children: [
        {
          title: 'navigation.myStudents',
          translationKey: 'navigation.myStudents',
          type: 'item',
          url: '/tutor/students',
          matIcon: 'people',
          roles: ['tutor']
        },
        // TODO: Remove this in the languages service
        {
          title: 'navigation.availability',
          translationKey: 'navigation.availability',
          type: 'item',
          url: '/tutor/availability',
          matIcon: 'schedule',
          roles: ['tutor']
        }
      ]
    }, 
    {
      title: 'navigation.institution',
      translationKey: 'navigation.institution',
      type: 'group',
      roles: ['institution'],
      children: [
        {
          title: 'navigation.manageTutors',
          translationKey: 'navigation.manageTutors',
          type: 'item',
          url: '/institution/tutors',
          matIcon: 'supervisor_account',
          roles: ['institution']
        },
        {
          title: 'navigation.manageStudents',
          translationKey: 'navigation.manageStudents',
          type: 'item',
          url: '/institution/students',
          matIcon: 'group',
          roles: ['institution']
        }
      ]
    },
    {
      title: 'navigation.admin',
      translationKey: 'navigation.admin',
      type: 'group',
      roles: ['admin'],
      children: [
        {
          title: 'navigation.userManagement',
          translationKey: 'navigation.userManagement',
          type: 'item',
          url: '/admin/users',
          matIcon: 'admin_panel_settings',
          roles: ['admin']
        },
        {
          title: 'navigation.roleManagement',
          translationKey: 'navigation.roleManagement',
          type: 'item',
          url: '/admin/roles',
          matIcon: 'supervisor_account',
          roles: ['admin']
        },
        {
          title: 'navigation.systemSettings',
          translationKey: 'navigation.systemSettings',
          type: 'item',
          url: '/admin/settings',
          matIcon: 'settings',
          roles: ['admin']
        }
      ]
    }
  ];

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );

  ngOnInit(): void {
    // Inicializar el servicio de múltiples roles
    this.multiRoleService.initializeFromStorage();

    // Suscribirse a los roles del usuario
    this.multiRoleService.userRoles$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(roles => {
      this.currentUserRoles = roles;
      this.filterMenuByRoles();
    });

    // Suscribirse al rol activo
    this.multiRoleService.activeRole$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(activeRole => {
      this.activeRole = activeRole;
      this.filterMenuByRoles();
    });

    // Reaccionar a cambios de idioma
    this.i18nService.language$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      // El pipe translate se actualizará automáticamente
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Filtrar menú basado en los roles del usuario
  private filterMenuByRoles(): void {
    console.log('Filtering menu for roles:', this.currentUserRoles, 'Active role:', this.activeRole);
    
    if (!this.currentUserRoles.length) {
      console.log('No user roles found, hiding menu');
      this.filteredMenu = [];
      return;
    }

    // Mostrar elementos basados en TODOS los roles del usuario, no solo el activo
    this.filteredMenu = this.fullMenu
      .filter(item => this.hasAccessToAnyRole(item, this.currentUserRoles))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => this.hasAccessToAnyRole(child, this.currentUserRoles))
      }))
      .filter(item => item.type === 'item' || (item.children && item.children.length > 0));
    
    console.log('Filtered menu:', this.filteredMenu);
    console.log('Number of menu items:', this.filteredMenu.length);
  }

  // Verificar si el usuario tiene acceso basado en cualquiera de sus roles
  private hasAccessToAnyRole(item: Navigation, userRoles: UserRole[]): boolean {
    if (!userRoles.length || !item.roles) {
      return true;
    }
    return item.roles.some(role => userRoles.includes(role));
  }

  // Método para cambiar de rol activo
  switchRole(role: UserRole): void {
    this.multiRoleService.switchRole(role);
  }

  // Getter para verificar si el usuario tiene múltiples roles
  get hasMultipleRoles(): boolean {
    return this.currentUserRoles.length > 1;
  }

  // Obtener el título traducido del item
  getTranslatedTitle(item: Navigation): string {
    if (item.translationKey) {
      return this.i18nService.translate(item.translationKey);
    }
    return item.title;
  }

  // Método para toggle del drawer
  toggleDrawer(): void {
    this.drawer.toggle();
  }

  // Método para cerrar el drawer
  closeDrawer(): void {
    this.drawer.close();
  }

  // Método para cambiar idioma
  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }

  // Getter para el idioma actual
  get currentLanguage(): string {
    return this.i18nService.getCurrentLanguage();
  }
}
