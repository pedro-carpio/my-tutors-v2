import { Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatDivider } from '@angular/material/divider';
import { MonthComponent } from './month/month.component';
import { MatCard } from '@angular/material/card';

@Component({
  selector: 'app-calendar',
  imports: [MatToolbar, MatIcon, MatIconButton, MatCard, MatMenu, MatMenuItem, MatMenuTrigger, MatDivider, MonthComponent],
  templateUrl: './calendar.component.html',
  styleUrl: './calendar.component.scss'
})
export class CalendarComponent {

}
