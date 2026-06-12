import type { SaboteurId } from '../store/types';

export interface LibraryRule {
  id: string; // '01'..'12'
  saboteur: SaboteurId;
  title: string;
  when: string;
  then: string;
  noExceptions: string;
  price: string;
}

export const RULE_LIBRARY: LibraryRule[] = [
  // EGO
  {
    id: '01',
    saboteur: 'ego',
    title: 'The Closed Hand',
    when: 'A position moves against me and I feel the urge to add.',
    then: 'I place my hands flat on the desk and read my original entry note aloud.',
    noExceptions: '“Averaging in was secretly the plan.”',
    price: '$25 to charity, sent before tomorrow’s open.',
  },
  {
    id: '02',
    saboteur: 'ego',
    title: 'The Public Loss',
    when: 'Any trade closes red.',
    then: 'I post the loss to my room — entry, exit, one line on what I did — within one hour.',
    noExceptions: '“It was too small to matter.”',
    price: 'I post it anyway, plus the words “I hid this one.”',
  },
  {
    id: '03',
    saboteur: 'ego',
    title: 'The Dead Argument',
    when: 'Someone’s opposite read makes me want to hold past my plan.',
    then: 'I close or trim to plan size immediately, before replying to anyone.',
    noExceptions: '“I was about to be proven right.”',
    price: 'One full day flat — no trades the next session.',
  },
  // GREED
  {
    id: '04',
    saboteur: 'greed',
    title: 'The Closing Bell',
    when: 'I hit my daily profit target.',
    then: 'I close the platform and write the evening entry, even at 10 a.m.',
    noExceptions: '“The market is unusually good today.”',
    price: 'Half that day’s profit to charity.',
  },
  {
    id: '05',
    saboteur: 'greed',
    title: 'The Counted Hand',
    when: 'I take my final allowed trade of the day.',
    then: 'I log out of the broker entirely — not minimized, logged out.',
    noExceptions: '“This next one is A-plus.”',
    price: '$50, and tomorrow’s max drops to one trade.',
  },
  {
    id: '06',
    saboteur: 'greed',
    title: 'The Taken Target',
    when: 'Price touches my written target.',
    then: 'I execute the planned exit within one minute — full or planned partial, nothing improvised.',
    noExceptions: '“It’s about to break out.”',
    price: 'Quarter size for the next two sessions.',
  },
  // ANGER
  {
    id: '07',
    saboteur: 'anger',
    title: 'The Fifteen',
    when: 'Any trade stops me out.',
    then: 'I start the circuit breaker and do not touch the platform until it ends.',
    noExceptions: '“The re-entry signal is valid right now.”',
    price: '$50 to charity, and the next session sat out entirely.',
  },
  {
    id: '08',
    saboteur: 'anger',
    title: 'The Shrinking Hand',
    when: 'I enter any trade within an hour of a loss.',
    then: 'I cut that trade’s size to half my standard — set before entry, not after.',
    noExceptions: '“I need full size to make it back.”',
    price: '$25 per breach, doubling on the same day.',
  },
  {
    id: '09',
    saboteur: 'anger',
    title: 'The Two-Loss Door',
    when: 'I take my second red trade of the day.',
    then: 'I close the platform and write the evening entry. The day is over.',
    noExceptions: '“The first one was just bad luck.”',
    price: '$100 to charity — the expensive one, because this is the expensive mistake.',
  },
  // DOUBT
  {
    id: '10',
    saboteur: 'doubt',
    title: 'The Planned Entry',
    when: 'My written setup appears at my written level.',
    then: 'I take it at planned size within my window — or I write one line stating why it was invalid, before the move resolves.',
    noExceptions: '“I’ll catch the retest.”',
    price: 'I post the missed trade to my room with the words “I saw it and froze.”',
  },
  {
    id: '11',
    saboteur: 'doubt',
    title: 'The Untouched Stop',
    when: 'Price approaches my stop.',
    then: 'My hands leave the keyboard until I am filled or the level holds. The stop set at entry is the stop.',
    noExceptions: '“The wick doesn’t count.”',
    price: '$50, and I re-read my contract aloud before the next session.',
  },
  {
    id: '12',
    saboteur: 'doubt',
    title: 'The Full Distance',
    when: 'A winning trade sits between entry and target with no exit signal.',
    then: 'I let the bracket work — target or stop, the plan finishes itself.',
    noExceptions: '“Locking in something is responsible.”',
    price: 'Logged as a breach, with the profit I surrendered written next to it, permanently.',
  },
];

// five suggested slots: three from the dominant saboteur, two from the seconded
export function suggestRules(dominant: SaboteurId, seconded: SaboteurId): LibraryRule[] {
  const dom = RULE_LIBRARY.filter((r) => r.saboteur === dominant);
  const sec = RULE_LIBRARY.filter((r) => r.saboteur === seconded).slice(0, 2);
  return [...dom, ...sec];
}
