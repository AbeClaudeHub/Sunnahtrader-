import { useEffect, useState } from 'react';
import { useLedger } from '../store/store';
import { SealMark } from '../components/Icons';
import { Audit } from './Audit';
import { Contract } from './Contract';
import { Ledger } from './Ledger';
import { Record } from './Record';
import { Breaker, startBreaker } from './Breaker';
import './appshell.css';

type Tab = 'ledger' | 'contract' | 'record' | 'audit';

const TABS: Array<{ id: Tab; name: string }> = [
  { id: 'ledger', name: 'Ledger' },
  { id: 'contract', name: 'Contract' },
  { id: 'record', name: 'Record' },
  { id: 'audit', name: 'Audit' },
];

export function AppShell() {
  const state = useLedger();
  const [tab, setTab] = useState<Tab>(() => {
    if (!state.audit) return 'audit';
    if (!state.contract) return 'contract';
    return 'ledger';
  });

  // the audit is the front door: until it's done, the door is the house
  const auditOnly = !state.audit && !state.contract;
  const inkSurface = tab === 'audit';

  useEffect(() => {
    document.documentElement.style.background = inkSurface ? 'var(--ink)' : 'var(--paper)';
    return () => {
      document.documentElement.style.background = 'var(--paper)';
    };
  }, [inkSurface]);

  // arrow keys walk the enabled tabs; focus follows selection (roving tabindex)
  function onTabKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const enabled = TABS.filter((t) => !(auditOnly && t.id !== 'audit'));
    const i = enabled.findIndex((t) => t.id === tab);
    let next: Tab | null = null;
    if (e.key === 'ArrowRight') next = enabled[(i + 1) % enabled.length].id;
    else if (e.key === 'ArrowLeft') next = enabled[(i - 1 + enabled.length) % enabled.length].id;
    else if (e.key === 'Home') next = enabled[0].id;
    else if (e.key === 'End') next = enabled[enabled.length - 1].id;
    if (!next) return;
    e.preventDefault();
    setTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  return (
    <div className={`shell${inkSurface ? ' ink-ground' : ' grain'}`}>
      <div className="shell-inner app-scroll">
        <nav className="tabs" aria-label="The ledger">
          <div className="tabs-list" role="tablist" aria-label="Ledger pages" onKeyDown={onTabKeyDown}>
            {TABS.map((t) => {
              const disabled = auditOnly && t.id !== 'audit';
              const selected = tab === t.id;
              return (
                <button
                  key={t.id}
                  id={`tab-${t.id}`}
                  role="tab"
                  aria-selected={selected}
                  aria-controls="ledger-panel"
                  tabIndex={selected ? 0 : -1}
                  className={`tab label${selected ? ' tab-active' : ''}`}
                  disabled={disabled}
                  onClick={() => setTab(t.id)}
                >
                  {t.name}
                </button>
              );
            })}
          </div>
          {/* the wax seal alone is the trigger — the strip keeps one baseline */}
          <button
            className="breaker-trigger"
            aria-label="Start the circuit breaker"
            title="Circuit breaker"
            onClick={startBreaker}
          >
            <SealMark size={28} />
          </button>
        </nav>

        <main
          className="shell-main"
          id="ledger-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
        >
          {tab === 'ledger' && <Ledger />}
          {tab === 'contract' && <Contract onAudit={() => setTab('audit')} />}
          {tab === 'record' && <Record />}
          {tab === 'audit' && <Audit onContract={() => setTab('contract')} />}
        </main>
      </div>

      {state.breaker.active && <Breaker />}
    </div>
  );
}
