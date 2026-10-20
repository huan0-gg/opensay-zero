import type { DialogueNode } from './types';

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalize(text).split(' ').filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

export interface MatchResult {
  intentId: string | null;
  score: number;
}

/**
 * Matches only against the current node. A learner cannot skip ahead by
 * saying a later node's line, which keeps the required-node guarantee.
 */
export function matchIntent(text: string, node: DialogueNode): MatchResult {
  const input = normalize(text);
  if (!input) return { intentId: null, score: 0 };
  const inputTokens = tokenSet(input);
  const padded = ` ${input} `;

  let best: MatchResult = { intentId: null, score: 0 };

  for (const intent of node.intents) {
    let score = 0;
    for (const pattern of intent.patterns) {
      const normalizedPattern = normalize(pattern);
      if (!normalizedPattern) continue;
      if (padded.includes(` ${normalizedPattern} `) || input.includes(normalizedPattern)) {
        score = Math.max(score, 0.75);
      }
      const overlap = jaccard(inputTokens, tokenSet(normalizedPattern));
      if (overlap >= 0.6) score = Math.max(score, 0.65);
    }
    if (score > best.score) best = { intentId: intent.id, score };
  }

  return best.score >= 0.6 ? best : { intentId: null, score: best.score };
}
