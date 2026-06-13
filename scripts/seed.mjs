// shared seed states for the screenshot and card harnesses.
// one trader, two depths: FULL (week two) and DEEP (week six — the day-40 story).

export const T_MORNING = new Date('2026-06-12T09:10:00');
export const T_EVENING = new Date('2026-06-12T17:30:00');

export const AUDIT = {
  answers: [3, 1, 2, 2, 3, 1, 1, 2, 3, 1, 1, 2, 1, 2, 1, 1],
  scores: { ego: 5, greed: 7, anger: 11, doubt: 4 },
  dominant: 'anger',
  seconded: 'greed',
  completedAt: '2026-06-03T18:20:00.000Z',
};

export const RULES = [
  { id: 'r1', libraryId: '07', title: 'The Fifteen', when: 'Any trade stops me out.', then: 'I start the circuit breaker and do not touch the platform until it ends.', noExceptions: '“The re-entry signal is valid right now.”', price: '$50 to charity, and the next session sat out entirely.' },
  { id: 'r2', libraryId: '08', title: 'The Shrinking Hand', when: 'I enter any trade within an hour of a loss.', then: 'I cut that trade’s size to half my standard — set before entry, not after.', noExceptions: '“I need full size to make it back.”', price: '$25 per breach, doubling on the same day.' },
  { id: 'r3', libraryId: '09', title: 'The Two-Loss Door', when: 'I take my second red trade of the day.', then: 'I close the platform and write the evening entry. The day is over.', noExceptions: '“The first one was just bad luck.”', price: '$100 to charity — the expensive one, because this is the expensive mistake.' },
  { id: 'r4', libraryId: '04', title: 'The Closing Bell', when: 'I hit my daily profit target.', then: 'I close the platform and write the evening entry, even at 10 a.m.', noExceptions: '“The market is unusually good today.”', price: 'Half that day’s profit to charity.' },
  { id: 'r5', libraryId: '05', title: 'The Counted Hand', when: 'I take my final allowed trade of the day.', then: 'I log out of the broker entirely — not minimized, logged out.', noExceptions: '“This next one is A-plus.”', price: '$50, and tomorrow’s max drops to one trade.' },
];

export const CONTRACT = {
  current: { version: 2, rules: RULES, signedName: 'Abe Alwan', signedAt: '2026-06-04T14:05:00.000Z' },
  history: [{ version: 1, rules: RULES, signedName: 'Abe Alwan', signedAt: '2026-06-04T13:00:00.000Z' }],
};

export function day(date, morning, evening) {
  const d = { date };
  if (morning) d.morning = { intention: morning[0], maxTrades: morning[1], maxRisk: morning[2], state: morning[3], at: `${date}T08:46:00.000Z` };
  if (evening) d.evening = { planFollowed: evening[0], trades: evening[1], breachedRuleIds: evening[2], honestLine: evening[3], at: `${date}T16:10:00.000Z` };
  return d;
}

export const DAYS_FULL = {
  '2026-06-04': day('2026-06-04', ['Trade the plan, nothing else.', 3, '$150', 'steady'], [true, 2, [], 'Followed the plan. Boring is the point.']),
  '2026-06-05': day('2026-06-05', ['No trades in the first ten minutes.', 3, '$150', 'patient'], [true, 3, [], 'Took all three. Stopped at three.']),
  // 06-08 missed — the gap stays
  '2026-06-09': day('2026-06-09', ['One good trade beats four fast ones.', 2, '$100', 'tight'], [false, 4, ['r1', 'r5'], 'Stopped out, went straight back in. Paid for it twice.']),
  '2026-06-10': day('2026-06-10', ['Repair day. Half size.', 2, '$75', 'humble'], [true, 1, [], 'One trade, half size, done.']),
  '2026-06-11': day('2026-06-11', ['Take only what the plan gives.', 3, '$150', 'patient'], [true, 2, [], 'Two clean entries. Left the third alone.']),
};

export const BREACHES = [
  { id: 'b1', date: '2026-06-09', ruleId: 'r1', ruleTitle: 'The Fifteen', price: '$50 to charity, and the next session sat out entirely.', paid: true, paidAt: '2026-06-09T20:00:00.000Z', source: 'evening' },
  { id: 'b2', date: '2026-06-09', ruleId: 'r5', ruleTitle: 'The Counted Hand', price: '$50, and tomorrow’s max drops to one trade.', paid: false, source: 'evening' },
];

export const SESSIONS = [
  { startedAt: '2026-06-10T15:02:00.000Z', endedAt: '2026-06-10T15:17:00.000Z', completed: true, note: 'Stopped out on the second test of the level.' },
];

export const SETTINGS = { name: 'Abe Alwan', avgTiltLoss: 300, baselineBreachesPerWeek: 3 };

export function ledgerState(over = {}) {
  return {
    schema: 1, access: true, auditDraft: null, audit: null, contract: null,
    settings: { name: '', avgTiltLoss: 0, baselineBreachesPerWeek: 0 },
    days: {}, breaches: [], breaker: { active: null, sessions: [] }, ...over,
  };
}

export const FULL = ledgerState({
  audit: AUDIT, contract: CONTRACT, settings: SETTINGS,
  days: DAYS_FULL, breaches: BREACHES, breaker: { active: null, sessions: SESSIONS },
});

// ---- the six-week trader: signed 2026-05-04, viewed 2026-06-12 (day 40) ----

