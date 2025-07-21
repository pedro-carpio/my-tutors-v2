export interface DayCell {
  date: Date | null;
  count: number;
  isToday: boolean;
  active: boolean;
}

export const englishMonthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const englishDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
