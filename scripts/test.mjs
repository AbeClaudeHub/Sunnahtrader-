// THE LEDGER — unit tests for the arithmetic that the product's honesty rests on:
// dates, stats, patterns, compose, score. zero test dependencies: tsc compiles
// the libs to CommonJS in .testbuild/, node asserts. run via `npm test`
// (package.json pins TZ=America/New_York so DST is actually exercised).

import { execFileSync } from 'child_process';
import { createRequire } from 'module';
import { mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = join(root, '.testbuild');

mkdirSync(out, { recursive: true });
// the root package.json says "type": "module"; the compiled tests are CommonJS
writeFileSync(join(out, 'package.json'), '{ "type": "commonjs" }\n');

execFileSync(
  'npx',
  [
    'tsc',
    'src/lib/dates.ts', 'src/lib/stats.ts', 'src/lib/patterns.ts',
    'src/lib/compose.ts', 'src/lib/score.ts',
    '--outDir', out, '--module', 'commonjs', '--target', 'es2020',
    '--moduleResolution', 'node', '--esModuleInterop', '--skipLibCheck', '--strict',
  ],
  { cwd: root, stdio: 'inherit' }
);

const require = createRequire(import.meta.url);
const dates = require(join(out, 'lib/dates.js'));
const stats = require(join(out, 'lib/stats.js'));
const patterns = require(join(out, 'lib/patterns.js'));
const compose = require(join(out, 'lib/compose.js'));
const score = require(join(out, 'lib/score.js'));

// freeze the clock: every module reads todayISO through this binding
const TODAY = '2026-06-12'; // a Friday
dates.todayISO = () => TODAY;

let passed = 0;
let failed = 0;
function eq(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (ok) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`); }
}
function ok(name, cond) {
  if (cond) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}`); }
}

// ---------- fixtures ----------

function rule(id, title = `Rule ${id}`) {
  return { id, libraryId: null, title, when: 'w', then: 't', noExceptions: 'n', price: `$${id}` };
}
const R3 = [rule('r1', 'The Fifteen'), rule('r2'), rule('r3')];
const R5 = [...R3, rule('r4'), rule('r5', 'The Counted Hand')];

function state(over = {}) {
  return {
    schema: 1, access: false, auditDraft: null, audit: null, contract: null,
    settings: { name: '', avgTiltLoss: 0, baselineBreachesPerWeek: 0 },
    days: {}, breaches: [], breaker: { active: null, sessions: [] }, ...over,
  };
}
function contract(versions) {
  const all = versions.map(([version, rules, signedAt]) => ({
    version, rules, signedName: 'T T', signedAt,
  }));
  return { current: all[all.length - 1], history: all.slice(0, -1) };
}
function evening(date, breachedRuleIds = [], extra = {}) {
  return {
    date,
    morning: { intention: 'i', maxTrades: 3, maxRisk: '$100', state: 'patient', at: `${date}T08:00:00.000Z`, ...(extra.morning ?? {}) },
    evening: { planFollowed: breachedRuleIds.length === 0, trades: 2, breachedRuleIds, honestLine: 'line', at: `${date}T16:00:00.000Z`, ...(extra.evening ?? {}) },
  };
}
function breach(date, ruleId, paid = false) {
  return { id: `b-${date}-${ruleId}`, date, ruleId, ruleTitle: `Rule ${ruleId}`, price: '$x', paid, source: 'evening' };
}

// ---------- dates ----------
console.log('— dates');
eq('toISODate/fromISO round-trip', dates.toISODate(dates.fromISO('2026-06-12')), '2026-06-12');
eq('calendarDaysBetween is DST-immune (spring forward 2026-03-08)',
  dates.calendarDaysBetween('2026-03-06', '2026-03-09'), 3);
eq('calendarDaysBetween fall back (2026-11-01)',
  dates.calendarDaysBetween('2026-10-30', '2026-11-02'), 3);
