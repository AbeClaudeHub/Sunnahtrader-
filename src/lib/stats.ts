import type { Breach, ContractVersion, LedgerState } from '../store/types';
import { calendarDaysBetween, marketDaysBetween, todayISO, toISODate, weekRangeLabel } from './dates';

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
  return calendarDaysBetween(start, end) + 1;
}

/** the contract version that governed a given day — the latest one signed on or before it */
export function versionInForceOn(state: LedgerState, iso: string): ContractVersion | null {
  const c = state.contract;
  if (!c) return null;
  const versions = [...c.history, c.current];
  let governing: ContractVersion | null = null;
  for (const v of versions) {
    if (v.signedAt.slice(0, 10) <= iso) governing = v;
  }
  // a day before the first signing is judged under the first version
  return governing ?? versions[0];
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

/**
 * integrity = rule-days kept ÷ rule-days judged, over evenings logged. 0–100, one decimal.
 * each evening is judged against the contract version in force on its own date,
 * so amending the contract never rewrites how past days were scored.
 */
export function integrityScore(state: LedgerState): number | null {
  if (!state.contract) return null;
  const evenings = Object.values(state.days).filter((d) => d.evening);
  let total = 0;
  let broken = 0;
  for (const d of evenings) {
    const ruleCount = versionInForceOn(state, d.date)?.rules.length ?? 0;
    if (ruleCount === 0) continue;
    total += ruleCount;
    broken += d.evening!.breachedRuleIds.length;
  }
  if (total === 0) return null;
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

export interface DayMark {
  iso: string;
  logged: boolean;
  breached: boolean;
}

export interface WeekSummary {
  fridayISO: string;
  rangeLabel: string;
  dayMarks: DayMark[]; // Monday..Friday
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
  const breachDates = new Set(breaches.map((b) => b.date));
  const ruleCount = state.contract?.current.rules.length ?? 0;
  const breachedRuleIds = new Set(breaches.map((b) => b.ruleId));

  let total = 0;
  let broken = 0;
  for (const d of evenings) {
    const n = versionInForceOn(state, d!.date)?.rules.length ?? 0;
    if (n === 0) continue;
    total += n;
    broken += d!.evening!.breachedRuleIds.length;
  }
  const integrity = total > 0 ? Math.round(((total - broken) / total) * 1000) / 10 : null;

  const dayMarks: DayMark[] = week.map((iso) => {
    const d = state.days[iso];
    return {
      iso,
      logged: !!(d && (d.morning || d.evening)),
      breached: breachDates.has(iso),
    };
  });

  return {
    fridayISO: week[4],
    rangeLabel: weekRangeLabel(week[0], week[4]),
    dayMarks,
    daysLogged: evenings.length,
    marketDays: 5,
    tradesTotal: evenings.reduce((n, d) => n + (d!.evening!.trades ?? 0), 0),
    breaches,
    integrity,
    cleanRules: ruleCount - breachedRuleIds.size,
    ruleCount,
  };
}
