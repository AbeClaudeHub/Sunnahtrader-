// THE LEDGER — screenshot harness for the scoring loop.
// serves dist/, seeds state, fakes the clock, captures every screen and state
// at 390×844 and 1440×900. usage: node scripts/shoot.mjs [outdir]

import { chromium } from 'playwright';
import http from 'http';
import { promises as fs } from 'fs';
import { createReadStream, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const outdir = join(here, '..', 'shots', process.argv[2] ?? 'loop');
await fs.mkdir(outdir, { recursive: true });

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json', '.json': 'application/json',
};

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  let file = join(dist, p);
  if (!existsSync(file)) file = join(dist, 'index.html'); // SPA fallback
  res.setHeader('content-type', MIME[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4399, r));
const BASE = 'http://localhost:4399';

// ---------- seed states ----------

const T_MORNING = new Date('2026-06-12T09:10:00');
const T_EVENING = new Date('2026-06-12T17:30:00');

const AUDIT = {
  answers: [3, 1, 2, 2, 3, 1, 1, 2, 3, 1, 1, 2, 1, 2, 1, 1],
  scores: { ego: 5, greed: 7, anger: 11, doubt: 4 },
  dominant: 'anger',
  seconded: 'greed',
  completedAt: '2026-06-03T18:20:00.000Z',
};

const RULES = [
  { id: 'r1', libraryId: '07', title: 'The Fifteen', when: 'Any trade stops me out.', then: 'I start the circuit breaker and do not touch the platform until it ends.', noExceptions: '“The re-entry signal is valid right now.”', price: '$50 to charity, and the next session sat out entirely.' },
  { id: 'r2', libraryId: '08', title: 'The Shrinking Hand', when: 'I enter any trade within an hour of a loss.', then: 'I cut that trade’s size to half my standard — set before entry, not after.', noExceptions: '“I need full size to make it back.”', price: '$25 per breach, doubling on the same day.' },
  { id: 'r3', libraryId: '09', title: 'The Two-Loss Door', when: 'I take my second red trade of the day.', then: 'I close the platform and write the evening entry. The day is over.', noExceptions: '“The first one was just bad luck.”', price: '$100 to charity — the expensive one, because this is the expensive mistake.' },
  { id: 'r4', libraryId: '04', title: 'The Closing Bell', when: 'I hit my daily profit target.', then: 'I close the platform and write the evening entry, even at 10 a.m.', noExceptions: '“The market is unusually good today.”', price: 'Half that day’s profit to charity.' },
  { id: 'r5', libraryId: '05', title: 'The Counted Hand', when: 'I take my final allowed trade of the day.', then: 'I log out of the broker entirely — not minimized, logged out.', noExceptions: '“This next one is A-plus.”', price: '$50, and tomorrow’s max drops to one trade.' },
];

const CONTRACT = {
  current: { version: 2, rules: RULES, signedName: 'Abe Alwan', signedAt: '2026-06-04T14:05:00.000Z' },
  history: [{ version: 1, rules: RULES, signedName: 'Abe Alwan', signedAt: '2026-06-04T13:00:00.000Z' }],
};

function day(date, morning, evening) {
  const d = { date };
  if (morning) d.morning = { intention: morning[0], maxTrades: morning[1], maxRisk: morning[2], state: morning[3], at: `${date}T08:46:00.000Z` };
  if (evening) d.evening = { planFollowed: evening[0], trades: evening[1], breachedRuleIds: evening[2], honestLine: evening[3], at: `${date}T16:10:00.000Z` };
  return d;
}

const DAYS_FULL = {
  '2026-06-04': day('2026-06-04', ['Trade the plan, nothing else.', 3, '$150', 'steady'], [true, 2, [], 'Followed the plan. Boring is the point.']),
  '2026-06-05': day('2026-06-05', ['No trades in the first ten minutes.', 3, '$150', 'patient'], [true, 3, [], 'Took all three. Stopped at three.']),
  // 06-08 missed — the gap stays
  '2026-06-09': day('2026-06-09', ['One good trade beats four fast ones.', 2, '$100', 'tight'], [false, 4, ['r1', 'r5'], 'Stopped out, went straight back in. Paid for it twice.']),
  '2026-06-10': day('2026-06-10', ['Repair day. Half size.', 2, '$75', 'humble'], [true, 1, [], 'One trade, half size, done.']),
  '2026-06-11': day('2026-06-11', ['Take only what the plan gives.', 3, '$150', 'patient'], [true, 2, [], 'Two clean entries. Left the third alone.']),
};