eq('marketDaysBetween spans a weekend',
  dates.marketDaysBetween('2026-06-04', '2026-06-09'),
  ['2026-06-04', '2026-06-05', '2026-06-08', '2026-06-09']);
eq('weekRangeLabel same month', dates.weekRangeLabel('2026-06-08', '2026-06-12'), '8–12 JUNE');
eq('weekRangeLabel cross month', dates.weekRangeLabel('2026-06-29', '2026-07-03'), '29 JUN – 3 JUL');
eq('weekRangeLabel with year', dates.weekRangeLabel('2026-06-08', '2026-06-12', true), '8–12 JUNE 2026');
eq('formatMoney thin-space thousands', dates.formatMoney(12500), '$12\u202F500');
eq('formatMoney negative', dates.formatMoney(-300), '−$300');

// ---------- stats: days under contract ----------
console.log('— stats: days under contract');
const cSimple = state({ contract: contract([[1, R5, '2026-06-04T13:00:00.000Z']]) });
eq('day 1 is the signing day', stats.daysUnderContract(cSimple, '2026-06-04'), 1);
eq('nine days later is day 9', stats.daysUnderContract(cSimple, '2026-06-12'), 9);
eq('before signing is 0', stats.daysUnderContract(cSimple, '2026-06-01'), 0);
const cDst = state({ contract: contract([[1, R5, '2026-03-06T13:00:00.000Z']]) });
eq('day count across the DST jump (would be 3 with naive math)',
  stats.daysUnderContract(cDst, '2026-03-09'), 4);

// ---------- stats: version in force + integrity ----------
console.log('— stats: integrity under amendment');
const amended = state({
  contract: contract([
    [1, R3, '2026-05-04T13:00:00.000Z'],
    [2, R5, '2026-05-18T14:00:00.000Z'],
  ]),
  days: {
    '2026-05-10': evening('2026-05-10', ['r1']), // judged under v1: 3 rules
    '2026-05-20': evening('2026-05-20', []),     // judged under v2: 5 rules
  },
});
eq('versionInForceOn before amendment', stats.versionInForceOn(amended, '2026-05-10').version, 1);
eq('versionInForceOn on amendment day', stats.versionInForceOn(amended, '2026-05-18').version, 2);
eq('versionInForceOn before first signing falls back to v1',
  stats.versionInForceOn(amended, '2026-05-01').version, 1);
eq('integrity uses the rule count each day was judged under',
  stats.integrityScore(amended), 87.5); // (3-1 + 5-0) / (3+5) = 7/8
const noEvenings = state({ contract: contract([[1, R5, '2026-06-04T13:00:00.000Z']]) });
eq('integrity is null with no evenings', stats.integrityScore(noEvenings), null);

