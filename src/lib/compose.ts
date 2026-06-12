import type { DayEntry, LedgerState } from '../store/types';
import { fromISO, shortDate } from './dates';
import { daysUnderContract } from './stats';

export function composeMorning(state: LedgerState, day: DayEntry): string {
  const m = day.morning;
  if (!m) return '';
  const d = fromISO(day.date);
  const dayNo = daysUnderContract(state, day.date);
  const lines = [
    `CHECK-IN — ${shortDate(d)}`,
    `Intention: ${m.intention}`,
    `Max ${m.maxTrades} ${m.maxTrades === 1 ? 'trade' : 'trades'} · max risk ${m.maxRisk} · state: ${m.state.toLowerCase()}`,
  ];
  if (dayNo > 0) lines.push(`Under contract, day ${dayNo}. The ledger is watching.`);
  return lines.join('\n');
}

export function composeEvening(state: LedgerState, day: DayEntry): string {
  const e = day.evening;
  if (!e) return '';
  const d = fromISO(day.date);
  const dayNo = daysUnderContract(state, day.date);
  const ruleCount = state.contract?.current.rules.length ?? 0;
  const kept = ruleCount - e.breachedRuleIds.length;
  const max = day.morning?.maxTrades;

  const lines = [
    `CLOSE — ${shortDate(d)}`,
    `Plan followed: ${e.planFollowed ? 'yes' : 'no'}. Trades: ${e.trades}${max != null ? ` / ${max}` : ''}.`,
  ];
  if (ruleCount > 0) {
    if (e.breachedRuleIds.length === 0) {
      lines.push(`Rules kept: ${kept} / ${ruleCount}.`);
    } else {
      const titles = e.breachedRuleIds
        .map((id) => state.contract?.current.rules.find((r) => r.id === id)?.title ?? id)
        .join(', ');
      lines.push(`Rules kept: ${kept} / ${ruleCount}. Breached: ${titles}. Price owed.`);
    }
  }
  lines.push(`One line: ${e.honestLine}`);
  if (dayNo > 0) lines.push(`Day ${dayNo} under contract.`);
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
