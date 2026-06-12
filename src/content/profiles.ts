import type { SaboteurId } from '../store/types';

export const SABOTEUR_NAMES: Record<SaboteurId, string> = {
  ego: 'EGO',
  greed: 'GREED',
  anger: 'ANGER',
  doubt: 'DOUBT',
};

export const SABOTEUR_LINES: Record<SaboteurId, string> = {
  ego: 'Can’t be wrong.',
  greed: 'No number is enough.',
  anger: 'Trades to get even.',
  doubt: 'Hesitates, then chases.',
};

// each profile: second person, ~150 words, quotes the reader's inner monologue.
// paragraphs separated by \n\n; *text* renders italic.
export const PROFILES: Record<SaboteurId, string> = {
  anger: `You don’t lose money trading. You lose it *after* trading — in the ten minutes following a stop-out, when the loss stops being a number and becomes an insult. You know the voice. *They ran my stop. It owes me. Get it back, then stop.* So you re-enter the same chart, bigger, at a worse price, and you call it conviction.

Here is what your answers say plainly: your worst trades are not decisions. They are retaliations. The market took something, and you went back in to take it back — from an opponent that never noticed you were there.

You don’t need a better strategy. Your strategy was fine at 9:31. You need a wall between the loss and the next click. That wall is fifteen minutes long, and it is written on the next page.

Sign it angry if you have to. Just sign it.`,

  ego: `You can take a loss. What you can’t take is being seen taking it. So the trade that should have died at your stop lives on — moved, widened, averaged into — because closing it would make the being-wrong official. You know the voice. *It’s coming back. I just need breakeven, then I’m out.* Breakeven isn’t a price. It’s a pardon, and you’re begging the market for one.

Your answers say you’ve hidden trades from your own journal — losses you couldn’t stand to see twice. A record you edit isn’t a record. It’s a press release.

You don’t need more conviction. Conviction is the drug here. You need a place where being wrong is cheap, fast, and witnessed — where a loss costs one honest line instead of a week of defending it.

The contract on the next page makes wrong survivable. Sign it before you’re right again.`,

  greed: `Enough doesn’t exist. You hit the day’s target by 10:40 and the voice starts before the fill confirms. *It’s working today. Why stop while it’s working?* So the green morning funds the red afternoon, and you hand it back — slower than you made it, in worse trades, at bigger size.

Your answers say you watch the P&L, not the chart. The number flickering is the entertainment, and entertainment always charges admission. Here is the arithmetic you keep refusing: your edge shows up a few times a session. Trade eleven was never the edge. It was the feeling of trade two, chased.

A target you don’t honor is not a target. It’s a decoration.

The contract on the next page puts a closing bell inside your day. The market stays open. You don’t have to. Sign it while you’re still green.`,

  doubt: `You do the work. The levels are marked before the open, the plan is written, the setup arrives — and your hands go quiet. You know the voice. *Wait for one more confirmation. It might be a trap.* So the clean entry leaves without you, and twenty minutes later you buy the worst price of the move, because watching it work without you hurt more than any stop ever has.

Your answers say it plainly: you don’t lose on your ideas. You lose on the late, oversized apology for missing them. Hesitation isn’t caution. It’s a breach with worse fills. And when you do get in, you take profit early — not because the plan said so, but because relief pays out faster than discipline.

The contract on the next page does one thing: it makes the plan the only voice in the room.

Sign it. Then let it trade.`,
};
