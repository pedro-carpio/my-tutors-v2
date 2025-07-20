import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SessionService, UserService, UserRole } from '../../../services';
import { LayoutComponent } from '../../layout/layout.component';
import { ToolbarComponent } from '../../toolbar/toolbar.component';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    LayoutComponent,
    ToolbarComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  private sessionService = inject(SessionService);
  private userService = inject(UserService);
  private router = inject(Router);

  async selectRole(role: UserRole): Promise<void> {
    try {
      const currentUser = this.sessionService.currentUser;
      
      if (currentUser) {
        // Update user role in Firestore
        const users = await this.userService.getUserByEmail(currentUser.email!).toPromise();
        const userData = users?.[0];
        
        if (userData) {
          await this.userService.updateUser(userData.id!, { role });
          
          // Navigate to appropriate dashboard
          switch (role) {
            case 'student':
              this.router.navigate(['/student/dashboard']);
              break;
            case 'tutor':
              this.router.navigate(['/tutor/dashboard']);
              break;
            case 'institution':
              this.router.navigate(['/institution/dashboard']);
              break;
          }
        }
      }
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  }

  logout(): void {
    this.sessionService.logout();
  }
}
