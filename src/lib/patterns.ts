// what the ledger knows — patterns surfaced from the trader's own entries.
// honest arithmetic only: every sentence is a count the trader can verify by hand.
// each finding has an evidence threshold; below it, the ledger withholds judgment.

import type { DayEntry, LedgerState } from '../store/types';
import { fromISO, marketDaysBetween, todayISO, weekdayName } from './dates';
import { contractStartISO } from './stats';

export interface Finding {
  id: string;
  text: string;
}

/** logged evenings, oldest first */
function evenings(state: LedgerState): DayEntry[] {
  return Object.values(state.days)
    .filter((d) => d.evening)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

const WORDS = [
  'none', 'one', 'two', 'three', 'four', 'five', 'six',
  'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
];
function spell(n: number): string {
  return n >= 0 && n < WORDS.length ? WORDS[n] : String(n);
}
function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** three or more breaches, half or more on one weekday */
export function weekdayFinding(state: LedgerState): Finding | null {
  if (state.breaches.length < 3) return null;
  const byDay = new Map<string, number>();
  for (const b of state.breaches) {
    const name = weekdayName(fromISO(b.date));
    byDay.set(name, (byDay.get(name) ?? 0) + 1);
  }
  const [day, count] = [...byDay.entries()].sort((a, b) => b[1] - a[1])[0];
  if (count < 2 || count * 2 < state.breaches.length) return null;
  return {
    id: 'weekday',
    text: `${cap(spell(count))} of your ${spell(state.breaches.length)} breaches fell on a ${day}.`,
  };
}

/** the morning state word against how the day ended — needs 8 evenings and a word used 3+ times */
export function stateWordFinding(state: LedgerState): Finding | null {
  const evs = evenings(state).filter((d) => d.morning);
  if (evs.length < 8) return null;
  const groups = new Map<string, { days: number; breachDays: number }>();
  for (const d of evs) {
    const word = d.morning!.state.toLowerCase();
    const g = groups.get(word) ?? { days: 0, breachDays: 0 };
    g.days += 1;
    if (d.evening!.breachedRuleIds.length > 0) g.breachDays += 1;
    groups.set(word, g);
  }
  const used = [...groups.entries()].filter(([, g]) => g.days >= 3);
  if (used.length === 0) return null;
  const worst = used
    .filter(([, g]) => g.breachDays * 2 >= g.days)
    .sort((a, b) => b[1].breachDays / b[1].days - a[1].breachDays / a[1].days)[0];
  const best = used
    .filter(([, g]) => g.breachDays === 0)
    .sort((a, b) => b[1].days - a[1].days)[0];
  const parts: string[] = [];
  if (worst) {
    const [w, g] = worst;
    parts.push(`You wrote “${w}” ${spell(g.days)} mornings. ${cap(spell(g.breachDays))} ended in a breach.`);
  }
  if (best) {
    const [w, g] = best;
    parts.push(`You have never breached on a day you wrote “${w}” — ${spell(g.days)} days and counting.`);
  }
  if (parts.length === 0) return null;
  return { id: 'state-word', text: parts.join(' ') };
}

/** one rule carries two or more of the breaches */
export function brokenRuleFinding(state: LedgerState): Finding | null {
  const byRule = new Map<string, { title: string; count: number }>();
  for (const b of state.breaches) {
    if (b.ruleId === 'breaker') continue;
    const g = byRule.get(b.ruleId) ?? { title: b.ruleTitle, count: 0 };
    g.count += 1;
    byRule.set(b.ruleId, g);
  }
  const top = [...byRule.values()].sort((a, b) => b.count - a.count)[0];
  if (!top || top.count < 2) return null;
  return {
    id: 'broken-rule',
    text: `${top.title} is the rule you break: ${spell(top.count)} of your ${spell(state.breaches.length)} breaches.`,
  };
}

/** days the trader exceeded their own stated max, against how those days ended */
export function overMaxFinding(state: LedgerState): Finding | null {
  const evs = evenings(state).filter((d) => d.morning);
  const over = evs.filter((d) => d.evening!.trades > d.morning!.maxTrades);
  if (over.length < 2) return null;
  const overBreached = over.filter((d) => d.evening!.breachedRuleIds.length > 0).length;
  const within = evs.length - over.length;
  return {
    id: 'over-max',
    text:
      `You went past your own max trades on ${spell(over.length)} days; ` +
      `${spell(overBreached)} of them ended in a breach. ` +
      `You stayed within it on ${spell(within)}.`,
  };
}

export interface CleanRuns {
  longest: number;
  current: number;
}

/**
 * a clean day is a market day that was logged and carries no breach; a missed
 * market day breaks the run — an unwitnessed day is not a clean one. today only
 * counts once it is logged.
 */
export function cleanRuns(state: LedgerState): CleanRuns {
  const start = contractStartISO(state);
  if (!start) return { longest: 0, current: 0 };
  const today = todayISO();
  const breachDates = new Set(state.breaches.map((b) => b.date));
  let longest = 0;
  let run = 0;
  for (const iso of marketDaysBetween(start, today)) {
    const d = state.days[iso];
    const logged = !!(d && (d.morning || d.evening));
    if (logged && !breachDates.has(iso)) {
      run += 1;
      if (run > longest) longest = run;
    } else if (iso === today && !logged) {
      // today is still open; it neither extends nor breaks the run
    } else {
      run = 0;
    }
  }
  return { longest, current: run };
}

export function cleanRunFinding(state: LedgerState): Finding | null {
  if (evenings(state).length < 5) return null;
  const { longest, current } = cleanRuns(state);
  if (longest < 3) return null;
  const text =
    current === longest
      ? `Your longest clean run is ${spell(longest)} market days. You are extending it now.`
      : `Your longest clean run is ${spell(longest)} market days. You stand ${spell(current)} into the current one.`;
  return { id: 'clean-run', text };
}

/** completed breaker sessions, counted plainly */
export function breakerFinding(state: LedgerState): Finding | null {
  const held = state.breaker.sessions.filter((s) => s.completed).length;
  if (held < 2) return null;
  return {
    id: 'breaker-held',
    text: `The breaker has held ${spell(held)} times. ${cap(spell(held))} trades that never happened.`,
  };
}

/** every finding the evidence currently supports, in fixed order */
export function findings(state: LedgerState): Finding[] {
  return [
    cleanRunFinding(state),
    stateWordFinding(state),
    weekdayFinding(state),
    brokenRuleFinding(state),
    overMaxFinding(state),
    breakerFinding(state),
  ].filter((f): f is Finding => f !== null);
}

/** logged evenings still owed before the ledger will speak at all */
export function eveningsUntilFindings(state: LedgerState): number {
  return Math.max(0, 5 - evenings(state).length);
}
