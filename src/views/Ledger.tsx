import { useState } from 'react';
import { setState, useLedger } from '../store/store';
import type { Breach, DayEntry, EveningEntry, MorningEntry } from '../store/types';
import { hijriDate, longDate, todayISO, weekdayName, fromISO } from '../lib/dates';
import { composeEvening, composeMorning, copyText } from '../lib/compose';
import { daysUnderContract, unpaidBreaches } from '../lib/stats';
import './ledger.css';

const EVENING_HOUR = 16;

function CopyButton({ text, children }: { text: string; children: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="btn composed-copy"
      onClick={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
        void copyText(text);
      }}
    >
      {copied ? 'Copied. Post it.' : children}
    </button>
  );
}

function Debts() {
  const state = useLedger();
  const owed = unpaidBreaches(state);
  if (owed.length === 0) return null;
  return (
    <div className="ledger-debts">
      {owed.map((b) => (
        <div className="debt" key={b.id}>
          <p className="debt-text">
            <strong>{b.ruleTitle} — price owed.</strong> {b.price}{' '}
            <span className="num">({b.date.slice(5).replace('-', '.')})</span>
          </p>
          <button
            className="debt-action"
            onClick={() =>
              setState((s) => ({
                breaches: s.breaches.map((x) =>
                  x.id === b.id ? { ...x, paid: true, paidAt: new Date().toISOString() } : x
                ),
              }))
            }
          >
            Mark paid
          </button>
        </div>
      ))}
    </div>
  );
}

