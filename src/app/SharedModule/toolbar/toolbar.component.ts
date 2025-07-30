import { Component, inject, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { I18nService } from '../../services/i18n.service';
import { MultiRoleService } from '../../services/multi-role.service';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { UserRole } from '../../types/firestore.types';

@Component({
  selector: 'app-toolbar',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    TranslatePipe
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent implements OnInit, OnDestroy {
  @Input() title: string = '';
  @Input() showLogout: boolean = false;
  @Input() showMenuButton: boolean = false;
  @Input() showRoleSelector: boolean = true; // Nuevo input para mostrar/ocultar selector
  @Output() logout = new EventEmitter<void>();
  @Output() menuToggle = new EventEmitter<void>();
  
  private destroy$ = new Subject<void>();
  private i18nService = inject(I18nService);
  private multiRoleService = inject(MultiRoleService);

  currentUserRoles: UserRole[] = [];
  activeRole: UserRole | null = null;

  ngOnInit(): void {
    // Suscribirse a los roles del usuario
    this.multiRoleService.userRoles$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(roles => {
      this.currentUserRoles = roles;
    });

    // Suscribirse al rol activo
    this.multiRoleService.activeRole$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(activeRole => {
      this.activeRole = activeRole;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Getter para verificar si tiene múltiples roles
  get hasMultipleRoles(): boolean {
    return this.currentUserRoles.length > 1;
  }

  // Getter para el idioma actual
  get currentLanguage() {
    return this.i18nService.getCurrentLanguage();
  }
  
  changeLanguage() {
    this.i18nService.toggleLanguage();
    console.log('Language changed to:', this.i18nService.getCurrentLanguage());
  }

  // Cambiar rol activo
  switchRole(role: UserRole): void {
    this.multiRoleService.switchRole(role);
  }

  onLogout() {
    this.logout.emit();
  }

  onMenuToggle() {
    this.menuToggle.emit();
  }
}
