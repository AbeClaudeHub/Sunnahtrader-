# NIYYAH — THE LEDGER · Product Audit

*A first-principles audit of the product, the funnel, the retention loops, and the business model — with the highest-leverage fixes implemented in this same branch.*

---

## 1. Current Product Score: 71 / 100

The behavioral spine is real and rare: diagnosis (Audit) → commitment device (Contract) → daily ritual (Ledger) → interruption protocol (Breaker) → evidence (Record). The voice is world-class — restrained, literary, never coachy. The friction design (typed exit phrase, exit below the fold, gaps that stay, prices that sit unpaid on the page) is better behavioral engineering than products with 100× the budget.

What kept it from scoring higher: the funnel was inverted (the best artifact was behind the paywall), transformation was asserted but never *measured* (re-running the audit deleted the old reading), and the Islamic identity — the one moat no competitor can copy — was decorative (`VERSE SLOT` comments sat empty in the code).

## 2. Maximum Possible Score (this concept, fully executed): 93 / 100

The ceiling is high because the concept is correctly *not* a trading journal. TradeZella measures trades. This measures the trader. The remaining 7 points require a backend (real room presence, witnessed contracts), which is a deliberate v2 decision, not an oversight.

## 3. Biggest Weaknesses (found)

1. **Inverted funnel.** The audit — a free-to-deliver, emotionally explosive diagnostic — required $27 before anyone could feel it. Diagnosis must be free; the prescription is the product.
2. **No proof of improvement.** `Re-run the audit` overwrote the old result. The single artifact that answers "is this working?" was destroyed by the act of asking.
3. **Decorative deen.** Named *Niyyah*, repo named *Sunnahtrader*, hijri date in the corner — and zero scripture, zero muhasabah framing, empty verse slots. For this audience, that's leaving the moat unbuilt.
4. **No arc.** "Day N under contract" counts up forever. Nothing happens at 30. Open-ended products decay; terms renew.
5. **Stripe link is a placeholder and the gate is bypassed** (known, pre-release — now centralized in `src/lib/access.ts` with a single `PRE_RELEASE` flag).

## 4. Biggest Opportunities

1. **The free audit as the room's entry ritual.** "Take the audit, post your verdict card" costs nothing, fills Discord with EGO/GREED/ANGER/DOUBT cards, and every card is an ad with a built-in question ("what's yours?").
2. **The 30-day re-reading.** Audit v1 vs. audit v2, side by side, is the testimonial machine: "ANGER 14 → 11" is screenshot-able proof of transformation that no journal can produce.
3. **The room itself as the premium product.** The Ledger at $27 is the wedge; paid accountability rooms (5–8 traders, a shared Friday ledger, witnessed contracts) are the recurring business.

## 5. Features Deleted

- **`Gate.tsx` / `gate.css`** — the full-screen paywall at the front door. Replaced by an inline seal between verdict and signature (`Contract.tsx`). The door is now open; the signature is what costs money.
- **Audit-overwrite-on-retake** — replaced with archival (`audits[]`, schema v2 with migration).

## 6. Features Added (implemented in this branch)

| Feature | Where | Why |
|---|---|---|
| Free-audit funnel | `Sales.tsx`, `main.tsx`, `access.ts` | Diagnosis free, prescription paid. Secondary CTA: "begin with the audit — free." |
| Paywall at the signature | `Contract.tsx` | The prospect has already read their verdict and edited five rules before meeting the price — maximum investment at the moment of payment. |
| Audit history + verdict delta | `Audit.tsx`, store schema v2 | "Against your last reading: ANGER 14 → 11 (−3)" with a gold verdict line. Proof of movement, in either direction. |
| The re-reading ritual | `Record.tsx` | At 30+ days since the last reading, the Record prompts a re-audit. This is the renewal arc. |
| Clean-day streak | `stats.ts`, Record, evening check-in | "7 clean days in a row" flows into the composed room post — social proof that compounds in Discord. |
| Three verses, three slots | `Verse.tsx`, Sales / Verdict / Breaker | Intention (Bukhari & Muslim) on the sales page; self-accounting (59:18) on the verdict; restraint in anger (Bukhari) inside the breaker — scripture exactly where the feeling lives, never as wallpaper. |

## 7. Positioning

