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

  return (
    <div className={`shell${inkSurface ? ' ink-ground' : ' grain'}`}>
      <div className="shell-inner app-scroll">
        <nav className="tabs" aria-label="The ledger">
          {TABS.map((t) => {
            const disabled = auditOnly && t.id !== 'audit';
            return (
              <button
                key={t.id}
                className={`tab label${tab === t.id ? ' tab-active' : ''}`}
                aria-current={tab === t.id ? 'page' : undefined}
                disabled={disabled}
                onClick={() => setTab(t.id)}
              >
                {t.name}
              </button>
            );
          })}
          <button className="breaker-trigger" aria-label="Start the circuit breaker" onClick={startBreaker}>
            <SealMark />
            <span className="label breaker-trigger-label">Breaker</span>
          </button>
        </nav>

        <main className="shell-main">
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
