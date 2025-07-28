import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionService } from './services/session.service';
import { GlobalLoadingComponent } from './SharedModule/components/global-loading/global-loading.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, GlobalLoadingComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'my-tutors-v3';
  private sessionService = inject(SessionService);

  async ngOnInit() {
    // Handle any pending redirect results from Google Auth
    try {
      await this.sessionService.handleRedirectResult();
    } catch (error) {
      console.error('Error handling redirect result:', error);
    }
  }
}
