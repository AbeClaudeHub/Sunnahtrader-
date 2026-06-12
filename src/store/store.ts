import { useSyncExternalStore } from 'react';
import type { LedgerState } from './types';

const KEY = 'the-ledger-v1';
const SCHEMA = 1 as const;

export function defaults(): LedgerState {
  return {
    schema: SCHEMA,
    access: false,
    auditDraft: null,
    audit: null,
    contract: null,
    settings: { name: '', avgTiltLoss: 0, baselineBreachesPerWeek: 0 },
    days: {},
    breaches: [],
    breaker: { active: null, sessions: [] },
  };
}

// future schema migrations: migrations[n] lifts a state from schema n to n+1
type Migration = (s: Record<string, unknown>) => Record<string, unknown>;
const migrations: Record<number, Migration> = {};

function lift(raw: unknown): LedgerState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  let s = raw as Record<string, unknown>;
  if (typeof s.schema !== 'number' || s.schema > SCHEMA) return null;
  while ((s.schema as number) < SCHEMA) {
    const step = migrations[s.schema as number];
    if (!step) return null;
    s = step(s);
  }
  if (typeof s.days !== 'object' || s.days === null) return null;
  if (!Array.isArray(s.breaches)) return null;
  const d = defaults();
  return {
    ...d,
    ...s,
    schema: SCHEMA,
    settings: { ...d.settings, ...(s.settings as object | undefined) },
    breaker: { ...d.breaker, ...(s.breaker as object | undefined) },
  } as LedgerState;
}

function load(): LedgerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults();
    return lift(JSON.parse(raw)) ?? defaults();
  } catch {
    return defaults();
  }
}

let state = load();
const listeners = new Set<() => void>();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — the in-memory ledger still runs
  }
}

export function getState(): LedgerState {
  return state;
}

export function setState(
  patch: Partial<LedgerState> | ((s: LedgerState) => Partial<LedgerState>)
): void {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  persist();
  listeners.forEach((l) => l());
}

export function useLedger(): LedgerState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    getState,
    getState
  );
}

export function exportJSON(): string {
  return JSON.stringify(state, null, 2);
}

export type ImportResult = { ok: true } | { ok: false; error: string };

export function importJSON(raw: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: 'The file could not be read. It is not valid JSON.' };
  }
  const lifted = lift(parsed);
  if (!lifted) return { ok: false, error: 'The file is not a ledger record.' };
  state = lifted;
  persist();
  listeners.forEach((l) => l());
  return { ok: true };
}