const BREACHES = [
  { id: 'b1', date: '2026-06-09', ruleId: 'r1', ruleTitle: 'The Fifteen', price: '$50 to charity, and the next session sat out entirely.', paid: true, paidAt: '2026-06-09T20:00:00.000Z', source: 'evening' },
  { id: 'b2', date: '2026-06-09', ruleId: 'r5', ruleTitle: 'The Counted Hand', price: '$50, and tomorrow’s max drops to one trade.', paid: false, source: 'evening' },
];

const SESSIONS = [
  { startedAt: '2026-06-10T15:02:00.000Z', endedAt: '2026-06-10T15:17:00.000Z', completed: true, note: 'Stopped out on the second test of the level.' },
];

const SETTINGS = { name: 'Abe Alwan', avgTiltLoss: 300, baselineBreachesPerWeek: 3 };

function ledgerState(over = {}) {
  return {
    schema: 1, access: true, auditDraft: null, audit: null, contract: null,
    settings: { name: '', avgTiltLoss: 0, baselineBreachesPerWeek: 0 },
    days: {}, breaches: [], breaker: { active: null, sessions: [] }, ...over,
  };
}

const FULL = ledgerState({
  audit: AUDIT, contract: CONTRACT, settings: SETTINGS,
  days: DAYS_FULL, breaches: BREACHES, breaker: { active: null, sessions: SESSIONS },
});

const breakerActive = (minAgo) =>
  ({ ...FULL, breaker: { active: { startedAt: new Date(T_MORNING.getTime() - minAgo * 60000).toISOString(), note: minAgo > 5 ? 'Stopped out on the level I planned. It held the third time.' : undefined }, sessions: SESSIONS } });

// morning state: full history but today not yet logged
const { ['2026-06-12']: _none, ...daysNoToday } = DAYS_FULL;
const MORNING_BLANK = { ...FULL, days: daysNoToday };
const MORNING_DONE = {
  ...FULL,
  days: { ...daysNoToday, '2026-06-12': day('2026-06-12', ['Take only what the plan gives.', 3, '$150', 'patient'], null) },
};
const EVENING_FORM = MORNING_DONE;
const EVENING_DONE = {
  ...FULL,
  days: { ...daysNoToday, '2026-06-12': day('2026-06-12', ['Take only what the plan gives.', 3, '$150', 'patient'], [true, 2, [], 'Forced nothing. Took the A setup, left.']) },
};

// ---------- shot list ----------

