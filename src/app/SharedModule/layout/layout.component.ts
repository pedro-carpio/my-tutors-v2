import { Component, inject, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable, Subject, combineLatest } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';
import { Navigation } from '../types/navigation';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UserService } from '../../services/user.service';
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
  private auth = inject(Auth);

  @ViewChild('drawer') drawer!: MatSidenav;

  currentUserRole: UserRole | null = null;
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
    // Obtener el rol del usuario actual y filtrar el menú
    user(this.auth).pipe(
      takeUntil(this.destroy$)
    ).subscribe(authUser => {
      console.log('Auth user:', authUser);
      if (authUser) {
        console.log('Fetching user data for UID:', authUser.uid);
        this.userService.getUser(authUser.uid).pipe(
          takeUntil(this.destroy$)
        ).subscribe({
          next: (userData) => {
            console.log('User data from Firestore:', userData);
            if (userData) {
              this.currentUserRole = userData.role;
              console.log('User role set to:', this.currentUserRole);
            } else {
              console.warn('User document not found in Firestore for UID:', authUser.uid);
              // Crear usuario con rol por defecto si no existe
              return;
            }
            this.filterMenuByRole();
          },
          error: (error) => {
            console.error('Error fetching user data:', error);
            // En caso de error, asignar rol por defecto
            this.currentUserRole = 'student';
            this.filterMenuByRole();
          }
        });
      } else {
        console.log('No authenticated user found');
        this.currentUserRole = null;
        this.filteredMenu = [];
        
        // Para desarrollo: mostrar menú con rol de estudiante si no hay autenticación
        if (this.showMenuForDevelopment) {
          console.log('Development mode: showing menu without authentication');
          this.currentUserRole = 'student';
          this.filterMenuByRole();
        }
      }
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

  // Filtrar menú basado en el rol del usuario
  private filterMenuByRole(): void {
    console.log('Filtering menu for role:', this.currentUserRole);
    
    if (!this.currentUserRole) {
      console.log('No user role found, hiding menu');
      this.filteredMenu = [];
      return;
    }

    this.filteredMenu = this.fullMenu
      .filter(item => this.hasAccess(item, this.currentUserRole))
      .map(item => ({
        ...item,
        children: item.children?.filter(child => this.hasAccess(child, this.currentUserRole))
      }))
      .filter(item => item.type === 'item' || (item.children && item.children.length > 0));
    
    console.log('Filtered menu:', this.filteredMenu);
    console.log('Number of menu items:', this.filteredMenu.length);
  }

  // Verificar si el usuario tiene acceso al item
  private hasAccess(item: Navigation, userRole: UserRole | null): boolean {
    if (!userRole || !item.roles) {
      return true; // Si no hay roles definidos, permitir acceso
    }
    return item.roles.includes(userRole);
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
