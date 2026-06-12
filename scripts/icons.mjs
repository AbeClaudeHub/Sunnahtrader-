// renders the seal-on-ink app icon at 192 and 512 via Playwright
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const here = dirname(fileURLToPath(import.meta.url));
const html = (size) => `<!DOCTYPE html><html><body style="margin:0">
<div style="width:${size}px;height:${size}px;background:#0F0D09;display:flex;align-items:center;justify-content:center">
<svg width="${size * 0.62}" height="${size * 0.62}" viewBox="0 0 64 64">
  <path d="M32 3.5 C 46.5 2.5, 61.5 16, 60.5 32.5 C 59.6 48.5, 46.5 61.2, 31.4 60.4 C 16.6 59.6, 3.4 47.3, 4.1 31.6 C 4.8 16.4, 17.8 4.5, 32 3.5 Z" fill="#7A2E1F"/>
  <circle cx="32" cy="32" r="19" fill="none" stroke="rgba(240,233,219,0.85)" stroke-width="1.5"/>
  <text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Georgia, serif" font-size="24" font-weight="600" fill="#F0E9DB">N</text>
</svg></div></body></html>`;

const browser = await chromium.launch();
for (const size of [192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(html(size));
  await page.screenshot({ path: join(here, '..', 'public', `icon-${size}.png`) });
  await page.close();
}
await browser.close();
console.log('icons drawn');