const SHOTS = [
  { name: 'sales-hero', url: '/', state: null, time: T_MORNING },
  { name: 'sales-full', url: '/', state: null, time: T_MORNING, fullPage: true },
  { name: 'gate-sealed', url: '/app', state: null, time: T_MORNING, host: 'theledger.test' },
  { name: 'audit-intro', url: '/app', state: ledgerState({ access: true }), time: T_MORNING },
  { name: 'audit-q01', url: '/app', state: ledgerState({ access: true, auditDraft: { answers: Array(16).fill(null), index: 0 } }), time: T_MORNING },
  { name: 'audit-q09-chosen', url: '/app', state: ledgerState({ access: true, auditDraft: { answers: [3, 1, 2, 2, 3, 1, 1, 2, 3, null, null, null, null, null, null, null], index: 8 } }), time: T_MORNING },
  { name: 'verdict', url: '/app', state: ledgerState({ access: true, audit: AUDIT }), time: T_MORNING, settle: 1400, tab: 'Audit' },
  { name: 'verdict-scrolled', url: '/app', state: ledgerState({ access: true, audit: AUDIT }), time: T_MORNING, settle: 1400, tab: 'Audit', scrollTo: 'bottom' },
  { name: 'contract-builder', url: '/app', state: ledgerState({ access: true, audit: AUDIT }), time: T_MORNING },
  { name: 'contract-signed', url: '/app', state: FULL, time: T_MORNING, tab: 'Contract' },
  { name: 'contract-signed-foot', url: '/app', state: FULL, time: T_MORNING, tab: 'Contract', scrollTo: 'bottom' },
  { name: 'ledger-morning-form', url: '/app', state: MORNING_BLANK, time: T_MORNING },
  { name: 'ledger-morning-done', url: '/app', state: MORNING_DONE, time: T_MORNING },
  { name: 'ledger-evening-form', url: '/app', state: EVENING_FORM, time: T_EVENING },
  { name: 'ledger-evening-done', url: '/app', state: EVENING_DONE, time: T_EVENING },
  { name: 'ledger-empty-nocontract', url: '/app', state: ledgerState({ access: true, audit: AUDIT, auditDraft: null, contract: CONTRACT }), time: T_MORNING },
  { name: 'breaker-step1', url: '/app', state: breakerActive(2.3), time: T_MORNING },
  { name: 'breaker-step2', url: '/app', state: breakerActive(6), time: T_MORNING },
  { name: 'breaker-step3', url: '/app', state: breakerActive(11), time: T_MORNING },
  { name: 'breaker-exit-zone', url: '/app', state: breakerActive(2.3), time: T_MORNING, scrollTo: 'bottom' },
  { name: 'breaker-done', url: '/app', state: breakerActive(15.2), time: T_MORNING },
  { name: 'record-full', url: '/app', state: FULL, time: T_EVENING, tab: 'Record' },
  { name: 'record-full-foot', url: '/app', state: FULL, time: T_EVENING, tab: 'Record', scrollTo: 'bottom' },
  { name: 'record-empty', url: '/app', state: ledgerState({ access: true }), time: T_MORNING, tab: 'Record', skipTabCheck: true },
];

const VIEWPORTS = [
  { tag: '390x844', width: 390, height: 844 },
  { tag: '1440x900', width: 1440, height: 900 },
];

const browser = await chromium.launch();

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
  });

  for (const shot of SHOTS) {
    const page = await ctx.newPage();
    await page.clock.install({ time: shot.time });

    let base = BASE;
    if (shot.host) {
      base = `http://${shot.host}`;
      await page.route(`http://${shot.host}/**`, async (route) => {
        const url = new URL(route.request().url());
        const res = await fetch(`${BASE}${url.pathname}${url.search}`);
        const body = Buffer.from(await res.arrayBuffer());
        await route.fulfill({ status: res.status, headers: { 'content-type': res.headers.get('content-type') ?? '' }, body });
      });
    }

    if (shot.state) {
      const json = JSON.stringify(shot.state);
      await page.addInitScript((s) => localStorage.setItem('the-ledger-v1', s), json);
    }

    await page.goto(`${base}${shot.url}`);
    await page.evaluate(() => document.fonts.ready);

    if (shot.tab) {
      const tabBtn = page.locator(`nav.tabs button:has-text("${shot.tab}")`);
      if (shot.skipTabCheck) {
        await tabBtn.click({ force: true }).catch(() => {});
      } else {
        await tabBtn.click();
      }
    }
    if (shot.click) await page.locator(shot.click).click();
    await page.waitForTimeout(shot.settle ?? 500);

    if (shot.scrollTo === 'bottom') {
      await page.evaluate(() => {
        const breaker = document.querySelector('.breaker');
        if (breaker) breaker.scrollTo(0, breaker.scrollHeight);
        else window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: join(outdir, `${shot.name}-${vp.tag}.png`),
      fullPage: shot.fullPage ?? false,
    });
    console.log(`shot: ${shot.name} @ ${vp.tag}`);
    await page.close();
  }
  await ctx.close();
}

await browser.close();
server.close();
console.log(`done → ${outdir}`);
