import type { DayEntry, LedgerState } from '../store/types';
import { fromISO, shortDate } from './dates';
import { daysUnderContract, integrityScore, versionInForceOn } from './stats';

// the signature line is the product's mark in the room — the one part of the
// message a stranger can trace back to somewhere
function signOff(state: LedgerState, dayNo: number, withIntegrity: boolean): string {
  if (dayNo <= 0) return '— THE LEDGER';
  const integ = withIntegrity ? integrityScore(state) : null;
  return integ != null
    ? `— THE LEDGER · DAY ${dayNo} · INTEGRITY ${integ.toFixed(1)}`
    : `— THE LEDGER · DAY ${dayNo}`;
}

export function composeMorning(state: LedgerState, day: DayEntry): string {
  const m = day.morning;
  if (!m) return '';
  const d = fromISO(day.date);
  const dayNo = daysUnderContract(state, day.date);
  return [
    `CHECK-IN — ${shortDate(d)}`,
    `Intention: ${m.intention}`,
    `Max ${m.maxTrades} ${m.maxTrades === 1 ? 'trade' : 'trades'} · max risk ${m.maxRisk} · state: ${m.state.toLowerCase()}`,
    signOff(state, dayNo, false),
  ].join('\n');
}

export function composeEvening(state: LedgerState, day: DayEntry): string {
  const e = day.evening;
  if (!e) return '';
  const d = fromISO(day.date);
  const dayNo = daysUnderContract(state, day.date);
  const rules = versionInForceOn(state, day.date)?.rules ?? [];
  const kept = rules.length - e.breachedRuleIds.length;
  const max = day.morning?.maxTrades;

  const lines = [
    `CLOSE — ${shortDate(d)}`,
    `Plan followed: ${e.planFollowed ? 'yes' : 'no'}. Trades: ${e.trades}${max != null ? ` / ${max}` : ''}.`,
  ];
  if (rules.length > 0) {
    if (e.breachedRuleIds.length === 0) {
      lines.push(`Rules kept: ${kept} / ${rules.length}.`);
    } else {
      const titles = e.breachedRuleIds
        .map((id) => rules.find((r) => r.id === id)?.title ?? id)
        .join(', ');
      lines.push(`Rules kept: ${kept} / ${rules.length}. Breached: ${titles}. Price owed.`);
    }
  }
  lines.push(`“${e.honestLine}”`);
  lines.push(signOff(state, dayNo, true));
  return lines.join('\n');
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
