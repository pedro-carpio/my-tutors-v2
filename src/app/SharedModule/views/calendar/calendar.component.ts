import { Component, inject } from '@angular/core';
import { LayoutComponent } from "../../layout/layout.component";
import { ToolbarComponent } from '../../toolbar/toolbar.component';
import { SessionService } from '../../../services';
import { AsyncPipe } from '@angular/common';
import { CalendarComponent } from '../../../components/calendar/calendar.component';
@Component({
  selector: 'layout-calendar',
  imports: [LayoutComponent, ToolbarComponent, AsyncPipe, CalendarComponent ],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class LayoutCalendarComponent {
  private sessionService = inject(SessionService);

  logout(): void {
    this.sessionService.logout();
  }
}
