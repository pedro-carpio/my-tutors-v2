import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SessionService, UserService, UserRole } from '../../../services';
import { LayoutComponent } from '../../layout/layout.component';
import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { AsyncPipe } from '@angular/common';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LayoutComponent,
    ToolbarComponent,
    AsyncPipe
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private sessionService = inject(SessionService);
  private userService = inject(UserService);
  private router = inject(Router);

  logout(): void {
    this.sessionService.logout();
  }
}
