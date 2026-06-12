// dev tool: crop a region of a PNG for close inspection.
// usage: node scripts/crop.mjs <in.png> <out.png> <x> <y> <w> <h>

import { chromium } from 'playwright';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const [inFile, outFile, x, y, w, h] = process.argv.slice(2);
const data = readFileSync(resolve(inFile)).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
});
await page.setContent(
  `<body style="margin:0"><img src="data:image/png;base64,${data}" style="position:absolute;left:${-Number(x)}px;top:${-Number(y)}px"></body>`
);
await page.waitForTimeout(200);
await page.screenshot({ path: resolve(outFile) });
await browser.close();
console.log(`crop → ${outFile}`);