Keep: **"Every trader keeps two records. This is the honest one."** It is the best line in the product.
Sharpen the category: this is not a journal and must never drift toward one. It is a **discipline instrument for Muslim traders in accountability rooms** — muhasabah, made mechanical. The verses now make that positioning structural instead of implied.

## 8. Pricing

- **$27 one-time: keep it.** It is the no-brainer wedge, priced below one tilt loss (the Payback calculator already makes this argument perfectly).
- **Do not subscription-ify the ledger.** A witness you rent is a witness you can fire; "yours forever" is part of the honesty claim.
- **The recurring revenue belongs to the rooms:** $19–49/mo premium accountability rooms (5–8 seats, founder-led Friday review of exported weekly cards). The ledger is the room's textbook; every member buys one.
- Later: a "second signature" tier — a contract co-signed by a room partner who is notified of breaches. Price: $97/term. That's the product people can't leave.

## 9. Retention Analysis

Existing loops (kept): morning/evening entry pair, debts that sit on the page, gaps that stay, per-rule clean streaks, day-counter under contract.
Added loops: clean-day streak (identity: "I am a 12-clean-day trader"), the 30-day re-reading (an appointment with proof), delta verdicts (the reason to keep entering data is that the *next* reading needs it).
The deepest retention mechanic remains the room: the composed check-in means quitting the app is now *visible to the room* — social cost of churn, felt daily, manipulating no one.

## 10. Conversion Analysis

Old funnel: cold page → $27 → audit. New funnel: cold page → free 16-question audit → personal verdict in your own inner monologue → five rules pre-written *for your saboteur* → edit them (IKEA effect) → meet the seal at the moment of maximum self-recognition → $27.
Every step raises commitment before raising price. The verdict card export gives the room a shareable artifact pre-purchase — each one recruits the next member.

## 11. Community Integration

The copy-for-the-room composer is the right architecture: **Discord is the backend.** No feeds to moderate, no empty-room cold start. Added: streak lines in the evening post. Next (v2): a room code that stamps exported cards, so cards from the same room read as a set.

## 12. Accountability-Room Fit

If a trader spends 30 days in a room, the obvious next product is *the instrument the room already speaks through*. This product, post-changes, is exactly that: it writes the check-ins members already owe, names the saboteur the room already teases them about, and produces the Friday card the room already wants to see. Verdict: **correct product; do not pivot.** The audit-first funnel makes it the natural day-one ritual for every new room member.

## 13. Viral Loops

1. Verdict card (free, day 0) — "what's your saboteur?"
2. Weekly card (paid, every Friday) — integrity score as room status.
3. Delta verdict (day 30) — the transformation screenshot, the strongest of the three.
All three are 1080×1350 exportable artifacts. The product's growth surface is other people's Discord servers and Instagram stories.

## 14. Competitive Analysis

- **TradeZella / Tradervue / Edgewonk:** measure trades, assume discipline. Niyyah measures discipline, assumes a strategy. No overlap in soul; don't add analytics, ever.
- **Generic accountability Discords:** have the people but no instrument — check-ins are freeform and die in two weeks. Niyyah is the instrument they're missing.
- **Habit apps (Streaks, Way of Life):** generic, no stakes, no witness, no deen.
- **Nothing serves the Muslim trader as a Muslim.** The verses + hijri date + sadaqah-denominated prices make this the only product in the category that knows who it's for.

## 15. The Exact Product to Sell

**The Ledger, $27 one-time, audit free** — sold inside accountability rooms as the room's standard equipment, with premium rooms as the recurring layer on top.

## 16. Why It Wins
It is the only product where the price of breaking your rule was written by you, witnessed by your room, and denominated in sadaqah.

## 17. Why Users Stay
The record is theirs, local, permanent — and the next verdict needs their entries. Leaving means the room notices by sunset.

## 18. Why Users Upgrade
The ledger proves the system works alone; the premium room is the same system with witnesses. The day-30 delta is the upgrade ad.

## 19. Why Users Refer
The verdict card asks a question every trader wants answered ("what's *your* saboteur?"), and answering it is free.

---

### What the customer is actually buying

Not a journal — **a witness that cannot be edited.**
Not an audit — **being named, accurately, for the first time.**
Not a contract — **a version of themselves with a signature on it.**
Not a circuit breaker — **the ten minutes that used to cost $300, returned.**
Not a record — **proof, in their own handwriting, that they are no longer the reason they lose.**
