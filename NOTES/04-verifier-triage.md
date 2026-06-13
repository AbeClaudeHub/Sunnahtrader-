# Fresh-eyes verifier round 1 — what was acted on and what was overruled

A cold-context reviewer ranked all surfaces and held six. Triage:

## Acted on
- Contract card had no brand footer and an off-family masthead → family
  masthead (left label — em dash — right date) + THE LEDGER/NIYYAH foot band.
  Got the space by merging each rule's two paragraphs into one keyword-inline
  flow (saves a paragraph gap per rule, so body type got BIGGER, not smaller).
- Weekly hero numeral was Fraunces while the record screen sets the same
  metric in mono → mono. The system already picked; same metric, one face.
- Weekly tick band read as contradicting the table (BREACHES 2, one wax tick).
  It was day-marks vs breach-counts — both true — but a shared artifact must
  survive a hostile count. Now one wax tick per breach, uniform heights
  (height + color was double-encoding).
- Audit intro/questions: 30% unruled void on a ruled-page identity → base rule
  at the foot (THE AUDIT left, NIYYAH gold right). Grounded, no new copy.
- Audit option score digits (0–3) removed: they were both hierarchically slack
  AND telegraphed the scoring direction. Chosen state now also thickens the
  row's rule in gold — not color alone.
- Tab strip sawtooth: the stacked icon+label breaker trigger added a second
  text baseline to every screenshot's top edge. The wax seal alone is the
  trigger now (aria-label + title kept). Sales copy already teaches the seal.
- "SWAP 07 — The Fifteen" under a rule named The Fifteen read as a glitch →
  label is "From the library" (provenance reading).
- Builder lede was Fraunces doing UI work → Inter. Fraunces = the ledger's
  voice only.
- Date grammar: "06.09" (month.day) chips → "9 JUN" everywhere compact.

## Overruled, with reasons
- "Wax is for breach states only, so the seal must not be wax": the seal IS
  sealing wax — it is the product's mark on every in-app surface (Icons.tsx,
  signed contract, sales close). The brief's wax rule governs UI text/states.
  Changing the seal to gold/ink would orphan the app's most recognizable mark.
- "gate-sealed is a duplicate of audit-intro": the gate is intentionally off
  pre-launch (hasAccess() returns true), so /app falls through to the audit.
  Renamed the shot to prerelease-bypass so it stops claiming to be the gate.
  When the gate returns at launch, restore the shot and judge the Gate screen.
- "Three different day-counts across artifacts": two QA seed personas (week-2
  FULL and day-40 DEEP). Product cannot produce this; harness note added. Do
  not post FULL-based and DEEP-based artifacts side by side in marketing.
- Breaker progress-bar mapping complaint: measured wrong; elapsed/total is
  exact.
