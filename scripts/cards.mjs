// THE LEDGER — renders the three PNG export cards (verdict, contract, weekly)
// through the real in-app export paths and saves them for the scoring loop.
// usage: node scripts/cards.mjs [outdir]   (defaults to shots/cards)

import { chromium } from 'playwright';
import http from 'http';
import { promises as fs } from 'fs';
import { createReadStream, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');
const outdir = join(here, '..', 'shots', process.argv[2] ?? 'cards');
await fs.mkdir(outdir, { recursive: true });

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
await new Promise((r) => server.listen(4397, r));
const BASE = 'http://localhost:4397';

// the six-week trader — the cards should show the day-40 story
import { DEEP } from './seed.mjs';
const STATE = DEEP;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.clock.install({ time: new Date('2026-06-12T17:30:00') });
await page.addInitScript((s) => localStorage.setItem('the-ledger-v1', s), JSON.stringify(STATE));
await page.goto(`${BASE}/app`);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(400);

async function grab(name, trigger) {
  const dl = page.waitForEvent('download');
  await trigger();
  const file = await dl;
  await file.saveAs(join(outdir, `${name}.png`));
  console.log(`card: ${name}`);
}

// verdict card — from the audit tab
await page.locator('nav.tabs button:has-text("Audit")').click();
await page.waitForTimeout(1600);
await grab('card-verdict', () => page.getByRole('button', { name: 'Export the card' }).click());

// contract document — from the contract tab
await page.locator('nav.tabs button:has-text("Contract")').click();
await page.waitForTimeout(400);
await grab('card-contract', () => page.getByRole('button', { name: 'Export the document' }).click());

// weekly card — from the record tab
await page.locator('nav.tabs button:has-text("Record")').click();
await page.waitForTimeout(400);
await grab('card-weekly', () => page.getByRole('button', { name: 'Export the weekly card' }).click());

await browser.close();
server.close();
console.log(`done → ${outdir}`);
