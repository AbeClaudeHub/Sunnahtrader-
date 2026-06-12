# Baseline critique (cycle 1) — where the last 10% lives

Looked at every screen in shots/base and all three export cards in shots/cards-base.

## Export cards (the billboards) — the weakest surface by far
- **Contract card is broken.** Five rules overflow the 1080×1350 canvas: rule 04
  collides with the signature, rule 05 is missing, the seal stamps over body text.
  Cause: fixed y-advance with no measurement. Fix: measured layout — lay out all
  blocks at preferred sizes, scale type down (bounded) until the rules fit the
  region between title and a *reserved* signature block.
- **Verdict card**: good bones. Flaws: the date "3 JUNE 2026" floats as an orphan
  with no anchor; dead band between gauges and footer; letterspacing faked with
  manual spaces (uneven around the em dash); no plate frame, so it reads as a
  screenshot rather than a certificate.
- **Weekly card**: "08.06 — 12.06" is ambiguous day.month; the trader's name set
  in mono reads like a terminal, not a ledger; the wax breach numeral fails
  contrast on ink (~2.2:1); no engraved frame; dead vertical space under hero.
- Decision: all three cards get the same engraved-plate double border (heavy
  outer rule + inner hairline, echoing .contract-doc), real ctx.letterSpacing
  (harmless no-op where unsupported), a seeded grain tile at ~4% (the cards are
  paper, not pixels), and measured layout. Wax-on-ink emphasis = paper numeral
  with a short wax rule under it, never small wax text on ink.

## Composed check-in (the growth engine)
- Currently ends "Day 9 under contract." — no mark. A stranger in a room can't
  tell it came from anywhere. Fix: signature line "— THE LEDGER · DAY 9 ·
  INTEGRITY 92.0" (integrity only when it exists). "One line:" prefix replaced
  by the line itself in quotes — the human voice should not carry a form label.

## In-app small flaws
- Breaker note textarea shows a resize handle (outside .field, so the reset
  doesn't reach it).
- Breaker dialog has no focus trap; tab strip is styled as tabs but has no
  tablist semantics (no roles, no arrow keys).
- Record's "Your record, yours" never says the record lives in localStorage —
  a paying customer can lose the book by clearing the browser.

## Verdicts I am NOT acting on
- Verdict page, audit question page, breaker takeover, sales hero: already at a
  high bar. Resist the urge to fiddle.
