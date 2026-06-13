# Export card design decisions — the engraved-plate system

All three cards share one geometry: 1080×1350 (4:5, room/IG friendly), content
margin 120, engraved plate border (heavy outer rule + inner hairline at
44/58 — echoes .contract-doc's border+outline), seeded grain tile at the app's
5% so the PNG reads as paper, real ctx.letterSpacing (no-op on engines without
it; never fake tracking with spaces — kerning around em dashes goes uneven).

Verdict (ink): date lives in the masthead right slot — never as a floating
orphan. Seconded saboteur set in gold, same as in-app. Gauge baseline gets
engraver's end ticks. Gauge block at baseY 1044 balances the bottom field.

Contract (paper): the rules MUST be measured. layout(s, draw) runs a dry pass
and steps scale down by 0.02 (floor 0.66) until five rules fit between title
and a reserved signature ground (rule at sigTop, name/date left, seal right).
Inline keywords (WHEN / THEN / NO EXCEPTIONS, INCLUDING / THE PRICE) are
smaller tracked Inter 600 runs sharing the body baseline — the engraver's way
to mark structure without breaking the line. Seal blob is drawn with quadratic
curves through midpoints (16 bumps); straight segments read as cut paper, not
poured wax.

Weekly (ink): the week is five ledger ticks M–F — kept (paper), breached
(wax, taller/thicker: wax as a MARK is fine on ink; wax as small TYPE fails
contrast, so the breach count in the rows is a paper numeral with a short wax
rule under it). The week's last honest line is quoted in italic Fraunces under
the strip — the human voice is what makes strangers stop scrolling. All-time
integrity + day N live in one mono line above the footer, not as table rows.

Range labels: weekRangeLabel() — "8–12 JUNE 2026", cross-month "29 JUN – 3 JUL".
Never "08.06 — 12.06" (ambiguous day.month).

Collision discipline: rows start 856, advance 68; the standing line lands at
y=1196, footer rule at 1222. Anything new on the weekly card must re-check
this column of numbers.
