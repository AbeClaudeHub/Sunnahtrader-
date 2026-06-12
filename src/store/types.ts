export type SaboteurId = 'ego' | 'greed' | 'anger' | 'doubt';

export interface AuditResult {
  answers: number[]; // 16 values, each 0–3
  scores: Record<SaboteurId, number>;
  dominant: SaboteurId;
  seconded: SaboteurId;
  completedAt: string; // ISO
}

export interface AuditDraft {
  answers: (number | null)[];
  index: number;
}

export interface Rule {
  id: string; // slot id: r1..r5
  libraryId: string | null; // '01'..'12' when taken from the library
  title: string;
  when: string;
  then: string;
  noExceptions: string;
  price: string;
}

export interface ContractVersion {
  version: number;
  rules: Rule[];
  signedName: string;
  signedAt: string; // ISO
}

export interface Contract {
  current: ContractVersion;
  history: ContractVersion[]; // earlier versions, oldest first
}

export interface MorningEntry {
  intention: string;
  maxTrades: number;
  maxRisk: string;
  state: string; // one word
  at: string; // ISO
}

export interface EveningEntry {
  planFollowed: boolean;
  trades: number;
  breachedRuleIds: string[];
  honestLine: string;
  at: string; // ISO
}

export interface DayEntry {
  date: string; // YYYY-MM-DD
  morning?: MorningEntry;
  evening?: EveningEntry;
}

export type BreachSource = 'evening' | 'breaker';

export interface Breach {
  id: string;
  date: string; // YYYY-MM-DD
  ruleId: string; // r1..r5, or 'breaker' for an early exit
  ruleTitle: string;
  price: string;
  paid: boolean;
  paidAt?: string;
  source: BreachSource;
}

export interface BreakerSession {
  startedAt: string; // ISO
  endedAt: string; // ISO
  completed: boolean; // ran the full fifteen minutes
  note?: string; // "name what just happened"
}

export interface ActiveBreaker {
  startedAt: string; // ISO
  note?: string;
}

export interface Settings {
  name: string;
  avgTiltLoss: number; // dollars, stated by the trader
  baselineBreachesPerWeek: number; // pre-contract self-estimate
}

export interface LedgerState {
  schema: 2;
  access: boolean;
  auditDraft: AuditDraft | null;
  audit: AuditResult | null;
  audits: AuditResult[]; // prior readings, oldest first — the proof of movement
  contract: Contract | null;
  settings: Settings;
  days: Record<string, DayEntry>;
  breaches: Breach[];
  breaker: { active: ActiveBreaker | null; sessions: BreakerSession[] };
}
