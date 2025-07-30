import { Component, inject } from '@angular/core';
import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { LayoutComponent } from '../../layout/layout.component';
import { AsyncPipe } from '@angular/common';
import { SessionService } from '../../../services';

@Component({
  selector: 'app-job-postings',
  imports: [ToolbarComponent, LayoutComponent, AsyncPipe],
  templateUrl: './job-postings.component.html',
  styleUrl: './job-postings.component.scss'
})
export class JobPostingsComponent {
  private sessionService = inject(SessionService);
  
    logout(): void {
      this.sessionService.logout();
    }

}
