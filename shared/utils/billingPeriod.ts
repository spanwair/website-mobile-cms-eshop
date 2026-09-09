// Calendar-month billing period math -- every month is 28/29/30/31 days, never a fixed
// window. All boundaries are computed in UTC so "the 1st of the month" means the same instant
// everywhere regardless of the server's or a browser's local timezone.

export interface CalendarMonthPeriod {
  year: number;
  monthIndex0: number; // 0-11, JS Date convention
  periodStart: string; // 'YYYY-MM-DD', first day of the month
  periodEnd: string;   // 'YYYY-MM-DD', last day of the month (28-31)
  rangeStartIso: string; // UTC instant of periodStart 00:00:00.000, inclusive
  rangeEndIso: string;   // UTC instant of the NEXT month's 1st, exclusive -- use `>= start AND < end`
}

// Day 0 of "next month" is the last day of "this month" -- the standard trick for a
// timezone-safe last-day-of-month that needs no leap-year special-casing.
export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}

export function getCalendarMonthPeriod(year: number, monthIndex0: number): CalendarMonthPeriod {
  const start = new Date(Date.UTC(year, monthIndex0, 1));
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 1));
  const lastDay = daysInMonth(year, monthIndex0);
  const periodEnd = new Date(Date.UTC(year, monthIndex0, lastDay));
  return {
    year,
    monthIndex0,
    periodStart: start.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
    rangeStartIso: start.toISOString(),
    rangeEndIso: end.toISOString(),
  };
}

// Reconstructs a full period from just its stored period_start ('YYYY-MM-DD') -- what a
// billing-period DB row carries.
export function calendarMonthPeriodFromDateString(periodStartStr: string): CalendarMonthPeriod {
  const [y, m] = periodStartStr.split("-").map(Number);
  return getCalendarMonthPeriod(y, m - 1);
}

export function previousCalendarMonth(reference: Date): { year: number; monthIndex0: number } {
  const year = reference.getUTCFullYear();
  const monthIndex0 = reference.getUTCMonth();
  return monthIndex0 === 0 ? { year: year - 1, monthIndex0: 11 } : { year, monthIndex0: monthIndex0 - 1 };
}

// A period is finalized once its last day has fully elapsed in UTC -- the current (or a
// future) month always stays 'draft' and safe to recompute.
export function isPeriodElapsed(periodEnd: string, now: Date = new Date()): boolean {
  const end = new Date(`${periodEnd}T23:59:59.999Z`);
  return now.getTime() > end.getTime();
}
