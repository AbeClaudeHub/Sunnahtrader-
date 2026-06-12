import { useEffect, useRef, useState } from 'react';
import { setState, useLedger } from '../store/store';
import type { SaboteurId } from '../store/types';
import { QUESTIONS, SCALE } from '../content/questions';
import { PROFILES, SABOTEUR_NAMES } from '../content/profiles';
import { scoreAudit } from '../lib/score';
import { Gauges } from '../components/Gauges';
import { Verse, VERSES } from '../components/Verse';
import { exportVerdictCard } from '../lib/exportCard';
import { shortDate } from '../lib/dates';
import './audit.css';

/** re-running never erases: the old reading moves to the shelf, and the next verdict reads both */
export function rerunAudit() {
  setState((s) => ({
    audits: s.audit ? [...s.audits, s.audit] : s.audits,
    audit: null,
    auditDraft: { answers: Array(16).fill(null), index: 0 },
  }));
}

function Intro({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="audit-intro">
      <p className="audit-intro-line">
        Before you write a single rule, the ledger reads you.
      </p>
      <p className="audit-intro-sub">
        Sixteen questions. Each one is a private behavior — answer for what you have actually
        done, not what you intend. Seven minutes. No one sees this but you.
      </p>
      <button className="btn btn-solid-paper audit-begin" onClick={onBegin}>
        Begin the audit
      </button>
    </div>
  );
}

function Questions() {
  const state = useLedger();
  const draft = state.auditDraft ?? { answers: Array(16).fill(null), index: 0 };
  const i = draft.index;
  const q = QUESTIONS[i];
  const [animKey, setAnimKey] = useState(i);
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => setAnimKey(i), [i]);

  function answer(value: number) {
    const answers = [...draft.answers];
    answers[i] = value;
    if (i === 15) {
      const result = scoreAudit(answers.map((a) => a ?? 0));
      setState({ audit: result, auditDraft: null });
    } else {
      setState({ auditDraft: { answers, index: i + 1 } });
    }
  }

  function back() {
    if (i > 0) setState({ auditDraft: { ...draft, index: i - 1 } });
  }

  return (
    <div className="audit-q">
      <div className="audit-q-head">
        <button className="audit-back label" onClick={back} disabled={i === 0}>
          Back
        </button>
        <span className="num audit-count">
          {String(i + 1).padStart(2, '0')} / 16
        </span>
      </div>
      <div className="audit-q-body" key={animKey}>
        <p className="audit-q-text" ref={liveRef}>
          {q.text}
        </p>
        <div className="audit-scale" role="group" aria-label="How often is this you?">
          {SCALE.map((s, v) => (
            <button
              key={s}
              className={`audit-option${draft.answers[i] === v ? ' audit-option-chosen' : ''}`}
              onClick={() => answer(v)}
            >
              <span>{s}</span>
              <span className="num audit-option-num">{v}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Verdict({ onContract }: { onContract: () => void }) {
  const state = useLedger();
  const audit = state.audit!;
  const [fadeGone, setFadeGone] = useState(false);
  const [reveal] = useState(() => sessionStorage.getItem('verdict-seen') !== '1');

  useEffect(() => {
    sessionStorage.setItem('verdict-seen', '1');
    const onScroll = () => setFadeGone(true);
    window.addEventListener('scroll', onScroll, { passive: true, once: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const paragraphs = PROFILES[audit.dominant].split('\n\n');
  const prev = state.audits.length > 0 ? state.audits[state.audits.length - 1] : null;
  const ORDER: SaboteurId[] = ['ego', 'greed', 'anger', 'doubt'];

  function deltaLine(): string {
    if (!prev) return '';
    const moved = audit.scores[prev.dominant] - prev.scores[prev.dominant];
    if (moved < 0)
      return `${SABOTEUR_NAMES[prev.dominant]} gave back ${Math.abs(moved)} ${Math.abs(moved) === 1 ? 'point' : 'points'}. That isn’t luck — that’s the entries.`;
    if (moved > 0)
      return `${SABOTEUR_NAMES[prev.dominant]} gained ground. Read your contract again tonight, and amend what stopped holding.`;
    return 'No movement on the dominant line. The record is patient.';
  }

  function renderItalics(text: string, key: number) {
    const parts = text.split('*');
    return (
      <p key={key}>
        {parts.map((part, j) => (j % 2 === 1 ? <em key={j}>{part}</em> : part))}
      </p>
    );
  }

  return (
    <div className="verdict">
      <header className="verdict-masthead">
        <span className="label">The Audit — Verdict</span>
        <span className="num">16 / 16</span>
      </header>

      <p className="verdict-preline">The ledger has read you.</p>
      <h1 className="verdict-name">{SABOTEUR_NAMES[audit.dominant]}</h1>
      <p className="verdict-seconded">
        Dominant saboteur · seconded by <em>{SABOTEUR_NAMES[audit.seconded]}</em>
      </p>

      <div className="verdict-gauges">
        <Gauges scores={audit.scores} dominant={audit.dominant} animate={reveal} />
      </div>

      {prev && (
        <div className="verdict-delta">
          <div className="section-head">
            <span className="label">Against your last reading</span>
            <span className="status num">{shortDate(new Date(prev.completedAt))}</span>
          </div>
          {ORDER.map((s) => {
            const d = audit.scores[s] - prev.scores[s];
            return (
              <div className="row" key={s}>
                <span className="label">{SABOTEUR_NAMES[s]}</span>
                <span className="num">
                  {prev.scores[s]} → {audit.scores[s]}
                  {d !== 0 ? ` (${d > 0 ? '+' : '−'}${Math.abs(d)})` : ''}
                </span>
              </div>
            );
          })}
          <p className="verdict-delta-line">{deltaLine()}</p>
        </div>
      )}

      <Verse className="verdict-verse" {...VERSES.accounting} />

      <div className="verdict-profile">{paragraphs.map(renderItalics)}</div>

      <div className="verdict-actions">
        <button className="btn btn-ghost-paper" onClick={() => exportVerdictCard(state)}>
          Export the card
        </button>
        <button className="btn btn-solid-paper" onClick={onContract}>
          {state.contract ? 'View the contract' : 'Write the contract'}
        </button>
        <button className="verdict-retake label" onClick={rerunAudit}>
          Re-run the audit
        </button>
      </div>

      <div className={`verdict-fade${fadeGone ? ' verdict-fade-gone' : ''}`} aria-hidden="true" />
    </div>
  );
}

export function Audit({ onContract }: { onContract: () => void }) {
  const state = useLedger();

  if (state.audit) return <Verdict onContract={onContract} />;
  if (state.auditDraft) return <Questions />;
  return (
    <Intro
      onBegin={() => setState({ auditDraft: { answers: Array(16).fill(null), index: 0 } })}
    />
  );
}
