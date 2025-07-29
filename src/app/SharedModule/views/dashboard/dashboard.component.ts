import { Component, inject } from '@angular/core';
import { Breakpoints, BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { SessionService, UserService } from '../../../services';
import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { LayoutComponent } from '../../layout/layout.component';
import { PendingConfigurationsComponent } from '../../components/pending-configurations/pending-configurations.component';
@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  imports: [
    AsyncPipe,
    MatGridListModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    CommonModule,
    LayoutComponent,
    ToolbarComponent,
    PendingConfigurationsComponent
  ]
})
export class DashboardComponent {
  private sessionService = inject(SessionService);
    private userService = inject(UserService);
    private router = inject(Router);
  
    logout(): void {
      this.sessionService.logout();
    }
  private breakpointObserver = inject(BreakpointObserver);

  /** Based on the screen size, switch from standard to one column per row */
  cards = this.breakpointObserver.observe(Breakpoints.Handset).pipe(
    map(({ matches }) => {
      if (matches) {
        return [
          { title: 'Configuraciones Pendientes', cols: 1, rows: 2, component: 'pending-configurations' },
          { title: 'Card 2', cols: 1, rows: 1, component: 'default' },
          { title: 'Card 3', cols: 1, rows: 1, component: 'default' },
          { title: 'Card 4', cols: 1, rows: 1, component: 'default' }
        ];
      }

      return [
        { title: 'Configuraciones Pendientes', cols: 1, rows: 2, component: 'pending-configurations' },
        { title: 'Card 2', cols: 1, rows: 1, component: 'default' },
        { title: 'Card 3', cols: 1, rows: 1, component: 'default' },
        { title: 'Card 4', cols: 1, rows: 1, component: 'default' }
      ];
    })
  );
}
