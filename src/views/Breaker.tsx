import { useEffect, useRef, useState } from 'react';
import { setState, useLedger } from '../store/store';
import type { Breach, LedgerState, Rule } from '../store/types';
import { todayISO } from '../lib/dates';
import { SealMark } from '../components/Icons';
import './breaker.css';

const TOTAL_SECONDS = 15 * 60;
const EXIT_PHRASE = 'I am choosing to break my contract';

export function startBreaker() {
  setState((s) => {
    if (s.breaker.active) return {};
    return { breaker: { ...s.breaker, active: { startedAt: new Date().toISOString() } } };
  });
}

/** the rule the breaker holds up: first rule matched to the dominant saboteur, else rule one */
function relevantRule(state: LedgerState): Rule | null {
  const rules = state.contract?.current.rules ?? [];
  if (rules.length === 0) return null;
  const dom = state.audit?.dominant;
  if (dom) {
    const tagged = rules.find((r) => {
      if (!r.libraryId) return false;
      const n = Number(r.libraryId);
      if (dom === 'ego') return n >= 1 && n <= 3;
      if (dom === 'greed') return n >= 4 && n <= 6;
      if (dom === 'anger') return n >= 7 && n <= 9;
      return n >= 10 && n <= 12;
    });
    if (tagged) return tagged;
  }
  return rules[0];
}

export function Breaker() {
  const state = useLedger();
  const active = state.breaker.active;
  const [now, setNow] = useState(() => Date.now());
  const [exitTyped, setExitTyped] = useState('');
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, []);

  // the takeover owns the scroll — the app behind it holds still
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!active) return null;

  const elapsed = Math.max(0, Math.floor((now - new Date(active.startedAt).getTime()) / 1000));
  const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
  const done = remaining === 0;
  const step = elapsed < 300 ? 1 : elapsed < 600 ? 2 : 3;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const rule = relevantRule(state);

  function saveNote() {
    const note = noteRef.current?.value.trim();
    if (note) {
      setState((s) =>
        s.breaker.active
          ? { breaker: { ...s.breaker, active: { ...s.breaker.active, note } } }
          : {}
      );
    }
  }

  function finish() {
    saveNote();
    setState((s) => {
      const a = s.breaker.active;
      if (!a) return {};
      return {
        breaker: {
          active: null,
          sessions: [
            ...s.breaker.sessions,
            { startedAt: a.startedAt, endedAt: new Date().toISOString(), completed: true, note: a.note },
          ],
        },
      };
    });
  }

  function exitEarly() {
    saveNote();
    setState((s) => {
      const a = s.breaker.active;
      if (!a) return {};
      const breach: Breach = {
        id: `b${Date.now()}`,
        date: todayISO(),
        ruleId: 'breaker',
        ruleTitle: 'Circuit breaker — left early',
        price: rule ? rule.price : 'Name it to your room within 24 hours.',
        paid: false,
        source: 'breaker',
      };
      return {
        breaches: [...s.breaches, breach],
        breaker: {
          active: null,
          sessions: [
            ...s.breaker.sessions,
            { startedAt: a.startedAt, endedAt: new Date().toISOString(), completed: false, note: a.note },
          ],
        },
      };
    });
  }

  if (done) {
    return (
      <div className="breaker ink-ground" role="dialog" aria-modal="true" aria-label="Circuit breaker complete">
        <div className="breaker-frame breaker-frame-done">
          <div className="breaker-head">
            <span className="label breaker-label">Circuit breaker</span>
            <SealMark className="breaker-seal" />
          </div>
          <div className="breaker-done-block">
            <p className="breaker-done-clock num">00:00</p>
            <p className="breaker-instruction">The breaker held. Fifteen minutes, untouched.</p>
            <p className="breaker-done-sub">That was the trade that didn’t happen. The record counts it.</p>
          </div>
          <button className="btn btn-solid-paper breaker-return" onClick={finish}>
            Return to the ledger
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="breaker ink-ground" role="dialog" aria-modal="true" aria-label="Circuit breaker">
      <div className="breaker-frame">
        <div className="breaker-head">
          <span className="label breaker-label">Circuit breaker</span>
          <SealMark className="breaker-seal" />
        </div>

        <div className="breaker-clockwrap">
          <p className="breaker-clock num" aria-live="off">{mm}:{ss}</p>
          <div className="breaker-rule-track" aria-hidden="true">
            <div className="breaker-rule-total" />
            <div className="breaker-rule-elapsed" style={{ width: `${(elapsed / TOTAL_SECONDS) * 100}%` }} />
          </div>
          <p className="breaker-clock-sub label">The market will still be there</p>
        </div>

        <div className="breaker-stepblock">
          {step === 1 && <p className="breaker-instruction">Hands off the platform.</p>}
          {step === 2 && (
            <>
              <p className="breaker-instruction">Name what just happened, in one line.</p>
              <textarea
                ref={noteRef}
                className="breaker-note"
                rows={2}
                maxLength={140}
                defaultValue={active.note ?? ''}
                onBlur={saveNote}
                aria-label="Name what just happened, in one line"
              />
            </>
          )}
          {step === 3 && (
            <>
              <p className="breaker-instruction">What does your contract say?</p>
              {rule ? (
                <div className="breaker-rulecard">
                  <p className="label breaker-rulecard-title">{rule.title}</p>
                  <p><span className="breaker-k">When</span> {rule.when}</p>
                  <p><span className="breaker-k">Then</span> {rule.then}</p>
                  <p><span className="breaker-k">No exceptions, including</span> {rule.noExceptions}</p>
                </div>
              ) : (
                <p className="breaker-norule">You have no contract yet. That is the first repair.</p>
              )}
            </>
          )}
          <p className="breaker-step num">STEP {step} / 3</p>
        </div>

        {/* VERSE SLOT: restraint in anger */}

        {/* distance is friction: the exit sits below the fold, by design */}
        <div className="breaker-distance" aria-hidden="true" />

        <div className="breaker-exit">
          <p className="label breaker-exit-label">To leave early, type it in full</p>
          <input
            className="breaker-exit-input"
            type="text"
            value={exitTyped}
            onChange={(e) => setExitTyped(e.target.value)}
            placeholder={EXIT_PHRASE}
            aria-label="Type the early-exit phrase in full"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <p className="breaker-exit-warning">Early exit is recorded as a breach.</p>
          <button
            className="btn breaker-exit-btn"
            disabled={exitTyped !== EXIT_PHRASE}
            onClick={exitEarly}
          >
            Break the contract
          </button>
        </div>
      </div>
    </div>
  );
}
