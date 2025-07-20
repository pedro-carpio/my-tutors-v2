import { Component, inject } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AsyncPipe } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Navigation } from '../types/navigation';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { I18nService } from '../../services/i18n.service';
import { TranslatePipe } from '../../pipes/translate.pipe';

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
export class LayoutComponent {
  menu = [{title: 'My Default Group', type: 'group', id: 'default', children: [{ title: 'My Nav Item',type: 'item', id:'navitem1', url:'navi1', matIcon: 'info' } as Navigation]} as Navigation];
  private breakpointObserver = inject(BreakpointObserver);
  private i18nService = inject(I18nService);

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
  );

  // Getter para el idioma actual
  get currentLanguage() {
    return this.i18nService.getCurrentLanguage();
  }
  
  changeLanguage() {
    this.i18nService.toggleLanguage();
    console.log('Language changed to:', this.i18nService.getCurrentLanguage());
  }
}