// ---------- stats: streaks, missed days, money ----------
console.log('— stats: streaks, missed days, money');
const streaky = state({
  contract: contract([[1, R5, '2026-06-01T13:00:00.000Z']]),
  days: {
    '2026-06-08': evening('2026-06-08', ['r1']),
    '2026-06-09': evening('2026-06-09', []),
    '2026-06-10': evening('2026-06-10', []),
  },
});
eq('ruleCleanStreak stops at the last breach', stats.ruleCleanStreak(streaky, 'r1'), 2);
eq('ruleCleanStreak counts all evenings when never broken', stats.ruleCleanStreak(streaky, 'r2'), 3);
eq('missedDays excludes today and logged days',
  stats.missedDays(streaky),
  ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-11']);

const saver = state({
  contract: contract([[1, R5, '2026-05-29T13:00:00.000Z']]), // 15 days ≈ 2.14 weeks
  settings: { name: 'T', avgTiltLoss: 300, baselineBreachesPerWeek: 3 },
  breaches: [breach('2026-06-08', 'r1')],
  breaker: { active: null, sessions: [
    { startedAt: 'x', endedAt: 'y', completed: true },
    { startedAt: 'x', endedAt: 'y', completed: false },
  ] },
});
const sv = stats.moneySaved(saver);
eq('moneySaved expected from baseline', sv.expected, 6.4);
eq('moneySaved prevented = expected − actual', sv.prevented, 5.4);
eq('moneySaved dollars', sv.saved, Math.round(5.4285714 * 300));
const floored = state({
  contract: contract([[1, R5, '2026-06-11T13:00:00.000Z']]),
  settings: { name: 'T', avgTiltLoss: 300, baselineBreachesPerWeek: 0 },
  breaker: { active: null, sessions: [
    { startedAt: 'x', endedAt: 'y', completed: true },
    { startedAt: 'x', endedAt: 'y', completed: true },
  ] },
});
eq('moneySaved floors at completed breaker runs', stats.moneySaved(floored).prevented, 2);

// ---------- stats: week summary ----------
console.log('— stats: week summary');
const wk = state({
  contract: contract([[1, R5, '2026-06-01T13:00:00.000Z']]),
  days: {
    '2026-06-08': evening('2026-06-08', ['r1']),
    '2026-06-10': evening('2026-06-10', []),
    '2026-06-12': evening('2026-06-12', []),
  },
  breaches: [breach('2026-06-08', 'r1')],
});
const ws = stats.weekSummary(wk, dates.fromISO('2026-06-12'));
eq('week rangeLabel', ws.rangeLabel, '8–12 JUNE');
eq('week daysLogged', ws.daysLogged, 3);
eq('week integrity', ws.integrity, 93.3); // 14/15
eq('week dayMarks logged flags', ws.dayMarks.map((m) => m.logged), [true, false, true, false, true]);
eq('week dayMarks breach flags', ws.dayMarks.map((m) => m.breached), [true, false, false, false, false]);
eq('week cleanRules', ws.cleanRules, 4);

// ---------- patterns ----------
console.log('— patterns');
const mondays = state({
  contract: contract([[1, R5, '2026-05-04T13:00:00.000Z']]),
  breaches: [breach('2026-05-11', 'r1'), breach('2026-05-18', 'r1'), breach('2026-05-20', 'r2')],
});
eq('weekday finding names the day',
  patterns.weekdayFinding(mondays).text, 'Two of your three breaches fell on a Monday.');
eq('weekday finding needs three breaches',
  patterns.weekdayFinding(state({ breaches: [breach('2026-05-11', 'r1')] })), null);

const wordDays = {};
const wordList = [
  ['2026-05-04', 'tight', ['r1']], ['2026-05-05', 'tight', ['r2']], ['2026-05-06', 'tight', []],
  ['2026-05-07', 'patient', []], ['2026-05-08', 'patient', []], ['2026-05-11', 'patient', []],
  ['2026-05-12', 'patient', []], ['2026-05-13', 'steady', []],
];
for (const [d, word, br] of wordList) {
  wordDays[d] = evening(d, br, { morning: { state: word } });
}
const wordState = state({ contract: contract([[1, R5, '2026-05-04T13:00:00.000Z']]), days: wordDays });
eq('state-word finding pairs the dangerous and the safe word',
  patterns.stateWordFinding(wordState).text,
  'You wrote “tight” three mornings. Two ended in a breach. You have never breached on a day you wrote “patient” — four days and counting.');
eq('state-word finding withholds below eight evenings',
  patterns.stateWordFinding(state({ days: { '2026-05-04': evening('2026-05-04') } })), null);

eq('broken-rule finding counts the repeat offender',
  patterns.brokenRuleFinding(mondays).text,
  'Rule r1 is the rule you break: two of your three breaches.');

const overDays = {
  '2026-06-08': evening('2026-06-08', ['r1'], { evening: { trades: 5 } }),
  '2026-06-09': evening('2026-06-09', [], { evening: { trades: 4 } }),
  '2026-06-10': evening('2026-06-10', []),
};
eq('over-max finding compares the two columns',
  patterns.overMaxFinding(state({ days: overDays })).text,
  'You went past your own max trades on two days; one of them ended in a breach. You stayed within it on one.');

const runState = state({
  contract: contract([[1, R5, '2026-06-01T13:00:00.000Z']]),
  days: {
    '2026-06-01': evening('2026-06-01', []),
    '2026-06-02': evening('2026-06-02', []),
    '2026-06-03': evening('2026-06-03', []),
    '2026-06-04': evening('2026-06-04', ['r1']),
    // 06-05 missed — breaks any run
    '2026-06-08': evening('2026-06-08', []),
    '2026-06-09': evening('2026-06-09', []),
    // 06-10, 06-11 missed; 06-12 is today, still open
  },
  breaches: [breach('2026-06-04', 'r1')],
});
eq('cleanRuns: breaches and gaps reset, today stays open',
  patterns.cleanRuns(runState), { longest: 3, current: 0 });
const extendState = state({
  contract: contract([[1, R5, '2026-06-08T13:00:00.000Z']]),
  days: {
    '2026-06-08': evening('2026-06-08', []),
    '2026-06-09': evening('2026-06-09', []),
    '2026-06-10': evening('2026-06-10', []),
    '2026-06-11': evening('2026-06-11', []),
    '2026-06-12': evening('2026-06-12', []),
  },
});
eq('clean-run finding speaks when the run is alive',
  patterns.cleanRunFinding(extendState).text,
  'Your longest clean run is five market days. You are extending it now.');

eq('breaker finding counts held sessions',
  patterns.breakerFinding(state({ breaker: { active: null, sessions: [
    { startedAt: 'x', endedAt: 'y', completed: true },
    { startedAt: 'x', endedAt: 'y', completed: true },
    { startedAt: 'x', endedAt: 'y', completed: false },
  ] } })).text,
  'The breaker has held two times. Two trades that never happened.');

eq('eveningsUntilFindings counts down to five', patterns.eveningsUntilFindings(state()), 5);
ok('deep evidence yields multiple findings', patterns.findings(runState).length >= 1);

// ---------- compose ----------
console.log('— compose');
const composeState = state({
  contract: contract([[1, R5, '2026-06-04T13:00:00.000Z']]),
  days: { '2026-06-12': evening('2026-06-12', []) },
});
const dayEntry = composeState.days['2026-06-12'];
const am = compose.composeMorning(composeState, dayEntry);
ok('morning check-in opens with the dateline', am.startsWith('CHECK-IN — FRI 12 JUN'));
ok('morning check-in signs off with the mark', am.endsWith('— THE LEDGER · DAY 9'));
const pm = compose.composeEvening(composeState, dayEntry);
ok('evening close quotes the honest line', pm.includes('“line”'));
ok('evening close signs off with integrity', pm.endsWith('— THE LEDGER · DAY 9 · INTEGRITY 100.0'));
const pmBreach = compose.composeEvening(
  { ...composeState, days: { '2026-06-12': evening('2026-06-12', ['r1']) } },
  evening('2026-06-12', ['r1'])
);
ok('a breached close names the rule and the debt',
  pmBreach.includes('Breached: The Fifteen. Price owed.'));
const unsigned = state({ days: { '2026-06-12': evening('2026-06-12', []) } });
ok('no contract still carries the bare mark',
  compose.composeMorning(unsigned, unsigned.days['2026-06-12']).endsWith('— THE LEDGER'));

// ---------- score ----------
console.log('— score');
const allZero = score.scoreAudit(Array(16).fill(0));
eq('zero answers fall to the deterministic order', [allZero.dominant, allZero.seconded], ['anger', 'ego']);
const angry = score.scoreAudit([3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0]);
eq('anger questions raise anger', angry.dominant, 'anger');
eq('anger score sums its four questions', angry.scores.anger, 12);

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
