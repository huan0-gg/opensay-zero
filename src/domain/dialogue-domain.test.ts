import { describe, expect, it } from 'vitest';
import { coffeeScene } from '../content/scenes/coffee';
import { isIndependentTurn } from './turn-filter';
import { matchIntent } from './intent-matcher';
import { selectCorrections } from './corrections';
import type { Correction } from './types';

describe('turn filter', () => {
  it('accepts a partial beginner answer with an intent', () => {
    expect(
      isIndependentTurn({
        text: 'how much',
        confidence: 0.72,
        source: 'voice',
        usedHint: false,
        isRepeat: false,
        intentId: 'ask-price',
      }),
    ).toBe(true);
  });

  it('does not count a hinted or repeated turn', () => {
    expect(
      isIndependentTurn({
        text: 'how much is this',
        confidence: 0.9,
        source: 'voice',
        usedHint: true,
        isRepeat: false,
        intentId: 'ask-price',
      }),
    ).toBe(false);
    expect(
      isIndependentTurn({
        text: 'how much is this',
        confidence: 0.9,
        source: 'voice',
        usedHint: false,
        isRepeat: true,
        intentId: 'ask-price',
      }),
    ).toBe(false);
  });

  it('rejects low-confidence voice and one-word turns', () => {
    expect(
      isIndependentTurn({
        text: 'maybe card',
        confidence: 0.4,
        source: 'voice',
        usedHint: false,
        isRepeat: false,
        intentId: 'card',
      }),
    ).toBe(false);
    expect(
      isIndependentTurn({
        text: 'card',
        confidence: 0.9,
        source: 'voice',
        usedHint: false,
        isRepeat: false,
        intentId: 'card',
      }),
    ).toBe(false);
  });
});

describe('intent matcher', () => {
  it('matches "how much" to the price intent', () => {
    const result = matchIntent('how much?', coffeeScene.nodes[0]);
    expect(result.intentId).toBe('ask-price');
    expect(result.score).toBeGreaterThanOrEqual(0.6);
  });

  it('matches a natural ordering line', () => {
    expect(matchIntent("i'll take this one", coffeeScene.nodes[0]).intentId).toBe('order');
  });

  it('returns null for unrelated speech', () => {
    expect(matchIntent('i like turtles', coffeeScene.nodes[0]).intentId).toBeNull();
  });

  it('does not match a later node from an earlier node', () => {
    expect(matchIntent('medium please', coffeeScene.nodes[0]).intentId).toBeNull();
  });
});

describe('corrections', () => {
  it('keeps at most three, one per kind, and drops banned words', () => {
    const items: Correction[] = [
      { kind: 'chunk', impact: 3, said: 'how much', better: 'How much is this?', why: '加上 is this 更像完整问句' },
      { kind: 'order', impact: 2, said: 'this one take', better: "I'll take this one.", why: '英语先说动作再说对象' },
      { kind: 'pronunciation', impact: 1, said: 'tink', better: 'think', why: 'th 的舌尖放在上下齿之间' },
      { kind: 'chunk', impact: 0, said: 'x', better: 'y', why: '你说错了' },
    ];
    const out = selectCorrections(items);
    expect(out).toHaveLength(3);
    expect(out.map((item) => item.kind)).toEqual(['chunk', 'order', 'pronunciation']);
    expect(out.some((item) => item.why.includes('你说错了'))).toBe(false);
  });
});
