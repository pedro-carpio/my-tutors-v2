import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { DayCell, englishMonthNames, englishDayNames } from '../types';
import { MatBadge } from '@angular/material/badge';
import { MatToolbar } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-month',
  imports: [MatToolbar, MatBadge, MatIcon, MatIconButton],
  templateUrl: './month.component.html',
  styleUrl: './month.component.scss'
})
export class MonthComponent {
  counts : { [key: string]: number } = {
    '2025-07-01': 3,
    '2025-07-10': 7,
    '2025-07-15': 2,
    '2025-07-25': 5,
  };
  activeDates = new Set<string>([
    '2025-07-01',
    '2025-07-04',
    '2025-07-10',
    '2025-07-15',
    '2025-07-20',
    '2025-07-25'
  ]);
  today = new Date();
  currentMonth = this.today.getMonth();
  currentYear = this.today.getFullYear();

  weeks: DayCell[][] = [];
  monthNames = englishMonthNames;
  dayNames = englishDayNames;

  constructor(private router: Router) {
    this.generateCalendar();
  }

  ngOnChanges() {
    this.generateCalendar();
  }

  prevMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  private generateCalendar() {
    const firstDayOfMonth = new Date(this.currentYear, this.currentMonth, 1);
    const startDay = firstDayOfMonth.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();

    const cells: DayCell[] = [];
    // blanks before first day (Sunday start -> 0 blanks)
    for (let i = 0; i < startDay; i++) {
      cells.push({ date: null, count: 0, isToday: false, active: false });
    }
    // fill days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const key = date.toISOString().slice(0,10);
      const count = this.counts[key] || 0;
      const isToday = date.toDateString() === this.today.toDateString();
      const active = this.activeDates.has(key);
      cells.push({ date, count, isToday, active });
    }
    // fill trailing blanks to always have 6 weeks (42 cells)
    while (cells.length < 42) {
      cells.push({ date: null, count: 0, isToday: false, active: false });
    }
    // chunk into exactly 6 weeks
    this.weeks = [];
    for (let i = 0; i < 42; i += 7) {
      this.weeks.push(cells.slice(i, i + 7));
    }
  }
  
  dayClicked(day: DayCell) {
    if (day.date && day.active) {
      this.router.navigate(['/calendar', day.date.toISOString().slice(0, 10)]);
    }
  }
}
