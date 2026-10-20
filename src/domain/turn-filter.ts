import type { TurnInput } from './types';

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * A turn counts as independent only when the learner produced it themselves.
 * Text and choice input have no ASR confidence, so the threshold applies to voice only.
 */
export function isIndependentTurn(turn: TurnInput): boolean {
  if (!turn.intentId) return false;
  if (turn.usedHint) return false;
  if (turn.isRepeat) return false;
  if (wordCount(turn.text) < 2) return false;
  if (turn.source === 'voice' && turn.confidence < 0.6) return false;
  return true;
}
