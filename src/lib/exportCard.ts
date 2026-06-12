import type { LedgerState } from '../store/types';
import { SABOTEUR_NAMES } from '../content/profiles';
import { longDate, formatMoney } from './dates';
import { integrityScore, daysUnderContract, type WeekSummary } from './stats';

const INK = '#0F0D09';
const PAPER = '#F0E9DB';
const GOLD = '#C2A14D';
const WAX = '#7A2E1F';
const W = 1080;
const H = 1350;

async function readyCanvas(): Promise<CanvasRenderingContext2D> {
  await document.fonts.ready;
  await Promise.all([
    document.fonts.load('560 240px Fraunces'),
    document.fonts.load('italic 400 44px Fraunces'),
    document.fonts.load('500 28px Inter'),
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

function footer(ctx: CanvasRenderingContext2D, onInk: boolean) {
  ctx.strokeStyle = onInk ? 'rgba(240,233,219,0.4)' : 'rgba(15,13,9,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, H - 110);
  ctx.lineTo(W - 96, H - 110);
  ctx.stroke();
  ctx.fillStyle = onInk ? 'rgba(240,233,219,0.7)' : 'rgba(15,13,9,0.7)';
  ctx.font = '500 26px Inter';
  ctx.textAlign = 'left';
  ctx.fillText('THE LEDGER', 96, H - 64);
  ctx.fillStyle = GOLD;
  ctx.textAlign = 'right';
  ctx.fillText('NIYYAH', W - 96, H - 64);
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

export async function exportVerdictCard(state: LedgerState): Promise<void> {
  const audit = state.audit;
  if (!audit) return;
  const ctx = await readyCanvas();

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  // masthead
  ctx.fillStyle = 'rgba(240,233,219,0.6)';
  ctx.font = '500 26px Inter';
  ctx.fillText('T H E   A U D I T  —  V E R D I C T', 96, 124);
  ctx.strokeStyle = 'rgba(240,233,219,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, 152);
  ctx.lineTo(W - 96, 152);
  ctx.stroke();

  // preline + name
  ctx.fillStyle = 'rgba(240,233,219,0.75)';
  ctx.font = 'italic 400 44px Fraunces';
  ctx.fillText('The ledger has read you.', 96, 300);

  ctx.fillStyle = PAPER;
  ctx.font = '560 235px Fraunces';
  ctx.fillText(SABOTEUR_NAMES[audit.dominant], 88, 540);

  ctx.fillStyle = 'rgba(240,233,219,0.6)';
  ctx.font = '500 26px Inter';
  ctx.fillText(
    `DOMINANT SABOTEUR  ·  SECONDED BY ${SABOTEUR_NAMES[audit.seconded]}`,
    96,
    620
  );

  // gauges — one tremor line per point scored
  const rand = seededRand(7);
  const order = ['ego', 'greed', 'anger', 'doubt'] as const;
  const colW = (W - 192) / 4;
  const baseY = 1010;
  const step = 22;
  const lineW = 140;

  order.forEach((s, i) => {
    const cx = 96 + colW * i + colW / 2;
    const score = audit.scores[s];
    const dominant = s === audit.dominant;

    ctx.fillStyle = dominant ? GOLD : 'rgba(240,233,219,0.65)';
    ctx.font = '400 34px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(String(score), cx, baseY - score * step - 26);

    ctx.strokeStyle = dominant ? PAPER : 'rgba(240,233,219,0.55)';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (let p = 1; p <= score; p++) {
      tremorLine(ctx, cx - lineW / 2, cx + lineW / 2, baseY - p * step, 2.6, rand);
    }

    ctx.fillStyle = dominant ? PAPER : 'rgba(240,233,219,0.55)';
    ctx.font = '500 28px Inter';
    ctx.fillText(SABOTEUR_NAMES[s], cx, baseY + 52);
  });
  ctx.textAlign = 'left';

  ctx.strokeStyle = 'rgba(240,233,219,0.45)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, baseY);
  ctx.lineTo(W - 96, baseY);
  ctx.stroke();

  // dated
  ctx.fillStyle = 'rgba(240,233,219,0.5)';
  ctx.font = '400 26px ui-monospace, Menlo, monospace';
  ctx.fillText(longDate(new Date(audit.completedAt)), 96, 1130);

  footer(ctx, true);
  download(ctx, `the-ledger-verdict-${audit.dominant}.png`);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(' ');
  let line = '';
  let cy = y;
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, cy);
      line = word;
      cy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, cy);
  return cy + lineHeight;
}

function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const rand = seededRand(31);
  // irregular wax blob
  ctx.fillStyle = WAX;
  ctx.beginPath();
  const bumps = 14;
  for (let i = 0; i <= bumps; i++) {
    const a = (i / bumps) * Math.PI * 2;
    const rr = r * (0.92 + rand() * 0.16);
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  // inner ring + monogram
  ctx.strokeStyle = 'rgba(240,233,219,0.85)';
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
  // engraved double border
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.strokeRect(40, 40, W - 80, H - 80);
  ctx.lineWidth = 1;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  ctx.fillStyle = 'rgba(15,13,9,0.6)';
  ctx.font = '500 24px Inter';
  ctx.textAlign = 'center';
  ctx.fillText(`T H E   C O N T R A C T   ·   V ${c.current.version}`, W / 2, 140);

  ctx.fillStyle = INK;
  ctx.font = '560 84px Fraunces';
  ctx.fillText('Five Rules. No Exceptions.', W / 2, 240);
  ctx.textAlign = 'left';

  let y = 330;
  c.current.rules.forEach((r, i) => {
    ctx.fillStyle = 'rgba(15,13,9,0.55)';
    ctx.font = '400 26px ui-monospace, Menlo, monospace';
    ctx.fillText(String(i + 1).padStart(2, '0'), 96, y);
    ctx.fillStyle = INK;
    ctx.font = '560 40px Fraunces';
    ctx.fillText(r.title, 160, y);
    y += 46;
    ctx.fillStyle = 'rgba(15,13,9,0.85)';
    ctx.font = '400 27px Inter';
    y = wrapText(ctx, `WHEN ${r.when}  THEN ${r.then}`, 160, y, W - 280, 36) + 2;
    y = wrapText(ctx, `NO EXCEPTIONS, INCLUDING ${r.noExceptions}  ·  THE PRICE ${r.price}`, 160, y, W - 280, 36);
    ctx.strokeStyle = 'rgba(15,13,9,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(96, y);
    ctx.lineTo(W - 96, y);
    ctx.stroke();
    y += 44;
  });

  // signature block
  const sy = H - 220;
  ctx.fillStyle = INK;
  ctx.font = 'italic 460 54px Fraunces';
  ctx.fillText(c.current.signedName, 120, sy);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(120, sy + 18);
  ctx.lineTo(560, sy + 18);
  ctx.stroke();
  ctx.fillStyle = 'rgba(15,13,9,0.6)';
  ctx.font = '400 24px ui-monospace, Menlo, monospace';
  ctx.fillText(`SIGNED ${longDate(new Date(c.current.signedAt))}`, 120, sy + 58);

  drawSeal(ctx, W - 230, sy - 10, 92);

  download(ctx, `the-ledger-contract-v${c.current.version}.png`);
}

export async function exportWeeklyCard(state: LedgerState, week: WeekSummary): Promise<void> {
  const ctx = await readyCanvas();

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(240,233,219,0.6)';
  ctx.font = '500 26px Inter';
  ctx.fillText('T H E   W E E K L Y   L E D G E R', 96, 124);
  ctx.fillStyle = 'rgba(240,233,219,0.6)';
  ctx.font = '400 26px ui-monospace, Menlo, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(week.rangeLabel, W - 96, 124);
  ctx.textAlign = 'left';
  ctx.strokeStyle = 'rgba(240,233,219,0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(96, 152);
  ctx.lineTo(W - 96, 152);
  ctx.stroke();

  // hero: integrity
  ctx.fillStyle = PAPER;
  ctx.font = '560 250px Fraunces';
  const integ = week.integrity != null ? week.integrity.toFixed(1) : '—';
  ctx.fillText(integ, 88, 460);
  ctx.fillStyle = 'rgba(240,233,219,0.6)';
  ctx.font = '500 28px Inter';
  ctx.fillText('INTEGRITY / 100', 96, 530);

  // rows on ruled lines
  const name = state.settings.name || state.contract?.current.signedName || '';
  const rows: Array<[string, string, boolean]> = [
    ['TRADER', name.toUpperCase(), false],
    ['DAYS LOGGED', `${week.daysLogged} / ${week.marketDays}`, false],
    ['TRADES TAKEN', String(week.tradesTotal), false],
    ['RULES CLEAN', `${week.cleanRules} / ${week.ruleCount}`, false],
    [
      'BREACHES',
      week.breaches.length === 0 ? 'NONE' : String(week.breaches.length),
      week.breaches.length > 0,
    ],
    ['DAYS UNDER CONTRACT', String(daysUnderContract(state)), false],
  ];

  let y = 660;
  for (const [label, value, isWax] of rows) {
    ctx.fillStyle = 'rgba(240,233,219,0.6)';
    ctx.font = '500 28px Inter';
    ctx.fillText(label, 96, y);
    ctx.fillStyle = isWax ? WAX : PAPER;
    ctx.font = '400 40px ui-monospace, Menlo, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(value, W - 96, y + 4);
    ctx.textAlign = 'left';
    ctx.strokeStyle = 'rgba(240,233,219,0.35)';
    ctx.beginPath();
    ctx.moveTo(96, y + 28);
    ctx.lineTo(W - 96, y + 28);
    ctx.stroke();
    y += 86;
  }

  const total = integrityScore(state);
  if (total != null) {
    ctx.fillStyle = 'rgba(240,233,219,0.5)';
    ctx.font = '400 26px ui-monospace, Menlo, monospace';
    ctx.fillText(`ALL-TIME INTEGRITY ${total.toFixed(1)} / 100`, 96, y + 10);
  }

  footer(ctx, true);
  download(ctx, `the-ledger-week-${week.fridayISO}.png`);
}

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
  const saved = state.settings.avgTiltLoss;
  if (saved > 0) lines.push(`STATED AVG TILT LOSS ${formatMoney(saved)}`);
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
