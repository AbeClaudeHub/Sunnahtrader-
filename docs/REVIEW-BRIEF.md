# THE LEDGER — Review Brief

A complete breakdown of this application for a reviewing agent. Everything here is verifiable
against the source in this repository; file paths are given throughout. Last updated 2026-06-12,
on branch `claude/fable-5-identification-q4c3l4`.

---

## 1. What the product is

**THE LEDGER** (brand: *Niyyah* — Arabic for "intention") is a single-purchase ($27),
local-first **discipline ledger for retail day traders who belong to accountability rooms**
(Discord/Telegram trading groups where members post daily check-ins).

It is explicitly **not** a trading tool. It gives no signals, no strategy, no P&L analytics.
Its premise: the trader already has a strategy they keep betraying under emotion, and what
they need is a witness. The product voice says this plainly on the sales page: *"The ledger
is a witness, not a coach."*

The app does five things:

1. **The Audit** — a 16-question psychometric that names the trader's dominant "saboteur"
   (Ego, Greed, Anger, or Doubt) and renders a written verdict in the trader's own inner
   monologue.
2. **The Contract** — five personal trading rules (seeded from the audit verdict), each with
   a trigger, an action, a named loophole, and a self-imposed price. Signed, sealed, versioned.
3. **The Daily Ledger** — a morning entry (intention, max trades, max risk, one-word state)
   and an evening entry (plan followed?, trades taken, rules breached, one honest line). Each
   entry composes a formatted check-in message with one-tap copy, built to be pasted into the
   trader's accountability room.
4. **The Circuit Breaker** — a 15-minute full-screen takeover for tilt moments (post-stop-out
   revenge-trade urges). Three timed steps. Leaving early requires typing
   *"I am choosing to break my contract"* verbatim, and is recorded as a breach.
5. **The Record** — the permanent ledger: integrity score, day strip, clean streaks per rule,
   breach history with paid/owed status, a day-by-day journal ("the book"), a money-saved
   estimate, weekly summary, and shareable PNG export cards.

**Core design ethic: the record cannot be quietly edited.** Missed days stay as visible gaps
("the gap is the point" — `src/views/Record.tsx`), breaches stand until marked paid, early
breaker exits are logged, and contract amendments preserve every prior version.

There is a light Islamic register: the brand name Niyyah, the Hijri date displayed alongside
the Gregorian date in the daily ledger (`hijriDate()` in `src/lib/dates.ts`, via
`Intl.DateTimeFormat` with the `islamic-umalqura` calendar), the repo name "Sunnahtrader",
and `{/* VERSE SLOT: ... */}` placeholder comments in `Sales.tsx`, `Audit.tsx` (verdict), and
`Breaker.tsx` where Quranic verses on intention, self-accounting, and restraint in anger are
evidently planned but not yet inserted.

## 2. Business model and distribution

- **One purchase, $27, yours forever.** No subscription. The sales page leans on payback
  arithmetic: one prevented revenge trade (user states their average tilt loss, default
  $300) pays for the product many times over.
- Stripe payment links are **placeholders** (`https://buy.stripe.com/STRIPE_PAYMENT_LINK`
  in `src/views/Sales.tsx` and `src/views/Gate.tsx`).
- Access model: a soft gate. `?access=granted` on the URL (intended to be carried by the
  Stripe receipt link) sets a persistent `access: true` flag in localStorage. Localhost and
  `file:` always pass. **Currently the gate is bypassed entirely** — `hasAccess()` in
  `src/main.tsx` returns `true` unconditionally, marked `// pre-release: gate off — remove
  this line before launch`. This is intentional pre-launch state (commit `9c301c4`).
- Footer links to Instagram `@abealwan`.
- Privacy stance: all data lives in the browser's localStorage. There is no backend, no
  account, no analytics, no network calls at runtime (other than fetching its own static
  assets). The audit screen promises "No one sees this but you" — and the architecture
  makes that literally true.

## 3. Tech stack and architecture

