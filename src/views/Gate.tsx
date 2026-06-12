import { SealStamped } from '../components/Icons';
import './gate.css';

// the founder replaces this with the live Stripe payment link
const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/STRIPE_PAYMENT_LINK';

export function Gate() {
  return (
    <div className="gate ink-ground">
      <div className="gate-inner">
        <p className="label gate-label">Niyyah</p>
        <h1 className="gate-title">The Ledger is sealed.</h1>
        <div className="gate-seal">
          <SealStamped size={88} />
        </div>
        <p className="gate-sub">
          One purchase opens it forever. If you have bought it, open the link from your receipt —
          it carries the key.
        </p>
        <a className="btn btn-solid-paper gate-buy" href={STRIPE_PAYMENT_LINK}>
          Take the ledger — $27
        </a>
      </div>
    </div>
  );
}
