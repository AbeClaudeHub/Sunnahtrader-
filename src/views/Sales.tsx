import { useState } from 'react';
import { SealStamped } from '../components/Icons';
import { formatMoney } from '../lib/dates';
import './sales.css';

// the founder replaces this with the live Stripe payment link
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/STRIPE_PAYMENT_LINK';

function Payback() {
  const [loss, setLoss] = useState('300');
  const n = Number(loss) || 0;
  const multiple = n > 0 ? n / 27 : 0;

  return (
    <div className="payback">
      <label className="payback-input-row">
        <span className="payback-q">Your average tilt loss — the number you’d rather not type:</span>
        <span className="payback-field num">
          $
          <input
            value={loss}
            onChange={(e) => setLoss(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
            inputMode="numeric"
            aria-label="Your average tilt loss in dollars"
          />
        </span>
      </label>
      {n > 0 ? (
        <p className="payback-result">
          One prevented revenge trade keeps <span className="num">{formatMoney(n)}</span> in your
          account. THE LEDGER costs $27 — one save pays for it{' '}
          {multiple >= 2 ? (
            <>
              <span className="num">{multiple >= 10 ? Math.round(multiple) : multiple.toFixed(1)}</span>{' '}
              times over.
            </>
          ) : (
            'outright.'
          )}{' '}
          It only has to work once. It is built to work daily.
        </p>
      ) : (
        <p className="payback-result payback-waiting">Type the number. The arithmetic is patient.</p>
      )}
    </div>
  );
}

export function Sales({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="sales grain">
      {/* VERSE SLOT: intention */}
      <header className="sales-hero">
        <p className="label sales-brand">Niyyah — The Ledger</p>
        <h1 className="sales-h1">
          Every trader keeps two records. This is the honest one.
        </h1>
        <p className="sales-sub">
          For traders in accountability rooms. It writes your daily check-in, holds your rulebook,
          runs your tilt protocol, and keeps the one record you can’t quietly edit.
        </p>
        <a className="btn btn-solid-ink sales-cta" href={STRIPE_PAYMENT_LINK}>
          Take the ledger — $27
        </a>
        <p className="sales-cta-sub num">ONE PURCHASE · YOURS FOREVER</p>
      </header>

      <section className="sales-section" aria-labelledby="day-h">
        <div className="section-head"><span className="label" id="day-h">One trader’s Tuesday</span></div>

        <div className="sales-moment">
          <p className="sales-time num">08:46</p>
          <div>
            <h2 className="sales-moment-h">The morning entry</h2>
            <p>
              Intention, max trades, max risk, one word for your state. Two minutes. The ledger
              composes the check-in and one tap copies it for the room. You were posting one
              anyway — now it takes no effort and reads like you mean it.
            </p>
          </div>
        </div>

        <div className="sales-moment">
          <p className="sales-time num">09:31</p>
          <div>
            <h2 className="sales-moment-h">The open</h2>
            <p>
              Your contract sits one tab away: five rules in your own words, each with its trigger,
              its action, its named loophole, and its price. Written once, signed and sealed, amended
              only in the open — v1, v2, every version kept.
            </p>
          </div>
        </div>

        <div className="sales-moment">
          <p className="sales-time num">11:04</p>
          <div>
            <h2 className="sales-moment-h">The stop-out</h2>
            <p>
              The loss lands and the hand moves on its own — same chart, bigger size. This is the
              ten minutes that costs you everything, and this is why the seal is on every screen.
              One tap: fifteen minutes, screen dimmed, one instruction at a time, your own rule held
              up in front of you. Leaving early means typing{' '}
              <em>“I am choosing to break my contract”</em> — in full — and the record keeps that
              too. The revenge trade doesn’t happen.
            </p>
          </div>
        </div>

        <div className="sales-moment">
          <p className="sales-time num">16:00</p>
          <div>
            <h2 className="sales-moment-h">The close</h2>
            <p>
              Plan followed, trades against max, rules breached — tap which — one honest line.
              Breaches flow straight into the record with their price. Unpaid prices stand on the
              page until they’re paid. Missed days stay as gaps. There is no streak repair here.
            </p>
          </div>
        </div>

        <div className="sales-moment">
          <p className="sales-time num">FRI</p>
          <div>
            <h2 className="sales-moment-h">The weekly ledger</h2>
            <p>
              Days logged, integrity score, clean streaks per rule, and an exportable card built for
              the room — the kind of artifact people screenshot. Before any of it: a sixteen-question
              audit that names your saboteur — Ego, Greed, Anger, or Doubt — and writes your profile
              in your own inner monologue. That verdict seeds the whole book.
            </p>
          </div>
        </div>
      </section>

      <section className="sales-section" aria-labelledby="math-h">
        <div className="section-head"><span className="label" id="math-h">The arithmetic</span></div>
        <Payback />
      </section>

      <section className="sales-section" aria-labelledby="not-h">
        <div className="section-head"><span className="label" id="not-h">Who this is not for</span></div>
        <ul className="sales-not">
          <li>You want signals. There are none here.</li>
          <li>You want a strategy. The ledger assumes you already have one you keep betraying.</li>
          <li>You want encouragement. The ledger is a witness, not a coach.</li>
          <li>You trade alone and answer to no one. This instrument is built for rooms.</li>
        </ul>
      </section>

      <section className="sales-close" aria-label="Purchase">
        <div className="sales-close-seal"><SealStamped size={72} /></div>
        <h2 className="sales-close-h">Your discipline, on the record.</h2>
        <a className="btn btn-solid-ink sales-cta" href={STRIPE_PAYMENT_LINK}>
          Take the ledger — $27
        </a>
        <button className="sales-open label" onClick={onOpen}>
          Already sealed in? Open the ledger
        </button>
      </section>

      <footer className="sales-footer">
        <span className="label">The Ledger</span>
        <a className="label sales-footer-handle" href="https://instagram.com/abealwan">@abealwan</a>
      </footer>
    </div>
  );
}