function MorningForm({ day, onSaved }: { day: DayEntry; onSaved: () => void }) {
  const m = day.morning;
  const [intention, setIntention] = useState(m?.intention ?? '');
  const [maxTrades, setMaxTrades] = useState(m ? String(m.maxTrades) : '');
  const [maxRisk, setMaxRisk] = useState(m?.maxRisk ?? '');
  const [word, setWord] = useState(m?.state ?? '');

  const complete = intention.trim() && Number(maxTrades) > 0 && maxRisk.trim() && word.trim();

  function save() {
    const entry: MorningEntry = {
      intention: intention.trim(),
      maxTrades: Number(maxTrades),
      maxRisk: maxRisk.trim(),
      state: word.trim().split(/\s+/)[0],
      at: new Date().toISOString(),
    };
    setState((s) => ({
      days: { ...s.days, [day.date]: { ...s.days[day.date], date: day.date, morning: entry } },
    }));
    onSaved();
  }

  return (
    <div className="entry-form">
      <label className="field">
        <span className="field-label label">Intention — one line, before the open</span>
        <input
          value={intention}
          onChange={(e) => setIntention(e.target.value)}
          maxLength={90}
          placeholder="Take only what the plan gives."
        />
      </label>
      <div className="entry-form-pair">
        <label className="field">
          <span className="field-label label">Max trades</span>
          <input
            value={maxTrades}
            onChange={(e) => setMaxTrades(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
            className="num"
          />
        </label>
        <label className="field">
          <span className="field-label label">Max risk</span>
          <input value={maxRisk} onChange={(e) => setMaxRisk(e.target.value)} placeholder="$150" className="num" />
        </label>
      </div>
      <label className="field">
        <span className="field-label label">Your state, one word</span>
        <input value={word} onChange={(e) => setWord(e.target.value)} maxLength={20} placeholder="patient" />
      </label>
      <button className="btn btn-solid-ink entry-save" disabled={!complete} onClick={save}>
        Enter it in the ledger
      </button>
    </div>
  );
}

function EveningForm({ day, onSaved }: { day: DayEntry; onSaved: () => void }) {
  const state = useLedger();
  const e = day.evening;
  const rules = state.contract?.current.rules ?? [];
  const [planFollowed, setPlanFollowed] = useState<boolean | null>(e ? e.planFollowed : null);
  const [trades, setTrades] = useState(e ? String(e.trades) : '');
  const [breached, setBreached] = useState<string[]>(e?.breachedRuleIds ?? []);
  const [line, setLine] = useState(e?.honestLine ?? '');

  const complete = planFollowed !== null && trades !== '' && line.trim();

  function save() {
    const entry: EveningEntry = {
      planFollowed: planFollowed!,
      trades: Number(trades),
      breachedRuleIds: breached,
      honestLine: line.trim(),
      at: new Date().toISOString(),
    };
    setState((s) => {
      // breaches flow into the record automatically; evening breaches for this day are re-derived
      const kept = s.breaches.filter((b) => !(b.date === day.date && b.source === 'evening'));
      const added: Breach[] = breached.map((id) => {
        const r = rules.find((x) => x.id === id);
        const prior = s.breaches.find(
          (b) => b.date === day.date && b.source === 'evening' && b.ruleId === id
        );
        return (
          prior ?? {
            id: `b${Date.now()}-${id}`,
            date: day.date,
            ruleId: id,
            ruleTitle: r?.title ?? id,
            price: r?.price ?? '',
            paid: false,
            source: 'evening' as const,
          }
        );
      });
      return {
        days: { ...s.days, [day.date]: { ...s.days[day.date], date: day.date, evening: entry } },
        breaches: [...kept, ...added],
      };
    });
    onSaved();
  }

  return (
    <div className="entry-form">
      <div className="field">
        <span className="field-label label">Plan followed</span>
        <div className="entry-yn" role="group" aria-label="Plan followed">
          <button
            className={`entry-yn-btn${planFollowed === true ? ' entry-yn-on' : ''}`}
            onClick={() => setPlanFollowed(true)}
          >
            Yes
          </button>
          <button
            className={`entry-yn-btn${planFollowed === false ? ' entry-yn-wax' : ''}`}
            onClick={() => setPlanFollowed(false)}
          >
            No
          </button>
        </div>
      </div>
      <label className="field">
        <span className="field-label label">
          Trades taken{day.morning ? ` — you allowed yourself ${day.morning.maxTrades}` : ''}
        </span>
        <input
          value={trades}
          onChange={(e2) => setTrades(e2.target.value.replace(/[^0-9]/g, ''))}
          inputMode="numeric"
          className="num"
        />
      </label>
      {rules.length > 0 && (
        <div className="field">
          <span className="field-label label">Rules breached — tap what broke</span>
          <div className="entry-rules" role="group" aria-label="Rules breached">
            {rules.map((r, i) => {
              const on = breached.includes(r.id);
              return (
                <button
                  key={r.id}
                  className={`entry-rule${on ? ' entry-rule-broken' : ''}`}
                  aria-pressed={on}
                  onClick={() =>
                    setBreached(on ? breached.filter((x) => x !== r.id) : [...breached, r.id])
                  }
                >
                  <span className="num">{String(i + 1).padStart(2, '0')}</span> {r.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <label className="field">
        <span className="field-label label">One honest line</span>
        <input value={line} onChange={(e2) => setLine(e2.target.value)} maxLength={140} />
      </label>
      <button className="btn btn-solid-ink entry-save" disabled={!complete} onClick={save}>
        Close the day
      </button>
    </div>
  );
}

function MorningSection({ day, primary }: { day: DayEntry; primary: boolean }) {
  const state = useLedger();
  const [editing, setEditing] = useState(false);
  const m = day.morning;

  return (
    <section className="ledger-section">
      <div className="section-head">
        <span className="label">Pre-market</span>
        <span className="status num">
          {m ? `ENTERED ${new Date(m.at).toTimeString().slice(0, 5)}` : 'OPEN'}
        </span>
      </div>
      {!m || editing ? (
        <MorningForm day={day} onSaved={() => setEditing(false)} />
      ) : (
        <>
          <p className="ledger-intention">“{m.intention}”</p>
          <div className="row"><span className="label">Max trades</span><span className="num">{m.maxTrades}</span></div>
          <div className="row"><span className="label">Max risk</span><span className="num">{m.maxRisk}</span></div>
          <div className="row"><span className="label">State</span><span>{m.state}</span></div>
          {primary && (
            <div className="composed">
              <div className="composed-body">{composeMorning(state, day)}</div>
              <CopyButton text={composeMorning(state, day)}>Copy for the room</CopyButton>
            </div>
          )}
          <button className="entry-edit label" onClick={() => setEditing(true)}>
            Amend
          </button>
        </>
      )}
    </section>
  );
}

function EveningSection({ day, primary }: { day: DayEntry; primary: boolean }) {
  const state = useLedger();
  const [editing, setEditing] = useState(false);
  const e = day.evening;

  if (!primary && !e) {
    return (
      <section className="ledger-section">
        <div className="section-head">
          <span className="label">Post-market</span>
          <span className="status num">CLOSES {EVENING_HOUR}:00</span>
        </div>
        <p className="ledger-pending">The evening entry opens at the close. Return then.</p>
      </section>
    );
  }

  return (
    <section className="ledger-section">
      <div className="section-head">
        <span className="label">Post-market</span>
        <span className="status num">
          {e ? `CLOSED ${new Date(e.at).toTimeString().slice(0, 5)}` : 'OPEN'}
        </span>
      </div>
      {!e || editing ? (
        <EveningForm day={day} onSaved={() => setEditing(false)} />
      ) : (
        <>
          <div className="row">
            <span className="label">Plan followed</span>
            <span className={e.planFollowed ? undefined : 'ledger-wax'}>{e.planFollowed ? 'Yes' : 'No'}</span>
          </div>
          <div className="row">
            <span className="label">Trades</span>
            <span className="num">
              {e.trades}{day.morning ? ` / ${day.morning.maxTrades}` : ''}
            </span>
          </div>
          <div className="row">
            <span className="label">Rules breached</span>
            <span className={e.breachedRuleIds.length > 0 ? 'ledger-wax num' : 'num'}>
              {e.breachedRuleIds.length === 0 ? 'None' : e.breachedRuleIds.length}
            </span>
          </div>
          <div className="composed">
            <div className="composed-body">{composeEvening(state, day)}</div>
            <CopyButton text={composeEvening(state, day)}>Copy for the room</CopyButton>
          </div>
          <button className="entry-edit label" onClick={() => setEditing(true)}>
            Amend
          </button>
        </>
      )}
    </section>
  );
}

export function Ledger() {
  const state = useLedger();
  const today = todayISO();
  const day: DayEntry = state.days[today] ?? { date: today };
  const d = fromISO(today);
  const eveningPrimary = new Date().getHours() >= EVENING_HOUR || (!!day.morning && !!day.evening);
  const dayNo = daysUnderContract(state);
  const hijri = hijriDate(d);

  return (
    <div className="ledger">
      <div className="ledger-dateline">
        <h1 className="ledger-day">{weekdayName(d)}</h1>
        <p className="ledger-datesub num">
          {longDate(d)}{hijri ? ` · ${hijri}` : ''}{dayNo > 0 ? ` · DAY ${dayNo} UNDER CONTRACT` : ''}
        </p>
      </div>

      <Debts />

      {eveningPrimary ? (
        <>
          <EveningSection day={day} primary />
          <MorningSection day={day} primary={false} />
        </>
      ) : (
        <>
          <MorningSection day={day} primary />
          <EveningSection day={day} primary={false} />
        </>
      )}
    </div>
  );
}
