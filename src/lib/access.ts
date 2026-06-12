import { getState, setState } from '../store/store';

// the founder replaces this with the live Stripe payment link
export const STRIPE_PAYMENT_LINK = 'https://buy.stripe.com/STRIPE_PAYMENT_LINK';

// pre-release: the seal is open — set to false before launch
const PRE_RELEASE = true;

/** the receipt link carries ?access=granted — record the key the moment it arrives */
export function captureAccess(): void {
  const params = new URLSearchParams(location.search);
  if (params.get('access') === 'granted' && !getState().access) {
    setState({ access: true });
  }
}

/**
 * the audit is free — access gates the signature, not the door.
 * a verdict costs nothing; the contract, the daily ledger, the breaker,
 * and the record open with one purchase.
 */
export function hasAccess(): boolean {
  if (PRE_RELEASE) return true;
  if (getState().access) return true;
  const h = location.hostname;
  return location.protocol === 'file:' || h === 'localhost' || h === '127.0.0.1';
}
