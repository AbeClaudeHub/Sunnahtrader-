import { useRef, useState } from 'react';
import { exportJSON, importJSON, useLedger } from '../store/store';
import {
  daysUnderContract,
  integrityScore,
  missedDays,
  moneySaved,
  ruleCleanStreak,
  weekSummary,
} from '../lib/stats';
import { formatMoney, marketDaysBetween, todayISO } from '../lib/dates';
import { contractStartISO } from '../lib/stats';
import { exportTextRecord, downloadText, exportWeeklyCard } from '../lib/exportCard';
import './record.css';

/** the last 20 market days as ledger ticks: kept, breached (wax), or gap */
function DaysStrip() {
  const state = useLedger();
  const start = contractStartISO(state);
  if (!start) return null;
  const all = marketDaysBetween(start, todayISO()).slice(-20);
  if (all.length === 0) return null;
  const breachDates = new Set(state.breaches.map((b) => b.date));

  return (
    <div className="strip" role="img" aria-label={`Last ${all.length} market days under contract`}>
      <svg width="342" height="36" viewBox="0 0 342 36">
        <line x1="0" x2="342" y1="28" y2="28" stroke="var(--ink)" strokeWidth="0.5" />
        {all.map((iso, i) => {
          const x = all.length === 1 ? 171 : 8 + (326 / (all.length - 1)) * i;
          const d = state.days[iso];
          const logged = d && (d.morning || d.evening);
          if (!logged) return null; // a missed day is a gap. the gap is the point.
          const wax = breachDates.has(iso);
          return (
            <line
              key={iso}
              x1={x}
              x2={x}
              y1={wax ? 10 : 14}
              y2="28"
              stroke={wax ? 'var(--wax)' : 'var(--ink)'}
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
    </div>
  );
}

export function Record() {
  const state = useLedger();
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  const days = daysUnderContract(state);
  const integ = integrityScore(state);
  const gaps = missedDays(state);
  const saved = moneySaved(state);
  const rules = state.contract?.current.rules ?? [];
  const week = weekSummary(state, new Date());
  const loggedCount = Object.values(state.days).filter((d) => d.morning || d.evening).length;

  function onImport(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const res = importJSON(String(reader.result));
      setImportMsg(res.ok ? 'The record is restored.' : res.error);
    };
    reader.readAsText(file);
  }

  if (!state.contract && loggedCount === 0 && !state.audit) {
    return (
      <div className="record-empty">
        <p className="record-empty-line">No entries. The record begins the morning you do.</p>
      </div>
    );
  }

  return (
    <div className="record">
      <div className="record-hero">
        <p className="record-hero-num num">{integ != null ? integ.toFixed(1) : '—'}</p>
        <p className="label record-hero-label">Integrity / 100 — rule-days kept</p>
      </div>

      <DaysStrip />
      {gaps.length > 0 && (
        <p className="record-gaps num">
          {gaps.length} MISSED {gaps.length === 1 ? 'DAY' : 'DAYS'}. THE GAPS STAY.
        </p>
      )}

      <section className="record-section">
        <div className="section-head"><span className="label">Standing</span></div>
        <div className="row">
          <span className="label">Days under contract</span>
          <span className="num">{days}</span>
        </div>
        <div className="row">
          <span className="label">Days logged</span>
          <span className="num">{loggedCount}</span>
        </div>
        <div className="row">
          <span className="label">Breaches, all time</span>
          <span className={`num${state.breaches.length > 0 ? ' record-wax' : ''}`}>
            {state.breaches.length}
          </span>
        </div>
        <div className="row">
          <span className="label">Breaker runs completed</span>
          <span className="num">{state.breaker.sessions.filter((s) => s.completed).length}</span>
        </div>
      </section>

      {rules.length > 0 && (
        <section className="record-section">
          <div className="section-head"><span className="label">Clean streaks, by rule</span></div>
          {rules.map((r, i) => {
            const streak = ruleCleanStreak(state, r.id);
            return (
              <div className="row" key={r.id}>
                <span className="record-rule-name">
                  <span className="num record-rule-no">{String(i + 1).padStart(2, '0')}</span> {r.title}
                </span>
                <span className="num">{streak} {streak === 1 ? 'day' : 'days'}</span>
              </div>
            );
          })}
        </section>
      )}

      <section className="record-section">
        <div className="section-head"><span className="label">Breach history</span></div>
        {state.breaches.length === 0 ? (
          <p className="record-none">No breaches on record. The record knows.</p>
        ) : (
          [...state.breaches].reverse().map((b) => (
            <div className="row" key={b.id}>
              <span className="record-breach-name">
                <span className="num record-rule-no">{b.date.slice(5).replace('-', '.')}</span> {b.ruleTitle}
              </span>
              <span className={b.paid ? 'record-paid label' : 'record-owed label'}>
                {b.paid ? 'Paid' : 'Owed'}
              </span>
            </div>
          ))
        )}
      </section>

      {saved && (
        <section className="record-section">
          <div className="section-head"><span className="label">What restraint is worth</span></div>
          <div className="row">
            <span className="label">Your stated average tilt loss</span>
            <span className="num">{formatMoney(state.settings.avgTiltLoss)}</span>
          </div>
          <div className="row">
            <span className="label">Expected breaches by your old baseline</span>
            <span className="num">{saved.expected}</span>
          </div>
          <div className="row">
            <span className="label">Breaches on record</span>
            <span className="num">{saved.actual}</span>
          </div>
          <div className="row">
            <span className="label">Prevented</span>
            <span className="num">{saved.prevented}</span>
          </div>
          <div className="row record-saved-row">
            <span className="label">Estimated kept in your account</span>
            <span className="num record-saved">{formatMoney(saved.saved)}</span>
          </div>
          <p className="record-payback">
            THE LEDGER cost $27. One prevented breach is worth {formatMoney(state.settings.avgTiltLoss)}.
            {saved.saved >= 27 ? ' It has paid for itself.' : ' One save settles it.'}
          </p>
        </section>
      )}

      <section className="record-section">
        <div className="section-head">
          <span className="label">The weekly ledger</span>
          <span className="status num">{week.rangeLabel}</span>
        </div>
        <div className="row">
          <span className="label">Days logged</span>
          <span className="num">{week.daysLogged} / {week.marketDays}</span>
        </div>
        <div className="row">
          <span className="label">Integrity this week</span>
          <span className="num">{week.integrity != null ? week.integrity.toFixed(1) : '—'}</span>
        </div>
        <div className="row">
          <span className="label">Breaches this week</span>
          <span className={`num${week.breaches.length > 0 ? ' record-wax' : ''}`}>{week.breaches.length}</span>
        </div>
        <button className="btn record-btn" onClick={() => exportWeeklyCard(state, week)}>
          Export the weekly card
        </button>
      </section>

      <section className="record-section">
        <div className="section-head"><span className="label">Your record, yours</span></div>
        <div className="record-data-actions">
          <button
            className="btn record-btn"
            onClick={() => downloadText(`the-ledger-${todayISO()}.json`, exportJSON(), 'application/json')}
          >
            Export JSON
          </button>
          <button
            className="btn record-btn"
            onClick={() => downloadText(`the-ledger-${todayISO()}.txt`, exportTextRecord(state))}
          >
            Export text
          </button>
          <button className="btn record-btn" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />
        </div>
        {importMsg && <p className="record-import-msg">{importMsg}</p>}
      </section>
    </div>
  );
}
