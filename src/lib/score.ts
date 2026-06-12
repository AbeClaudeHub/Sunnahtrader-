import { QUESTIONS } from '../content/questions';
import type { AuditResult, SaboteurId } from '../store/types';

const ORDER: SaboteurId[] = ['anger', 'ego', 'greed', 'doubt']; // deterministic tie order

export function scoreAudit(answers: number[]): AuditResult {
  const scores: Record<SaboteurId, number> = { ego: 0, greed: 0, anger: 0, doubt: 0 };
  const patternCounts: Record<SaboteurId, number> = { ego: 0, greed: 0, anger: 0, doubt: 0 };

  QUESTIONS.forEach((q, i) => {
    const a = answers[i] ?? 0;
    scores[q.saboteur] += a;
    if (a === 3) patternCounts[q.saboteur] += 1;
  });

  const ranked = [...ORDER].sort((a, b) => {
    if (scores[b] !== scores[a]) return scores[b] - scores[a];
    if (patternCounts[b] !== patternCounts[a]) return patternCounts[b] - patternCounts[a];
    return ORDER.indexOf(a) - ORDER.indexOf(b);
  });

  return {
    answers,
    scores,
    dominant: ranked[0],
    seconded: ranked[1],
    completedAt: new Date().toISOString(),
  };
}
