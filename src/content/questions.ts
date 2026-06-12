import type { SaboteurId } from '../store/types';

export interface Question {
  saboteur: SaboteurId;
  text: string;
}

// answer scale, scored 0–3 in order
export const SCALE = ['Never', 'Once or twice', 'Most weeks', 'It’s a pattern'] as const;

export const QUESTIONS: Question[] = [
  {
    saboteur: 'anger',
    text: 'A trade stops you out. Within the next thirty minutes you enter another trade in the same instrument, in the same direction, at a worse price.',
  },
  {
    saboteur: 'doubt',
    text: 'You see the setup you planned for. You watch it. You don’t take it. Then it works, and you enter late at a worse price because “it’s still going.”',
  },
  {
    saboteur: 'ego',
    text: 'You’re underwater on a position and you add to it — not because the plan says to, but because being wrong at a bigger size feels less wrong than closing.',
  },
  {
    saboteur: 'greed',
    text: 'You hit your profit target for the day before noon. You keep trading.',
  },
  {
    saboteur: 'anger',
    text: 'After a red trade, your position size on the next trade goes up, not down.',
  },
  {
    saboteur: 'ego',
    text: 'You’ve deleted, hidden, or simply not journaled a trade because looking at it was worse than losing the money.',
  },
  {
    saboteur: 'doubt',
    text: 'You move your stop further away as price approaches it, telling yourself the original stop was “too tight.”',
  },
  {
    saboteur: 'greed',
    text: 'A winner hits your target and you don’t take it — you widen the target mid-trade because this one feels like the big one.',
  },
  {
    saboteur: 'anger',
    text: 'You’ve typed something angry — at the market, a room member, yourself — within minutes of a loss, then traded before the feeling passed.',
  },
  {
    saboteur: 'ego',
    text: 'Someone in your room posts the opposite read of yours. You hold your position longer than your plan allows, specifically because closing now would prove them right.',
  },
  {
    saboteur: 'doubt',
    text: 'You’ve sat through the entire session you prepared for without taking a single trade, then taken a low-quality trade in the last hour so the day “wasn’t wasted.”',
  },
  {
    saboteur: 'greed',
    text: 'Your stated max trades per day exists. You can name it right now. You exceeded it within the last two weeks.',
  },
  {
    saboteur: 'ego',
    text: 'You’ve told your room a trade was “part of the plan” when you know it wasn’t.',
  },
  {
    saboteur: 'anger',
    text: 'You’ve thought, in these words or close: “the market owes me that money back.”',
  },
  {
    saboteur: 'greed',
    text: 'You check your P&L during an open trade more often than you check your levels.',
  },
  {
    saboteur: 'doubt',
    text: 'You’ve closed a winning trade early — far before target, with no signal to exit — because the profit being real for one second felt better than the plan finishing.',
  },
];