| Layer | Choice |
|---|---|
| Framework | React 18.3 (`react`, `react-dom` are the only runtime deps) |
| Language | TypeScript 5.6, strict via `tsc -b` in the build |
| Build | Vite 5.4, `base: './'`, target es2020, assets never inlined |
| State | Hand-rolled store: module-level state + `useSyncExternalStore` (`src/store/store.ts`) |
| Persistence | localStorage key `the-ledger-v1`, schema-versioned with a migration ladder |
| Routing | Two routes only: `/` (sales) and `/app`. `history.pushState` normally; hash routing (`#/app`) on `file:` protocol. No router library. |
| Offline | Manual service worker (`public/sw.js`), cache-first for same-origin assets, network-first for navigations. PWA manifest + icons. |
| Styling | Plain CSS, one file per view + `src/styles/tokens.css` design tokens. No CSS framework. |
| Testing | Playwright end-to-end "journey" (`scripts/journey.mjs`) — 43 checks against the built `dist/`, with a faked clock. No unit tests. |
| Deploy | Vercel (`vercel.json` rewrites `/app` → `index.html`) |

There are **zero third-party runtime dependencies beyond React**. Export cards are drawn
by hand on `<canvas>`; gauges and icons are hand-built SVG; even the routing and store
are bespoke. Total JS bundle: ~212 KB (~67 KB gzip).

### File map

```
index.html                  meta, font preloads, noscript fallback, OG/Twitter tags
src/main.tsx                routing, access gate, SW registration
src/store/store.ts          load/persist/migrate, useLedger(), import/export/validate JSON
src/store/types.ts          the entire data model (~100 lines, documented)
src/views/Sales.tsx/.css    the sales page ("/")
src/views/Gate.tsx/.css     the paywall screen (shown when access is off)
src/views/AppShell.tsx      tab nav (Ledger/Contract/Record/Audit) + Breaker trigger
src/views/Audit.tsx/.css    intro → 16 questions → verdict
src/views/Contract.tsx/.css builder (5 rule slots) → signed document → amendments
src/views/Ledger.tsx/.css   today's morning/evening entries, debts, compose+copy
src/views/Breaker.tsx/.css  the 15-minute takeover
src/views/Record.tsx/.css   stats, streaks, breach history, the book, exports, import
src/components/Gauges.tsx   verdict score columns (tremor-line SVG)
src/components/Icons.tsx    seal marks (SVG)
src/content/questions.ts    the 16 audit questions, 4 per saboteur
src/content/profiles.ts     the 4 verdict profiles (~150 words each, second person)
src/content/rules.ts        the 12-rule library (3 per saboteur) + suggestRules()
src/lib/score.ts            audit scoring with deterministic tie-breaking
src/lib/stats.ts            integrity, streaks, missed days, money-saved, week summary
src/lib/dates.ts            ISO/Gregorian/Hijri formatting, market-day math
src/lib/compose.ts          check-in/close message composition + clipboard
src/lib/exportCard.ts       canvas-drawn PNG exports + text/JSON export
scripts/journey.mjs         43-check e2e walkthrough (run: build first, then node it)
scripts/shoot.mjs           screenshot generator (npm run shots → shots/)
scripts/icons.mjs           PWA icon generator
prototype/                  earlier static HTML prototypes (gates 1–2), not shipped
```

### State and data model (`src/store/types.ts`)

One JSON document, schema-versioned (`schema: 1`), with a prepared (currently empty)
migration ladder in `store.ts`:

- `audit: AuditResult` — 16 answers (0–3), per-saboteur scores, dominant + seconded, timestamp.
- `auditDraft` — in-progress answers + index, so a refresh mid-audit resumes (tested).
- `contract: { current, history[] }` — each version: 5 `Rule`s + signedName + signedAt.
  Amendment pushes the old version into history; nothing is destroyed.
- `days: Record<YYYY-MM-DD, DayEntry>` — optional `morning` and `evening` per day.
- `breaches: Breach[]` — derived from evening entries (re-derived idempotently per day,
  preserving paid status) and from breaker early exits; each carries its rule title, price,
  and paid/owed state.
- `breaker: { active, sessions[] }` — an active session survives reload (wall-clock based).
- `settings` — name, stated average tilt loss, pre-contract breaches-per-week baseline
  (these feed the money-saved estimate).

Import/export: full-state JSON export; import is validated (`validateJSON`) before apply
and asks for confirmation when it would replace a living record; plain-text record export;
three canvas PNG cards (verdict, contract document, weekly card).

### Key derived metrics (`src/lib/stats.ts`)

- **Integrity score** = rule-days kept ÷ rule-days judged over logged evenings, 0–100,
  one decimal. The hero number of the Record tab.
