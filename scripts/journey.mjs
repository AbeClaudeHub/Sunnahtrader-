// THE LEDGER — end-to-end journey walkthrough, including edge cases:
// refresh mid-audit, soft gate, amendment versioning, breaker early-exit and
// completion, corrupt JSON import, exports with minimal data, persistence.

import { chromium } from 'playwright';
import http from 'http';
import { createReadStream, existsSync } from 'fs';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import os from 'os';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
};
const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/') p = '/index.html';
  let file = join(dist, p);
  if (!existsSync(file)) file = join(dist, 'index.html');
  res.setHeader('content-type', MIME[extname(file)] ?? 'application/octet-stream');
  createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(4398, r));
const BASE = 'http://localhost:4398';

let passed = 0;
let failed = 0;
function check(name, ok) {
  if (ok) { passed++; console.log(`  PASS  ${name}`); }
  else { failed++; console.log(`  FAIL  ${name}`); }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();
await page.clock.install({ time: new Date('2026-06-12T09:10:00') });

// ---- 1. the soft gate ----
console.log('— the soft gate');
await page.route('http://theledger.test/**', async (route) => {
  const url = new URL(route.request().url());
  const res = await fetch(`${BASE}${url.pathname}${url.search}`);
  const body = Buffer.from(await res.arrayBuffer());
  await route.fulfill({ status: res.status, headers: { 'content-type': res.headers.get('content-type') ?? '' }, body });
});
await page.goto('http://theledger.test/app');
// pre-release: hasAccess() returns true unconditionally. when the gate returns,
// restore this check to: locator('text=The Ledger is sealed.').isVisible()
check('pre-release bypass opens /app directly', await page.locator('nav.tabs').isVisible());
await page.goto('http://theledger.test/app?access=granted');
check('?access=granted opens the app', await page.locator('nav.tabs').isVisible());
await page.goto('http://theledger.test/app');
check('access persists without the param', await page.locator('nav.tabs').isVisible());
await page.evaluate(() => localStorage.clear());

// ---- 2. the audit, with a refresh mid-way ----
console.log('— the audit');
await page.goto(`${BASE}/app`);
check('first open lands on the audit intro', await page.locator('text=the ledger reads you').isVisible());
await page.getByRole('button', { name: 'Begin the audit' }).click();
check('question one shows 01 / 16', await page.locator('text=01 / 16').isVisible());
for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Most weeks' }).click();
await page.reload();
check('refresh mid-audit resumes at 04 / 16', await page.locator('text=04 / 16').isVisible());
for (let i = 3; i < 16; i++) {
  await page.getByRole('button', { name: i % 4 === 0 ? 'It’s a pattern' : 'Most weeks' }).click();
}
await page.waitForTimeout(300);
check('sixteen answers produce a verdict', await page.locator('.verdict-name').isVisible());
const saboteur = await page.locator('.verdict-name').textContent();
console.log(`        verdict: ${saboteur}`);
await page.locator('.verdict-retake').click();
check('one tap does not erase the verdict', await page.locator('.verdict-name').isVisible());
check('retake asks for the second tap', await page.locator('text=Tap again').isVisible());

// ---- 3. the contract: sign, then amend to v2 ----
console.log('— the contract');
await page.getByRole('button', { name: 'Write the contract' }).click();
check('builder seeds five rules', (await page.locator('.slot').count()) === 5);
await page.locator('label:has-text("Your name") input').fill('Test Trader');
await page.locator('label:has-text("average tilt loss") input').fill('250');
await page.locator('label:has-text("Rule-breaks per week") input').fill('2');
await page.getByRole('button', { name: 'Sign and seal' }).click();
check('signing produces the v1 document', await page.locator('text=The Contract · v1').isVisible());
check('the seal is stamped', await page.locator('.contract-doc svg').isVisible());
check('the signed page bridges to the first entry', await page.getByRole('button', { name: 'Make the first entry' }).isVisible());
await page.getByRole('button', { name: 'Make the first entry' }).click();
check('the bridge lands on the ledger', await page.locator('.ledger-first').isVisible());
await page.locator('nav.tabs button:has-text("Contract")').click();
await page.getByRole('button', { name: /Amend/ }).click();
await page.getByRole('button', { name: 'Sign and seal' }).click();
check('amendment becomes v2', await page.locator('text=The Contract · v2').isVisible());
check('v1 is kept in history', await page.locator('text=PRIOR VERSIONS: v1').isVisible());

// ---- 4. the daily ledger: morning, then evening with a breach ----
console.log('— the daily ledger');
await page.locator('nav.tabs button:has-text("Ledger")').click();
await page.locator('label:has-text("Intention") input').fill('Only the plan.');
await page.locator('.entry-form-pair label:has-text("Max trades") input').fill('3');
await page.locator('label:has-text("Max risk") input').fill('$150');
await page.locator('label:has-text("state, one word") input').fill('patient');
await page.getByRole('button', { name: 'Enter it in the ledger' }).click();
check('morning entry composes the check-in', await page.locator('.composed-body').first().textContent().then((t) => t?.includes('CHECK-IN') && t.includes('Only the plan.')));
await page.locator('.composed button:has-text("Copy for the room")').first().click();
await page.locator('text=Copied. Post it.').waitFor({ timeout: 2000 }).catch(() => {});
check('copy confirms', await page.locator('text=Copied. Post it.').isVisible());
await page.reload();
check('morning entry survives a refresh', await page.locator('text=“Only the plan.”').isVisible());
check('the first-entry lede stands down once the book is open', !(await page.locator('.ledger-first').isVisible()));
await page.locator('nav.tabs button:has-text("Contract")').click();
check('the contract bridge stands down too', !(await page.getByRole('button', { name: 'Make the first entry' }).isVisible()));
await page.locator('nav.tabs button:has-text("Ledger")').click();

await page.clock.fastForward(7 * 3600 * 1000); // to 16:10 — the close
await page.locator('nav.tabs button:has-text("Record")').click();
await page.locator('nav.tabs button:has-text("Ledger")').click();
check('after the close, the evening entry is the page', await page.locator('.ledger-section').first().locator('text=Post-market').isVisible());
await page.locator('.entry-yn-btn:has-text("Yes")').click();
await page.locator('label:has-text("Trades taken") input').fill('2');
await page.locator('.entry-rule').first().click(); // breach rule 01
await page.locator('label:has-text("One honest line") input').fill('Broke rule one. Paying tonight.');
await page.getByRole('button', { name: 'Close the day' }).click();
check('evening composes the close message', await page.locator('.composed-body').first().textContent().then((t) => t?.includes('CLOSE') && t.includes('Breached')));
check('the breach becomes a standing debt', await page.locator('.debt').isVisible());

// ---- 5. the circuit breaker: early exit logs a breach ----
console.log('— the circuit breaker');
const debtsBefore = await page.locator('.debt').count();
await page.getByRole('button', { name: 'Start the circuit breaker' }).click();
check('the takeover holds the screen', await page.locator('.breaker').isVisible());
check('exit demands the verbatim phrase', await page.getByRole('button', { name: 'Break the contract' }).isDisabled());
await page.locator('.breaker-exit-input').fill('I am choosing to break my contract');
await page.getByRole('button', { name: 'Break the contract' }).click();
check('early exit returns to the app', !(await page.locator('.breaker').isVisible()));
check('early exit logged a breach', (await page.locator('.debt').count()) === debtsBefore + 1);

// ---- 6. the breaker run to completion ----
await page.getByRole('button', { name: 'Start the circuit breaker' }).click();
await page.clock.fastForward(5 * 60 * 1000 + 1000);
check('step two asks for the one line', await page.locator('text=Name what just happened').isVisible());
await page.clock.fastForward(6 * 60 * 1000);
check('step three holds up the contract', await page.locator('text=What does your contract say?').isVisible());
await page.clock.fastForward(4 * 60 * 1000 + 2000);
check('fifteen minutes ends in the held screen', await page.locator('text=The breaker held').isVisible());
await page.getByRole('button', { name: 'Return to the ledger' }).click();
check('return lands back in the app', await page.locator('nav.tabs').isVisible());

// ---- 7. the record: exports, then corrupt import ----
console.log('— the record');
await page.locator('nav.tabs button:has-text("Record")').click();
check('integrity is computed', await page.locator('.record-hero-num').textContent().then((t) => /\d+\.\d/.test(t ?? '')));
const dl1 = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export JSON' }).click();
check('JSON export downloads', !!(await dl1));
const dl2 = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export text' }).click();
check('text export downloads', !!(await dl2));
const dl3 = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export the weekly card' }).click();
check('weekly card exports', !!(await dl3));

const tmp = join(os.tmpdir(), 'corrupt.json');
await fs.writeFile(tmp, '{ this is not json');
await page.locator('input[type=file]').setInputFiles(tmp);
await page.locator('text=not valid JSON').waitFor({ timeout: 3000 }).catch(() => {});
check('corrupt import is refused with a message', await page.locator('text=not valid JSON').isVisible());
check('the record survives the corrupt import', await page.locator('.record-hero-num').isVisible());

const tmp2 = join(os.tmpdir(), 'wrong.json');
await fs.writeFile(tmp2, JSON.stringify({ hello: 'world' }));
await page.locator('input[type=file]').setInputFiles(tmp2);
await page.locator('text=not a ledger record').waitFor({ timeout: 3000 }).catch(() => {});
check('non-ledger JSON is refused', await page.locator('text=not a ledger record').isVisible());

// round-trip: export state, wipe, import
const state = await page.evaluate(() => localStorage.getItem('the-ledger-v1'));
const tmp3 = join(os.tmpdir(), 'good.json');
await fs.writeFile(tmp3, state);
await page.evaluate(() => localStorage.clear());
await page.reload();
check('wiped storage returns to the audit', await page.locator('text=the ledger reads you').isVisible());
// reach the record importer requires data — import happens via the record; use the verdict path's storage directly
await page.evaluate((s) => localStorage.setItem('the-ledger-v1', s), JSON.stringify({ schema: 1, access: true, auditDraft: null, audit: null, contract: null, settings: { name: '', avgTiltLoss: 0, baselineBreachesPerWeek: 0 }, days: {}, breaches: [], breaker: { active: null, sessions: [] } }));
await page.reload();
await page.locator('nav.tabs button:has-text("Record")').click({ force: true }).catch(() => {});
// record is gated pre-audit; verify import through a fresh full state instead
await page.evaluate((s) => localStorage.setItem('the-ledger-v1', s), state);
await page.reload();
await page.locator('nav.tabs button:has-text("Record")').click();
check('round-tripped record restores integrity', await page.locator('.record-hero-num').textContent().then((t) => /\d+\.\d/.test(t ?? '')));
check('the book reads back the logged days', await page.locator('text=The book, day by day').isVisible());

// a valid import over a living record asks before replacing it
await page.locator('input[type=file]').setInputFiles(tmp3);
await page.locator('text=Replace the record').waitFor({ timeout: 3000 }).catch(() => {});
check('valid import over a living record asks first', await page.locator('text=Replace the record').isVisible());
await page.getByRole('button', { name: 'Keep what I have' }).click();
check('declining keeps the current record', await page.locator('text=The current record stands.').isVisible());
check('the record is untouched after declining', await page.locator('.record-hero-num').textContent().then((t) => /\d+\.\d/.test(t ?? '')));
await page.locator('input[type=file]').setInputFiles(tmp3);
await page.getByRole('button', { name: 'Replace the record' }).click();
check('confirming applies the import', await page.locator('text=The record is restored.').isVisible());

// ---- 8. breaker survives a refresh ----
console.log('— persistence under fire');
await page.getByRole('button', { name: 'Start the circuit breaker' }).click();
await page.reload();
check('the breaker survives a refresh', await page.locator('.breaker').isVisible());

await browser.close();
server.close();
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
