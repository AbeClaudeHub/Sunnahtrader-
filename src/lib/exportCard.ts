// the three export cards — engraved certificates, drawn by hand on canvas.
// 1080×1350 (4:5), the four colors only, measured layout: nothing may collide,
// nothing may orphan. these are the artifacts people post into rooms.

import type { LedgerState } from '../store/types';
import { SABOTEUR_NAMES } from '../content/profiles';
import { longDate, formatMoney, weekRangeLabel } from './dates';
import { integrityScore, daysUnderContract, type WeekSummary } from './stats';

const INK = '#0F0D09';
const PAPER = '#F0E9DB';
const GOLD = '#C2A14D';
const WAX = '#7A2E1F';
const W = 1080;
const H = 1350;
const MX = 120; // content margin
const CW = W - MX * 2; // content width

const paperA = (a: number) => `rgba(240,233,219,${a})`;
const inkA = (a: number) => `rgba(15,13,9,${a})`;

async function readyCanvas(): Promise<CanvasRenderingContext2D> {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('560 230px Fraunces'),
    document.fonts.load('italic 400 44px Fraunces'),
    document.fonts.load('italic 460 52px Fraunces'),
    document.fonts.load('500 28px Inter'),
    document.fonts.load('600 30px Inter'),
  ]);
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas unavailable');
  return ctx;
}