- **Clean streak per rule** = consecutive most-recent logged evenings without breaching it.
- **Missed days** = market days (Mon–Fri) since signing with no entry; displayed, never
  repairable.
- **Money saved** = stated avg tilt loss × breaches prevented, where prevented =
  (baseline × weeks under contract) − actual breaches, floored at completed breaker runs.
  Honestly labeled as an estimate from the user's own numbers.

### Audit scoring (`src/lib/score.ts`)

4 questions per saboteur, answers 0–3, max 12 per saboteur. Dominant = highest total;
ties broken by count of "It's a pattern" (3-point) answers, then by a fixed order
(anger, ego, greed, doubt). Contract seeding (`suggestRules`): all 3 library rules for
the dominant saboteur + first 2 for the seconded.

## 4. Design system — "engraved ledger" aesthetic

The visual concept is a **19th-century ledger / engraved certificate**: ink on paper,
ruled lines, a wax seal. Defined in `src/styles/tokens.css`; the comment says
"Palette, type, spacing are locked."

**Palette (4 colors only, plus alpha steps):**

| Token | Value | Role |
|---|---|---|
| `--ink` | `#0F0D09` | near-black; text on paper, and the ground of "ink surfaces" |
| `--paper` | `#F0E9DB` | warm cream; the page |
| `--gold` | `#C2A14D` | accent: focus rings, dominant-saboteur score, the NIYYAH mark |
| `--wax` | `#7A2E1F` | wax-seal red, reserved **exclusively for breach states** ("wax: breach states only") |

**Surfaces:** light "paper" surfaces carry an SVG noise grain overlay (`.grain`); the
Audit, Gate, and Breaker are inverted "ink" surfaces (`.ink-ground`, paper text on ink).
The `<html>` background swaps with the active surface so iOS overscroll matches.

**Typography:**
- *Fraunces* (variable serif, self-hosted woff2) — display: verdict names, headlines,
  the signature (italic). Optical size axis used deliberately (`opsz`).
- *Inter* — UI text and `.label` (11px, 500, letterspaced 0.14em, uppercase — the
  ubiquitous small-caps label style).
- System monospace (`.num`) — every number, date, and counter, with tabular numerals.

**Layout language:** single column, mobile-first (~390px design width; `shots/` and the
journey use iPhone viewport). Every data row sits on a hairline "ruled line"
(0.5px borders). Section heads are a label + status on a rule. Buttons are full-width,
uppercase, letterspaced, square-cornered (`.btn`, solid-ink / solid-paper / ghost variants).
No border radii anywhere. No shadows. No gradients.

**Motion is rationed** — the codebase calls out "the four permitted motions": the verdict
gauge reveal (stroke-dashoffset draw-in, once per session), the contract seal stamping
animation (once, on fresh signing), button press scale (0.985), and the breaker's progress
track. `prefers-reduced-motion` collapses all of it globally.

**iPhone-native care** (commit `8485065`): safe-area insets, sticky tab strip, 16px minimum
input font so iOS never zooms on focus, `touch-action: manipulation`, `viewport-fit=cover`,
black-translucent status bar, standalone PWA display.

**Accessibility state:** visible gold `:focus-visible` outline everywhere; aria-labels on
icon buttons, SVGs (`role="img"` with score descriptions), and form groups; the breaker is
`role="dialog" aria-modal` and takes focus on open; audit questions are announced via an
`aria-live` region and answerable with keys 0–3; `.sr-only` utility exists. Not yet done:
a true focus *trap* in the breaker, `role=tablist` semantics on the tab strip.

**Copy voice** — treat the writing as part of the design. It is second-person, declarative,
slightly liturgical, never exclamatory: "The ledger has read you." / "Missed days stay as
gaps. There is no streak repair here." / "Sign it angry if you have to. Just sign it."
Buttons are sentences ("Enter it in the ledger", "Close the day", "Break the contract").
Any review of UI changes should check new copy against this voice.

## 5. User journeys (as built and tested)

1. **First open** (`/app`): every tab but Audit is disabled — "until it's done, the door is
   the house." Intro → 16 questions one at a time (back navigation allowed; refresh resumes
   mid-audit) → verdict page: saboteur name in huge Fraunces, gauges, written profile,
   export card, "Write the contract."
