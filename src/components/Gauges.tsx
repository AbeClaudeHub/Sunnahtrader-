import { useEffect, useRef } from 'react';
import type { SaboteurId } from '../store/types';
import { SABOTEUR_NAMES } from '../content/profiles';

// hand-drawn ink-column gauges: one tremor line per point scored.
// drawn once, then still — the verdict reveal is one of the four permitted motions.

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function tremorPath(x1: number, x2: number, y: number, amp: number, rand: () => number): string {
  const segs = 6;
  const jitter = () => (rand() - 0.5) * 2 * amp;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= segs; i++) {
    pts.push([x1 + ((x2 - x1) * i) / segs, y + jitter()]);
  }
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i <= segs; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    d += ` Q ${((px + cx) / 2 + jitter()).toFixed(1)} ${((py + cy) / 2 + jitter()).toFixed(1)} ${cx.toFixed(1)} ${cy.toFixed(1)}`;
  }
  return d;
}

const ORDER: SaboteurId[] = ['ego', 'greed', 'anger', 'doubt'];

interface GaugesProps {
  scores: Record<SaboteurId, number>;
  dominant: SaboteurId;
  animate?: boolean;
}

export function Gauges({ scores, dominant, animate = false }: GaugesProps) {
  const ref = useRef<SVGSVGElement>(null);
  const W = 342;
  const H = 178;
  const colW = W / 4;
  const lineW = 52;
  const baseY = 138;
  const step = 9;
  const rand = seededRand(7);

  useEffect(() => {
    if (!animate || !ref.current) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lines = ref.current.querySelectorAll<SVGPathElement>('[data-gauge-line]');
    lines.forEach((line, i) => {
      const len = line.getTotalLength();
      line.style.strokeDasharray = String(len);
      line.style.strokeDashoffset = String(len);
      line.style.transition = `stroke-dashoffset 220ms ease-out ${i * 28}ms`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          line.style.strokeDashoffset = '0';
        });
      });
    });
  }, [animate]);

  const desc = ORDER.map((s) => `${SABOTEUR_NAMES[s]} ${scores[s]} of 12`).join(', ');

  return (
    <svg
      ref={ref}
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Saboteur scores: ${desc}`}
      style={{ display: 'block', maxWidth: '100%' }}
    >
      {ORDER.map((s, i) => {
        const cx = colW * i + colW / 2;
        const score = scores[s];
        const isDom = s === dominant;
        const lines = [];
        for (let p = 1; p <= score; p++) {
          lines.push(
            <path
              key={p}
              data-gauge-line
              d={tremorPath(cx - lineW / 2, cx + lineW / 2, baseY - p * step, 1.1, rand)}
              stroke={isDom ? 'var(--paper)' : 'var(--paper-45)'}
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          );
        }
        return (
          <g key={s}>
            <text
              x={cx}
              y={baseY - score * step - 10}
              textAnchor="middle"
              fontFamily="ui-monospace, Menlo, monospace"
              fontSize="13"
              fill={isDom ? 'var(--gold)' : 'var(--paper-60)'}
            >
              {score}
            </text>
            {lines}
            <text
              x={cx}
              y={baseY + 22}
              textAnchor="middle"
              fontFamily="Inter, system-ui, sans-serif"
              fontSize="11"
              letterSpacing="1.5"
              fontWeight="500"
              fill={isDom ? 'var(--paper)' : 'var(--paper-45)'}
            >
              {SABOTEUR_NAMES[s]}
            </text>
          </g>
        );
      })}
      <line x1="0" x2={W} y1={baseY} y2={baseY} stroke="var(--paper-45)" strokeWidth="0.5" />
    </svg>
  );
}
