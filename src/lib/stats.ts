import type { Breach, LedgerState } from '../store/types';
import { marketDaysBetween, todayISO, toISODate } from './dates';

export function contractStartISO(state: LedgerState): string | null {
  const c = state.contract;
  if (!c) return null;
  const first = c.history.length > 0 ? c.history[0] : c.current;
  return first.signedAt.slice(0, 10);
}

/** calendar days since signing, day 1 = signing day; 0 if unsigned or before start */
export function daysUnderContract(state: LedgerState, onISO?: string): number {
  const start = contractStartISO(state);
  if (!start) return 0;
  const end = onISO ?? todayISO();
  if (end < start) return 0;
  const ms = new Date(end + 'T00:00:00').getTime() - new Date(start + 'T00:00:00').getTime();
  return Math.floor(ms / 86400000) + 1;
}

/** market days from signing through today with no entry at all */
export function missedDays(state: LedgerState): string[] {
  const start = contractStartISO(state);
  if (!start) return [];
  const today = todayISO();
  return marketDaysBetween(start, today).filter((iso) => {
    if (iso === today) return false; // today is open, not missed
    const d = state.days[iso];
    return !d || (!d.morning && !d.evening);
  });
}

/** integrity = rule-days kept ÷ rule-days judged, over evenings logged. 0–100, one decimal */
export function integrityScore(state: LedgerState): number | null {
  const c = state.contract;
  if (!c) return null;
  const ruleCount = c.current.rules.length;
  const evenings = Object.values(state.days).filter((d) => d.evening);
  if (evenings.length === 0 || ruleCount === 0) return null;
  const total = evenings.length * ruleCount;
  const broken = evenings.reduce((n, d) => n + (d.evening?.breachedRuleIds.length ?? 0), 0);
  return Math.round(((total - broken) / total) * 1000) / 10;
}

/** consecutive most-recent logged evenings without a breach of this rule */
export function ruleCleanStreak(state: LedgerState, ruleId: string): number {
  const evenings = Object.values(state.days)
    .filter((d) => d.evening)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  let streak = 0;
  for (const d of evenings) {
    if (d.evening!.breachedRuleIds.includes(ruleId)) break;
    streak += 1;
  }
  return streak;
}

export function unpaidBreaches(state: LedgerState): Breach[] {
  return state.breaches.filter((b) => !b.paid);
}

/** consecutive most-recent logged evenings with no breach of any kind that day */
export function cleanDayStreak(state: LedgerState): number {
  const breachDates = new Set(state.breaches.map((b) => b.date));
  const evenings = Object.values(state.days)
    .filter((d) => d.evening)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  let streak = 0;
  for (const d of evenings) {
    if (breachDates.has(d.date)) break;
    streak += 1;
  }
  return streak;
}

export interface SavedEstimate {
  weeks: number;
  expected: number;
  actual: number;
  prevented: number;
  saved: number;
}

/**
 * money saved = stated average tilt loss × breaches prevented,
 * where prevented = (pre-contract baseline × weeks under contract) − actual breaches,
 * floored at completed circuit-breaker sessions (each one is a save the trader watched happen).
 */
export function moneySaved(state: LedgerState): SavedEstimate | null {
  const { avgTiltLoss, baselineBreachesPerWeek } = state.settings;
  const days = daysUnderContract(state);
  if (days === 0 || avgTiltLoss <= 0) return null;
  const weeks = days / 7;
  const expected = baselineBreachesPerWeek * weeks;
  const actual = state.breaches.length;
  const completedBreakers = state.breaker.sessions.filter((s) => s.completed).length;
  const prevented = Math.max(Math.max(0, expected - actual), completedBreakers);
  return {
    weeks,
    expected: Math.round(expected * 10) / 10,
    actual,
    prevented: Math.round(prevented * 10) / 10,
    saved: Math.round(prevented * avgTiltLoss),
  };
}

export interface WeekSummary {
  fridayISO: string;
  rangeLabel: string;
  daysLogged: number;
  marketDays: number;
  tradesTotal: number;
  breaches: Breach[];
  integrity: number | null;
  cleanRules: number;
  ruleCount: number;
}

export function weekSummary(state: LedgerState, anchor: Date): WeekSummary {
  const week = (() => {
    const monday = new Date(anchor);
    const shift = (anchor.getDay() + 6) % 7;
    monday.setDate(anchor.getDate() - shift);
    const out: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      out.push(toISODate(d));
    }
    return out;
  })();

  const days = week.map((iso) => state.days[iso]).filter(Boolean);
  const evenings = days.filter((d) => d?.evening);
  const breaches = state.breaches.filter((b) => week.includes(b.date));
  const ruleCount = state.contract?.current.rules.length ?? 0;
  const breachedRuleIds = new Set(breaches.map((b) => b.ruleId));

  let integrity: number | null = null;
  if (evenings.length > 0 && ruleCount > 0) {
    const total = evenings.length * ruleCount;
    const broken = evenings.reduce((n, d) => n + (d!.evening!.breachedRuleIds.length ?? 0), 0);
    integrity = Math.round(((total - broken) / total) * 1000) / 10;
  }

  const first = week[0].slice(5).split('-').reverse().join('.');
  const last = week[4].slice(5).split('-').reverse().join('.');

  return {
    fridayISO: week[4],
    rangeLabel: `${first} — ${last}`,
    daysLogged: evenings.length,
    marketDays: 5,
    tradesTotal: evenings.reduce((n, d) => n + (d!.evening!.trades ?? 0), 0),
    breaches,
    integrity,
    cleanRules: ruleCount - breachedRuleIds.size,
    ruleCount,
  };
}
