import { useState } from 'react';
import { setState, useLedger } from '../store/store';
import type { Rule } from '../store/types';
import { RULE_LIBRARY, suggestRules } from '../content/rules';
import { SealStamped } from '../components/Icons';
import { exportContractDoc } from '../lib/exportCard';
import { longDate } from '../lib/dates';
import './contract.css';

function blankRule(id: string): Rule {
  return { id, libraryId: null, title: '', when: '', then: '', noExceptions: '', price: '' };
}

interface SlotProps {
  rule: Rule;
  index: number;
  onChange: (r: Rule) => void;
}

function Slot({ rule, index, onChange }: SlotProps) {
  const [editing, setEditing] = useState(rule.title === '');

  function pick(libraryId: string) {
    if (libraryId === 'own') {
      onChange(blankRule(rule.id));
      setEditing(true);
      return;
    }
    const lib = RULE_LIBRARY.find((r) => r.id === libraryId)!;
    onChange({
      id: rule.id,
      libraryId: lib.id,
      title: lib.title,
      when: lib.when,
      then: lib.then,
      noExceptions: lib.noExceptions,
      price: lib.price,
    });
    setEditing(false);
  }

  function set<K extends keyof Rule>(k: K, v: Rule[K]) {
    onChange({ ...rule, [k]: v, libraryId: null });
  }

  return (
    <div className="slot">
      <div className="slot-head">
        <span className="num slot-no">{String(index + 1).padStart(2, '0')}</span>
        {editing ? (
          <input
            className="slot-title-input"
            value={rule.title}
            onChange={(e) => set('title', e.target.value)}
            placeholder="Name the rule"
            aria-label={`Rule ${index + 1} title`}
          />
        ) : (
          <h3 className="slot-title">{rule.title}</h3>
        )}
        <button className="slot-action label" onClick={() => setEditing(!editing)}>
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>

      {editing ? (
        <div className="slot-fields">
          <label className="field">
            <span className="field-label label">When — the observable trigger</span>
            <input value={rule.when} onChange={(e) => set('when', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label label">Then — one physical action</span>
            <input value={rule.then} onChange={(e) => set('then', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label label">No exceptions, including — the loophole, named</span>
            <input value={rule.noExceptions} onChange={(e) => set('noExceptions', e.target.value)} />
          </label>
          <label className="field">
            <span className="field-label label">The price — paid within 24 hours</span>
            <input value={rule.price} onChange={(e) => set('price', e.target.value)} />
          </label>
        </div>
      ) : (
        <div className="slot-body">
          <p><span className="slot-k">When</span> {rule.when}</p>
          <p><span className="slot-k">Then</span> {rule.then}</p>
          <p><span className="slot-k">No exceptions, including</span> {rule.noExceptions}</p>
          <p className="slot-price"><span className="slot-k">The price</span> {rule.price}</p>
        </div>
      )}

      <label className="slot-swap">
        <span className="label slot-swap-label">From the library</span>
        <select
          value={rule.libraryId ?? 'own'}
          onChange={(e) => pick(e.target.value)}
          aria-label={`Replace rule ${index + 1} from the library`}
        >
          {RULE_LIBRARY.map((r) => (
            <option key={r.id} value={r.id}>
              {r.id} — {r.title}
            </option>
          ))}
          <option value="own">Write my own</option>
        </select>
      </label>
    </div>
  );
}

function Builder({ amending, onDone }: { amending: boolean; onDone: () => void }) {
  const state = useLedger();
  const audit = state.audit!;
  const [rules, setRules] = useState<Rule[]>(() => {
    if (amending && state.contract) return state.contract.current.rules.map((r) => ({ ...r }));
    return suggestRules(audit.dominant, audit.seconded).map((lib, i) => ({
      id: `r${i + 1}`,
      libraryId: lib.id,
      title: lib.title,
      when: lib.when,
      then: lib.then,
      noExceptions: lib.noExceptions,
      price: lib.price,
    }));
  });
  const [name, setName] = useState(state.settings.name || state.contract?.current.signedName || '');
  const [avgLoss, setAvgLoss] = useState(
    state.settings.avgTiltLoss > 0 ? String(state.settings.avgTiltLoss) : ''
  );
  const [baseline, setBaseline] = useState(
    state.settings.baselineBreachesPerWeek > 0 ? String(state.settings.baselineBreachesPerWeek) : ''
  );

  const complete =
    rules.every((r) => r.title && r.when && r.then && r.noExceptions && r.price) &&
    name.trim().length > 1;

  function sign() {
    const signedAt = new Date().toISOString();
    setState((s) => {
      const prev = s.contract;
      const version = prev ? prev.current.version + 1 : 1;
      return {
        contract: {
          current: { version, rules, signedName: name.trim(), signedAt },
          history: prev ? [...prev.history, prev.current] : [],
        },
        settings: {
          name: name.trim(),
          avgTiltLoss: Number(avgLoss) || 0,
          baselineBreachesPerWeek: Number(baseline) || 0,
        },
      };
    });
    sessionStorage.setItem('seal-fresh', '1');
    onDone();
  }

  return (
    <div className="contract-builder">
      <header className="contract-masthead">
        <span className="label">The Contract{amending ? ` — amendment` : ''}</span>
        <span className="num">{rules.length} RULES</span>
      </header>
      <p className="contract-lede">
        Five rules, seeded from your audit. Accept them, sharpen them, or write your own. Each
        names its trigger, its action, its loophole, and its price.
      </p>

      {rules.map((r, i) => (
        <Slot
          key={r.id}
          rule={r}
          index={i}
          onChange={(nr) => setRules(rules.map((x) => (x.id === nr.id ? nr : x)))}
        />
      ))}

      <div className="contract-stakes">
        <div className="section-head">
          <span className="label">The stakes</span>
        </div>
        <label className="field">
          <span className="field-label label">Your name, as you sign it</span>
          <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </label>
        <label className="field">
          <span className="field-label label">Your average tilt loss, in dollars — be honest</span>
          <input
            value={avgLoss}
            onChange={(e) => setAvgLoss(e.target.value.replace(/[^0-9]/g, ''))}
            inputMode="numeric"
          />
        </label>
        <label className="field">
          <span className="field-label label">Rule-breaks per week, before today — your estimate</span>
          <input
            value={baseline}
            onChange={(e) => setBaseline(e.target.value.replace(/[^0-9.]/g, ''))}
            inputMode="decimal"
          />
        </label>
      </div>

      <button className="btn btn-solid-ink contract-sign" disabled={!complete} onClick={sign}>
        Sign and seal
      </button>
      {!complete && (
        <p className="contract-incomplete">Every rule complete, every field named — then it takes your signature.</p>
      )}
    </div>
  );
}

function Signed({ onAmend }: { onAmend: () => void }) {
  const state = useLedger();
  const c = state.contract!;
  const [stamping] = useState(() => {
    const fresh = sessionStorage.getItem('seal-fresh') === '1';
    sessionStorage.removeItem('seal-fresh');
    return fresh;
  });

  return (
    <div className="contract-doc-wrap">
      <div className="contract-doc">
        <p className="label contract-doc-version">The Contract · v{c.current.version}</p>
        <h2 className="contract-doc-title">Five Rules. No&nbsp;Exceptions.</h2>

        {c.current.rules.map((r, i) => (
          <div className="doc-rule" key={r.id}>
            <div className="doc-rule-head">
              <span className="num doc-rule-no">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="doc-rule-title">{r.title}</h3>
            </div>
            <p><span className="slot-k">When</span> {r.when}</p>
            <p><span className="slot-k">Then</span> {r.then}</p>
            <p><span className="slot-k">No exceptions, including</span> {r.noExceptions}</p>
            <p><span className="slot-k">The price</span> {r.price}</p>
          </div>
        ))}

        <div className="doc-signature">
          <div>
            <p className="doc-signed-name">{c.current.signedName}</p>
            <p className="num doc-signed-date">SIGNED {longDate(new Date(c.current.signedAt)).toUpperCase()}</p>
          </div>
          <div className={stamping ? 'seal-stamping' : undefined}>
            <SealStamped size={72} />
          </div>
        </div>
      </div>

      <div className="contract-doc-actions">
        <button className="btn" onClick={() => exportContractDoc(state)}>
          Export the document
        </button>
        <button className="btn" onClick={onAmend}>
          Amend — becomes v{c.current.version + 1}
        </button>
      </div>
      {c.history.length > 0 && (
        <p className="contract-history num">
          PRIOR VERSIONS: {c.history.map((h) => `v${h.version}`).join(' · ')}
        </p>
      )}
    </div>
  );
}

export function Contract({ onAudit }: { onAudit: () => void }) {
  const state = useLedger();
  const [amending, setAmending] = useState(false);

  if (!state.audit) {
    return (
      <div className="contract-empty">
        <p className="contract-empty-line">No contract without a verdict.</p>
        <p className="contract-empty-sub">The audit reads you first, then seeds your five rules.</p>
        <button className="btn btn-solid-ink" onClick={onAudit}>
          Take the audit
        </button>
      </div>
    );
  }

  if (!state.contract || amending) {
    return <Builder amending={amending} onDone={() => setAmending(false)} />;
  }

  return <Signed onAmend={() => setAmending(true)} />;
}
