import { containsBannedWord } from '../content/banned';
import type { Correction } from './types';

/**
 * The recap shows the corrections that most affect being understood, at most
 * three. Deduplicate by the suggested sentence, not by kind: a learner can
 * have two different chunk problems worth showing.
 */
export function selectCorrections(items: Correction[], max = 3): Correction[] {
  const seen = new Set<string>();
  return items
    .filter((item) => !containsBannedWord(`${item.said} ${item.better} ${item.why}`))
    .sort((a, b) => b.impact - a.impact)
    .filter((item) => {
      const key = `${item.kind}:${item.better}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, max);
}
