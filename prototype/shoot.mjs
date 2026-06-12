import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const pages = ['verdict', 'ledger', 'breaker'];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

for (const name of pages) {
  const page = await ctx.newPage();
  await page.goto('file://' + join(here, `${name}.html`));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.screenshot({ path: join(here, 'shots', `${name}-390x844.png`) });
  console.log(`shot: ${name}`);
  await page.close();
}

await browser.close();
