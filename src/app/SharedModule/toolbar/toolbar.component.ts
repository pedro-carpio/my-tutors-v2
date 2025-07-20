import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

@Component({
  selector: 'app-toolbar',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  @Input() title: string = '';
  @Input() showLogout: boolean = false;
  @Output() logout = new EventEmitter<void>();
  
  private i18nService = inject(I18nService);

  // Getter para el idioma actual
  get currentLanguage() {
    return this.i18nService.getCurrentLanguage();
  }
  
  changeLanguage() {
    this.i18nService.toggleLanguage();
    console.log('Language changed to:', this.i18nService.getCurrentLanguage());
  }

  onLogout() {
    this.logout.emit();
  }
}
