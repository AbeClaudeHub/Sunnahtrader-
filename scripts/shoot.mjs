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

// ---------- seed states (shared with cards.mjs) ----------

import {
  T_MORNING, T_EVENING, AUDIT, CONTRACT, DAYS_FULL, SESSIONS, FULL, DEEP,
  day, ledgerState,
} from './seed.mjs';

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
  { name: 'record-empty', url: '/app', state: ledgerState({ access: true, audit: AUDIT }), time: T_MORNING, tab: 'Record' },
  { name: 'record-deep', url: '/app', state: DEEP, time: T_EVENING, tab: 'Record' },
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