const DEEP_CONTRACT = {
  current: { version: 2, rules: RULES, signedName: 'Abe Alwan', signedAt: '2026-05-18T14:05:00.000Z' },
  history: [{ version: 1, rules: RULES, signedName: 'Abe Alwan', signedAt: '2026-05-04T13:00:00.000Z' }],
};

// scripted six weeks: most days clean, breaches cluster on Mondays and on
// 'tight' mornings, two missed days, trades over max twice
const SCRIPT = [
  // [date, state-word, maxTrades, trades, breachedRuleIds, honest line]
  ['2026-05-04', 'steady', 3, 2, [], 'First day on the page. Two trades, both planned.'],
  ['2026-05-05', 'patient', 3, 3, [], 'Stopped at three. The bell works.'],
  ['2026-05-06', 'patient', 3, 1, [], 'One A setup. Left the rest.'],
  ['2026-05-07', 'tight', 2, 3, ['r5'], 'Took a fourth… third trade I had no business in.'],
  ['2026-05-08', 'humble', 2, 1, [], 'Half size after yesterday. Held the line.'],
  ['2026-05-11', 'tight', 3, 5, ['r1', 'r5'], 'Monday. Stopped out and went straight back in.'],
  ['2026-05-12', 'steady', 3, 2, [], 'Quiet day. Plan held.'],
  ['2026-05-13', 'patient', 3, 2, [], 'Two clean entries.'],
  // 05-14 missed
  ['2026-05-15', 'steady', 3, 3, [], 'Back on the page. Three and done.'],
  ['2026-05-18', 'anxious', 3, 4, ['r1'], 'Monday again. The fifteen would have saved me.'],
  ['2026-05-19', 'humble', 2, 1, [], 'Repair day.'],
  ['2026-05-20', 'patient', 3, 2, [], 'Let the bracket work for once.'],
  ['2026-05-21', 'patient', 3, 3, [], 'Three planned, three taken.'],
  ['2026-05-22', 'steady', 3, 2, [], 'Friday discipline held.'],
  ['2026-05-25', 'tight', 2, 2, ['r2'], 'Entered an hour after a loss at full size. Paid.'],
  ['2026-05-26', 'steady', 3, 2, [], 'Better. The breaker did its job at 11:04.'],
  ['2026-05-27', 'patient', 3, 1, [], 'One trade. It was enough.'],
  ['2026-05-28', 'patient', 3, 2, [], 'Clean.'],
  // 05-29 missed
  ['2026-06-01', 'steady', 3, 2, [], 'New month, same contract.'],
  ['2026-06-02', 'patient', 3, 3, [], 'Three and the bell.'],
  ['2026-06-03', 'patient', 3, 2, [], 'Nothing forced.'],
  ['2026-06-04', 'steady', 3, 2, [], 'Boring is the point.'],
  ['2026-06-05', 'patient', 3, 3, [], 'Three trades, then the bell. Kept the bell.'],
  ['2026-06-08', 'tight', 2, 4, ['r1', 'r5'], 'Monday. Same trap, same price. It is on the page now.'],
  ['2026-06-09', 'humble', 2, 1, [], 'Half size. One trade.'],
  ['2026-06-10', 'patient', 3, 2, [], 'The plan gave two. I took two.'],
  ['2026-06-11', 'patient', 3, 2, [], 'Two planned entries, nothing else. Quiet day.'],
  ['2026-06-12', 'patient', 3, 2, [], 'Took what the plan gave and closed the book.'],
];

const INTENTIONS = {
  steady: 'Trade the plan, nothing else.',
  patient: 'Take only what the plan gives.',
  tight: 'One good trade beats four fast ones.',
  humble: 'Repair day. Half size.',
  anxious: 'Slow hands today.',
};

const DEEP_DAYS = {};
const DEEP_BREACHES = [];
for (const [date, word, max, trades, breached, line] of SCRIPT) {
  DEEP_DAYS[date] = day(date, [INTENTIONS[word], max, '$150', word], [breached.length === 0, trades, breached, line]);
  for (const id of breached) {
    const r = RULES.find((x) => x.id === id);
    DEEP_BREACHES.push({
      id: `b-${date}-${id}`, date, ruleId: id, ruleTitle: r.title, price: r.price,
      paid: date < '2026-06-08', paidAt: date < '2026-06-08' ? `${date}T20:00:00.000Z` : undefined,
      source: 'evening',
    });
  }
}

const DEEP_SESSIONS = [
  { startedAt: '2026-05-11T15:02:00.000Z', endedAt: '2026-05-11T15:17:00.000Z', completed: true, note: 'Stopped out twice. Sat on my hands.' },
  { startedAt: '2026-05-26T15:31:00.000Z', endedAt: '2026-05-26T15:46:00.000Z', completed: true, note: 'Wanted the revenge trade. Watched the clock instead.' },
  { startedAt: '2026-06-08T14:48:00.000Z', endedAt: '2026-06-08T15:03:00.000Z', completed: true, note: 'Monday again. Held.' },
];

export const DEEP = ledgerState({
  audit: { ...AUDIT, completedAt: '2026-05-03T18:20:00.000Z' },
  contract: DEEP_CONTRACT,
  settings: SETTINGS,
  days: DEEP_DAYS,
  breaches: DEEP_BREACHES,
  breaker: { active: null, sessions: DEEP_SESSIONS },
});