function seededRand(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** real tracking where the browser supports it; silently nothing where it doesn't */
function track(ctx: CanvasRenderingContext2D, px: number) {
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${px}px`;
  } catch {
    // older engines: untracked text is acceptable
  }
}

/** the paper itself — seeded grain, the single texture, same 5% as the app */
function grain(ctx: CanvasRenderingContext2D, onInk: boolean) {
  const rand = seededRand(97);
  const size = 180;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  if (!tctx) return;
  const img = tctx.createImageData(size, size);
  const [r, g, b] = onInk ? [240, 233, 219] : [15, 13, 9];
  for (let i = 0; i < img.data.length; i += 4) {
    img.data[i] = r;
    img.data[i + 1] = g;
    img.data[i + 2] = b;
    img.data[i + 3] = Math.floor(rand() * 36); // ≤14% per speck, most far lower
  }
  tctx.putImageData(img, 0, 0);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (!pattern) return;
  ctx.save();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** the engraved plate border — heavy outer rule, hairline inner */
function plate(ctx: CanvasRenderingContext2D, onInk: boolean) {
  ctx.strokeStyle = onInk ? paperA(0.55) : INK;
  ctx.lineWidth = onInk ? 2 : 3;
  ctx.strokeRect(44, 44, W - 88, H - 88);
  ctx.strokeStyle = onInk ? paperA(0.3) : inkA(0.55);
  ctx.lineWidth = 1;
  ctx.strokeRect(58, 58, W - 116, H - 116);
}

function rule(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  color: string,
  width = 1
) {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
}

function tremorLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  amp: number,
  rand: () => number
) {
  const segs = 6;
  ctx.beginPath();
  ctx.moveTo(x1, y + (rand() - 0.5) * 2 * amp);
  for (let i = 1; i <= segs; i++) {
    const x = x1 + ((x2 - x1) * i) / segs;
    ctx.lineTo(x, y + (rand() - 0.5) * 2 * amp);
  }
  ctx.stroke();
}

/** masthead: tracked label left, dated mono right, ruled beneath */
function masthead(ctx: CanvasRenderingContext2D, onInk: boolean, left: string, right: string) {
  ctx.textAlign = 'left';
  ctx.fillStyle = onInk ? paperA(0.6) : inkA(0.6);
  ctx.font = '500 26px Inter';
  track(ctx, 3.6);
  ctx.fillText(left, MX, 150);
  track(ctx, 0);
  if (right) {
    ctx.fillStyle = onInk ? paperA(0.5) : inkA(0.55);
    ctx.font = '400 24px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'right';
    track(ctx, 1.5);
    ctx.fillText(right, W - MX, 150);
    track(ctx, 0);
    ctx.textAlign = 'left';
  }
  rule(ctx, MX, W - MX, 178, onInk ? paperA(0.35) : inkA(0.4));
}

function footer(ctx: CanvasRenderingContext2D, onInk: boolean) {
  rule(ctx, MX, W - MX, H - 128, onInk ? paperA(0.35) : inkA(0.4));
  ctx.fillStyle = onInk ? paperA(0.7) : inkA(0.7);
  ctx.font = '500 26px Inter';
  ctx.textAlign = 'left';
  track(ctx, 3.6);
  ctx.fillText('THE LEDGER', MX, H - 80);
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'right';
  ctx.fillText('NIYYAH', W - MX, H - 80);
  track(ctx, 0);
  ctx.textAlign = 'left';
}

function download(ctx: CanvasRenderingContext2D, filename: string) {
  ctx.canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, 'image/png');
}

// ---------------------------------------------------------------- verdict

export async function exportVerdictCard(state: LedgerState): Promise<void> {
  const audit = state.audit;
  if (!audit) return;
  const ctx = await readyCanvas();

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, true);
  plate(ctx, true);

  masthead(ctx, true, 'THE AUDIT — VERDICT', longDate(new Date(audit.completedAt)));

  // preline + the name, engraved large
  ctx.fillStyle = paperA(0.75);
  ctx.font = 'italic 400 44px Fraunces';
  ctx.fillText('The ledger has read you.', MX, 330);

  ctx.fillStyle = PAPER;
  ctx.font = '560 230px Fraunces';
  // display caps hang a shade left of the measure — optical, not arithmetic
  ctx.fillText(SABOTEUR_NAMES[audit.dominant], MX - 8, 562);

  ctx.font = '500 26px Inter';
  track(ctx, 3.6);
  ctx.fillStyle = paperA(0.6);
  const sub = 'DOMINANT SABOTEUR · SECONDED BY ';
  ctx.fillText(sub, MX, 642);
  const subW = ctx.measureText(sub).width;
  ctx.fillStyle = GOLD;
  ctx.fillText(SABOTEUR_NAMES[audit.seconded], MX + subW, 642);
  track(ctx, 0);

  // gauges — one tremor line per point scored, resting on a ruled baseline
  const rand = seededRand(7);
  const order = ['ego', 'greed', 'anger', 'doubt'] as const;
  const colW = CW / 4;
  const baseY = 1044;
  const step = 22;
  const lineW = 150;

  order.forEach((s, i) => {
    const cx = MX + colW * i + colW / 2;
    const score = audit.scores[s];
    const dominant = s === audit.dominant;

    ctx.fillStyle = dominant ? GOLD : paperA(0.6);
    ctx.font = '400 34px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(score), cx, baseY - score * step - 28);

    ctx.strokeStyle = dominant ? PAPER : paperA(0.5);
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (let p = 1; p <= score; p++) {
      tremorLine(ctx, cx - lineW / 2, cx + lineW / 2, baseY - p * step, 2.6, rand);
    }

    ctx.fillStyle = dominant ? PAPER : paperA(0.5);
    ctx.font = '500 28px Inter';
    track(ctx, 3.2);
    ctx.fillText(SABOTEUR_NAMES[s], cx, baseY + 56);
    track(ctx, 0);
  });
  ctx.textAlign = 'left';

  // the baseline, with engraver's end ticks
  ctx.lineCap = 'butt';
  rule(ctx, MX, W - MX, baseY, paperA(0.45));
  ctx.strokeStyle = paperA(0.45);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(MX, baseY - 7);
  ctx.lineTo(MX, baseY + 7);
  ctx.moveTo(W - MX, baseY - 7);
  ctx.lineTo(W - MX, baseY + 7);
  ctx.stroke();

  footer(ctx, true);
  download(ctx, `the-ledger-verdict-${audit.dominant}.png`);
}

// ---------------------------------------------------------------- contract

interface Run {
  text: string;
  k?: boolean; // a small-caps keyword run
}

/**
 * wraps mixed keyword/body runs at word boundaries inside a width.
 * when draw=false it only measures. returns the y after the last line.
 */
function richWrap(
  ctx: CanvasRenderingContext2D,
  runs: Run[],
  x: number,
  y: number,
  maxWidth: number,
  s: number,
  draw: boolean
): number {
  const bodyFont = `400 ${Math.round(25 * s)}px Inter`;
  const kFont = `600 ${Math.round(20 * s)}px Inter`;
  const leading = 33 * s;
  let cx = x;
  let cy = y;
  for (const run of runs) {
    const words = run.text.split(/\s+/).filter(Boolean);
    ctx.font = run.k ? kFont : bodyFont;
    if (run.k) track(ctx, 1.6 * s);
    for (const word of words) {
      const piece = cx === x ? word : ' ' + word;
      const w = ctx.measureText(piece).width;
      if (cx + w > x + maxWidth && cx > x) {
        cy += leading;
        cx = x;
        const w2 = ctx.measureText(word).width;
        if (draw) {
          ctx.fillStyle = run.k ? inkA(0.55) : inkA(0.82);
          ctx.fillText(word, cx, cy);
        }
        cx += w2;
      } else {
        if (draw) {
          ctx.fillStyle = run.k ? inkA(0.55) : inkA(0.82);
          ctx.fillText(piece, cx, cy);
        }
        cx += w;
      }
    }
    if (run.k) track(ctx, 0);
  }
  return cy;
}

function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const rand = seededRand(31);
  // irregular wax blob — curved through the bumps so the edge reads as poured, not cut
  ctx.fillStyle = WAX;
  const bumps = 16;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    const rr = r * (0.93 + rand() * 0.12);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  ctx.beginPath();
  const mid = (p: [number, number], q: [number, number]): [number, number] => [
    (p[0] + q[0]) / 2,
    (p[1] + q[1]) / 2,
  ];
  let m = mid(pts[bumps - 1], pts[0]);
  ctx.moveTo(m[0], m[1]);
  for (let i = 0; i < bumps; i++) {
    const next = pts[(i + 1) % bumps];
    m = mid(pts[i], next);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m[0], m[1]);
  }
  ctx.closePath();
  ctx.fill();
  // inner ring + monogram
  ctx.strokeStyle = paperA(0.85);
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = PAPER;
  ctx.font = `560 ${Math.round(r * 0.72)}px Fraunces`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', cx, cy + r * 0.04);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

export async function exportContractDoc(state: LedgerState): Promise<void> {
  const c = state.contract;
  if (!c) return;
  const ctx = await readyCanvas();

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, false);
  plate(ctx, false);

  masthead(ctx, false, `THE CONTRACT — V${c.current.version}`, longDate(new Date(c.current.signedAt)));

  ctx.fillStyle = INK;
  ctx.font = '560 64px Fraunces';
  ctx.textAlign = 'center';
  ctx.fillText('Five Rules. No Exceptions.', W / 2, 268);
  ctx.textAlign = 'left';

  // the rules must fit between the title and the signature — measure, then
  // step the scale down until they do. the signature block is reserved ground.
  const top = 348;
  const sigTop = H - 318;
  const bodyX = 176;
  const bodyW = W - MX - bodyX;

  const layout = (s: number, draw: boolean): number => {
    let y = top;
    c.current.rules.forEach((r, i) => {
      if (draw) {
        ctx.fillStyle = inkA(0.5);
        ctx.font = `400 ${Math.round(24 * s)}px ui-monospace, Menlo, monospace`;
        ctx.fillText(String(i + 1).padStart(2, '0'), MX, y);
        ctx.fillStyle = INK;
        ctx.font = `560 ${Math.round(36 * s)}px Fraunces`;
        ctx.fillText(r.title, bodyX, y);
      }
      y += 42 * s;
      y = richWrap(
        ctx,
        [
          { text: 'WHEN', k: true },
          { text: r.when },
          { text: ' THEN', k: true },
          { text: r.then },
          { text: ' NO EXCEPTIONS, INCLUDING', k: true },
          { text: r.noExceptions },
          { text: ' THE PRICE', k: true },
          { text: r.price },
        ],
        bodyX,
        y,
        bodyW,
        s,
        draw
      );
      y += 20 * s;
      if (i < c.current.rules.length - 1) {
        if (draw) rule(ctx, MX, W - MX, y, inkA(0.3));
        y += 40 * s;
      }
    });
    return y;
  };

  let scale = 1;
  while (scale > 0.66 && layout(scale, false) > sigTop - 24) scale -= 0.02;
  layout(scale, true);

  // signature ground
  rule(ctx, MX, W - MX, sigTop, inkA(0.4));
  const sy = sigTop + 92;
  ctx.fillStyle = INK;
  ctx.font = 'italic 460 52px Fraunces';
  ctx.fillText(c.current.signedName, 144, sy);
  rule(ctx, 144, 600, sy + 18, INK);
  ctx.fillStyle = inkA(0.6);
  ctx.font = '400 23px ui-monospace, Menlo, monospace';
  track(ctx, 1.5);
  ctx.fillText(`SIGNED ${longDate(new Date(c.current.signedAt))}`, 144, sy + 56);
  track(ctx, 0);

  drawSeal(ctx, W - 224, sigTop + 80, 70);

  footer(ctx, false);
  download(ctx, `the-ledger-contract-v${c.current.version}.png`);
}

// ---------------------------------------------------------------- weekly

export async function exportWeeklyCard(state: LedgerState, week: WeekSummary): Promise<void> {
  const ctx = await readyCanvas();

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  grain(ctx, true);
  plate(ctx, true);

  const monday = week.dayMarks[0]?.iso ?? week.fridayISO;
  masthead(ctx, true, 'THE WEEKLY LEDGER', weekRangeLabel(monday, week.fridayISO, true));

  // hero: integrity — the system sets numerals in mono, here as everywhere
  ctx.fillStyle = PAPER;
  ctx.font = '400 190px ui-monospace, Menlo, monospace';
  const integ = week.integrity != null ? week.integrity.toFixed(1) : '—';
  ctx.fillText(integ, MX - 6, 438);
  ctx.fillStyle = paperA(0.6);
  ctx.font = '500 28px Inter';
  track(ctx, 3.6);
  ctx.fillText('INTEGRITY / 100', MX, 506);
  track(ctx, 0);

  // the week, as ledger ticks: one paper tick per kept day, one wax tick per
  // breach (count them — the strip must agree with the table), gaps stay gaps
  const strip = { baseY: 628, gap: 100, x0: MX + 14 };
  const letters = ['M', 'T', 'W', 'T', 'F'];
  rule(ctx, MX, strip.x0 + strip.gap * 4 + 14, strip.baseY, paperA(0.45));
  week.dayMarks.forEach((m, i) => {
    const x = strip.x0 + strip.gap * i;
    if (m.logged) {
      const n = m.breached ? Math.min(m.breachCount, 3) : 1;
      ctx.strokeStyle = m.breached ? WAX : PAPER;
      ctx.lineWidth = 3.5;
      for (let t = 0; t < n; t++) {
        const tx = x + (t - (n - 1) / 2) * 12;
        ctx.beginPath();
        ctx.moveTo(tx, strip.baseY);
        ctx.lineTo(tx, strip.baseY - 36);
        ctx.stroke();
      }
    }
    ctx.fillStyle = paperA(0.45);
    ctx.font = '400 22px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(letters[i], x, strip.baseY + 40);
    ctx.textAlign = 'left';
  });

  // the week's last honest line — the human voice on the certificate
  const honest = [...week.dayMarks]
    .reverse()
    .map((m) => state.days[m.iso]?.evening?.honestLine)
    .find((l) => l && l.trim().length > 0);
  if (honest) {
    ctx.fillStyle = paperA(0.85);
    ctx.font = 'italic 400 40px Fraunces';
    const quoted = `“${honest}”`;
    // wrap to at most two lines
    const words = quoted.split(' ');
    let line = '';
    let cy = 742;
    let lines = 0;
    for (const word of words) {
      const test = line ? line + ' ' + word : word;
      if (ctx.measureText(test).width > CW && line) {
        if (lines === 1) {
          // second line full: end it with an ellipsis
          while (ctx.measureText(line + '…”').width > CW && line.includes(' ')) {
            line = line.slice(0, line.lastIndexOf(' '));
          }
          line += '…”';
          break;
        }
        ctx.fillText(line, MX, cy);
        cy += 54;
        lines += 1;
        line = word;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, MX, cy);
  }

  // rows on ruled lines
  const name = state.settings.name || state.contract?.current.signedName || '';
  const rows: Array<{ label: string; value: string; mono: boolean; wax: boolean }> = [
    { label: 'TRADER', value: name.toUpperCase(), mono: false, wax: false },
    { label: 'DAYS LOGGED', value: `${week.daysLogged} / ${week.marketDays}`, mono: true, wax: false },
    { label: 'TRADES TAKEN', value: String(week.tradesTotal), mono: true, wax: false },
    { label: 'RULES CLEAN', value: `${week.cleanRules} / ${week.ruleCount}`, mono: true, wax: false },
    {
      label: 'BREACHES',
      value: week.breaches.length === 0 ? 'NONE' : String(week.breaches.length),
      mono: true,
      wax: week.breaches.length > 0,
    },
  ];

  let y = 856;
  for (const r of rows) {
    ctx.fillStyle = paperA(0.6);
    ctx.font = '500 26px Inter';
    track(ctx, 3.2);
    ctx.fillText(r.label, MX, y);
    track(ctx, 0);
    ctx.textAlign = 'right';
    if (r.mono) {
      ctx.fillStyle = PAPER;
      ctx.font = '400 38px ui-monospace, Menlo, monospace';
      ctx.fillText(r.value, W - MX, y + 4);
    } else {
      ctx.fillStyle = PAPER;
      ctx.font = '600 28px Inter';
      track(ctx, 3.2);
      ctx.fillText(r.value, W - MX, y);
      track(ctx, 0);
    }
    if (r.wax) {
      // wax never sets small type on ink — it underscores the figure instead
      const vw = ctx.measureText(r.value).width;
      rule(ctx, W - MX - vw, W - MX, y + 18, WAX, 3);
    }
    ctx.textAlign = 'left';
    rule(ctx, MX, W - MX, y + 28, paperA(0.3));
    y += 68;
  }

  const total = integrityScore(state);
  const standing: string[] = [];
  if (total != null) standing.push(`ALL-TIME INTEGRITY ${total.toFixed(1)}`);
  const dayNo = daysUnderContract(state);
  if (dayNo > 0) standing.push(`DAY ${dayNo} UNDER CONTRACT`);
  if (standing.length > 0) {
    ctx.fillStyle = paperA(0.5);
    ctx.font = '400 24px ui-monospace, Menlo, monospace';
    track(ctx, 1.5);
    ctx.fillText(standing.join(' · '), MX, y);
    track(ctx, 0);
  }

  footer(ctx, true);
  download(ctx, `the-ledger-week-${week.fridayISO}.png`);
}

// ---------------------------------------------------------------- text record

export function exportTextRecord(state: LedgerState): string {
  const lines: string[] = ['THE LEDGER — FULL RECORD', ''];
  const days = Object.values(state.days).sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const d of days) {
    lines.push(`— ${d.date}`);
    if (d.morning) {
      lines.push(
        `  AM  intention: ${d.morning.intention} · max ${d.morning.maxTrades} · risk ${d.morning.maxRisk} · ${d.morning.state}`
      );
    }
    if (d.evening) {
      lines.push(
        `  PM  plan ${d.evening.planFollowed ? 'followed' : 'broken'} · trades ${d.evening.trades} · breaches ${d.evening.breachedRuleIds.length} · "${d.evening.honestLine}"`
      );
    }
    if (!d.morning && !d.evening) lines.push('  (empty)');
  }
  if (days.length === 0) lines.push('(no entries)');
  lines.push('');
  lines.push('BREACHES');
  if (state.breaches.length === 0) lines.push('(none)');
  for (const b of state.breaches) {
    lines.push(`  ${b.date} · ${b.ruleTitle} · ${b.price} · ${b.paid ? 'paid' : 'OWED'}`);
  }
  const integ = integrityScore(state);
  lines.push('');
  lines.push(`INTEGRITY ${integ != null ? integ.toFixed(1) + ' / 100' : '—'}`);
  if (state.settings.avgTiltLoss > 0) {
    lines.push(`STATED AVG TILT LOSS ${formatMoney(state.settings.avgTiltLoss)}`);
  }
  return lines.join('\n');
}

export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
