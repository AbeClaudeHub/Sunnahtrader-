# Product decisions (cycle 1–2) — what was built and why

## The mark on the check-in (growth engine)
The composed message now ends "— THE LEDGER · DAY 9 · INTEGRITY 92.0" (evening)
or "— THE LEDGER · DAY 9" (morning); bare "— THE LEDGER" before a contract.
Rationale: the message is the only artifact a stranger sees daily. The em-dash
sign-off reads as a signature, not an ad; DAY N and INTEGRITY are the two
numbers that make a room member ask "what is that?". The honest line is now
quoted (“…”) instead of prefixed "One line:" — a form label inside a human
sentence killed the voice.

## What the ledger knows (day-40 retention)
patterns.ts surfaces six findings, each pure counting over the trader's own
entries, each behind an evidence threshold (it withholds below it — the
withholding line itself creates anticipation honestly). Order: clean runs,
state-word, weekday, repeat rule, over-max, breaker holds. Rejected: anything
score-like, advice-like, or probabilistic. Every sentence must be verifiable
by hand from the Record. A clean run requires the day to be LOGGED — an
unwitnessed day breaks the run, because the gap is the point.

## Ethic fix: breaches are append-only
Re-saving an evening previously re-derived the day's breaches from the
checkboxes, so unticking erased a breach (even a paid one). Now: recorded
breaches are locked in the form (shown "· recorded") and saving only appends
new ones. The record cannot be quietly edited.

## Integrity under amendment
Each evening is judged against the contract version in force on its date
(versionInForceOn), so amending from 3 to 5 rules doesn't silently rescore
history. Same in weekSummary.

## Access flag
Stripped from exportJSON (entitlement, not record); importJSON preserves the
device's current access — an imported file can neither grant nor revoke.

## Testing approach
No new dependencies: scripts/test.mjs compiles src/lib to CommonJS via tsc
into .testbuild/ (with a {"type":"commonjs"} package.json — root is ESM) and
asserts with plain JS. TZ=America/New_York in the npm script so DST is real.
todayISO is monkey-patched on the compiled CJS module for determinism.
Gotcha: formatMoney uses U+202F narrow no-break space, not a plain space.

## Rejected ideas
- Streak repair, grace days, any forgiveness mechanic: betrays the ethic.
- Integrity in the morning sign-off: braggy before the day is closed; it
  belongs to the close.
- A fifth motion: nothing needed one.