2. **Contract**: 5 slots pre-seeded from the verdict; each editable field-by-field or
   swappable against the 12-rule library; stakes section (name, avg tilt loss, baseline
   breaches/week); "Sign and seal" stamps the seal. Amending creates v2, v3… with prior
   versions listed.
3. **Daily loop**: before 16:00 the morning form leads; after 16:00 (or when both entries
   exist) the evening leads. Each saved entry renders a composed room message with one-tap
   copy. Evening breach taps create standing debts (wax-bordered, "Mark paid").
4. **Tilt moment**: Breaker button is on every screen in the tab strip. 15 minutes,
   wall-clock (survives reload), three steps at 0/5/10 minutes: hands off → name what
   happened (one line, saved) → your relevant contract rule held up (matched to dominant
   saboteur). Early exit = typed phrase + recorded breach.
5. **Record**: integrity hero number, 20-day tick strip (gaps visible), standing counts,
   per-rule clean streaks, breach history, the day-by-day book, money-saved arithmetic
   with the $27 payback line, weekly summary + PNG card, JSON/text export, guarded import.

## 6. Verification

- `npm run build` — tsc + vite, currently clean. (One benign warning: `./fonts/fonts.css`
  is resolved at runtime from `public/`, by design, to keep `file:` protocol support.)
- `node scripts/journey.mjs` (after a build; needs `npx playwright install chromium`) —
  **43/43 passing**. Covers: soft gate, refresh mid-audit, verdict, contract v1→v2
  versioning, morning/evening entries with compose+copy, breach→debt flow, breaker early
  exit and full completion (faked clock), exports (PNG/JSON/text), corrupt and non-ledger
  import refusal, import-over-living-record confirmation, the book, retake guard,
  full state round-trip, breaker surviving reload.
- `npm run shots` regenerates marketing/QA screenshots into `shots/`.

## 7. Known intentional pre-launch state (do not "fix" without asking the founder)

1. `hasAccess()` returns `true` unconditionally (`src/main.tsx`) — the paywall is off
   until launch. The journey test has a marked line to restore when the gate returns.
2. Stripe links are placeholders in `Sales.tsx` and `Gate.tsx`.
3. `{/* VERSE SLOT }` comments mark three places awaiting verse content.
4. `prototype/` is reference material from earlier build gates, not shipped code.

## 8. Honest weaknesses a reviewer should probe

- **No unit tests** — all coverage is the e2e journey; `stats.ts` edge cases (timezones,
  week boundaries, contract amended mid-week) are untested in isolation.
- **Timezone/DST**: all date math uses local time deliberately (a trader's "day" is local),
  but `daysUnderContract` divides epoch-ms by 86400000, which can be off by an hour across
  DST transitions; market days ignore exchange holidays.
- **Integrity math vs. amendments**: integrity and streaks judge past evenings against the
  *current* rule count/IDs; amending the contract subtly rewrites the denominator of history.
- **Breaches and edits**: re-saving an evening re-derives that day's evening breaches
  (preserving paid status), but a paid breach whose rule is untapped on re-save disappears
  from history — arguably correct, arguably revisionism in an app about not editing the record.
- **Single-device reality**: localStorage only; the export/import JSON flow is the entire
  backup/sync story. Clearing site data destroys the record. The sales page does not warn
  about this.
- **`exportJSON` includes `access: true`** — a shared backup file grants the paywall flag
  to whoever imports it (moot while the gate is off; worth revisiting at launch).
- **Breaker is honor-system**: nothing technically prevents closing the tab; the design
  accepts this (the record only knows what it is told — consistent with the evening
  entries, which are also self-reported).
- **No focus trap** in the breaker dialog; tab semantics on the nav are approximate.
- **SW cache** is named `the-ledger-v1` and never versioned per deploy; stale-asset risk
  is mitigated by network-first navigations + hashed asset names, but old entries accumulate.

## 9. Recent changes on this branch (df1f6f8)

Quality pass, all covered by new journey checks: the day-by-day book in Record; import
confirmation before replacing a living record (`validateJSON` added to the store); live
clock in the Ledger (midnight rollover and the 16:00 flip without reload); copy button
reports failure honestly; audit screen-reader announcements + 0–3 keyboard answering;
two-tap guard on "Re-run the audit"; breaker focus management + live step announcements;
OG/Twitter meta and a noscript fallback in `index.html`.
