export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** whole calendar days from `fromIso` to `toIso` — UTC arithmetic, immune to DST */
export function calendarDaysBetween(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function weekdayName(d: Date): string {
  return DAYS[d.getDay()];
}

/** "12 JUNE 2026" */
export function longDate(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
}

/** "THU 12 JUN" */
export function shortDate(d: Date): string {
  return `${DAYS[d.getDay()].slice(0, 3).toUpperCase()} ${d.getDate()} ${MONTHS[d.getMonth()]
    .slice(0, 3)
    .toUpperCase()}`;
}

/** "9 JUN" — the compact form for ruled rows and chips */
export function compactDate(iso: string): string {
  const d = fromISO(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3).toUpperCase()}`;
}

/** "26 DHU AL-HIJJAH 1447" — the calendar, not scripture; empty string if unsupported */
export function hijriDate(d: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).formatToParts(d);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const day = get('day');
    const month = get('month').replace(/[ʻʼ‘’]/g, '');
    const year = get('year').replace(/\s*AH\s*/i, '');
    if (!day || !month || !year) return '';
    return `${day} ${month.toUpperCase()} ${year}`;
  } catch {
    return '';
  }
}

export function isMarketDay(d: Date): boolean {
  const wd = d.getDay();
  return wd >= 1 && wd <= 5;
}

/** market days (Mon–Fri) from `fromIso` through `toIso`, inclusive, as ISO strings */
export function marketDaysBetween(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  const cur = fromISO(fromIso);
  const end = fromISO(toIso);
  while (cur <= end) {
    if (isMarketDay(cur)) out.push(toISODate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** ISO dates of Monday..Friday for the week containing `d` */
export function weekMarketDays(d: Date): string[] {
  const monday = new Date(d);
  const shift = (d.getDay() + 6) % 7; // days since monday
  monday.setDate(d.getDate() - shift);
  const out: string[] = [];
  for (let i = 0; i < 5; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    out.push(toISODate(day));
  }
  return out;
}

/** "8–12 JUNE" within one month, "29 JUN – 3 JUL" across months; year optional */
export function weekRangeLabel(mondayIso: string, fridayIso: string, withYear = false): string {
  const a = fromISO(mondayIso);
  const b = fromISO(fridayIso);
  const year = withYear ? ` ${b.getFullYear()}` : '';
  if (a.getMonth() === b.getMonth()) {
    return `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()].toUpperCase()}${year}`;
  }
  const am = MONTHS[a.getMonth()].slice(0, 3).toUpperCase();
  const bm = MONTHS[b.getMonth()].slice(0, 3).toUpperCase();
  return `${a.getDate()} ${am} – ${b.getDate()} ${bm}${year}`;
}

/** thin-space thousands: 12 500 */
export function formatMoney(n: number): string {
  const sign = n < 0 ? '−' : '';
  const abs = Math.abs(Math.round(n));
  const s = String(abs).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}$${s}`;
}
