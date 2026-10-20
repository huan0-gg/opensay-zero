import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { coffeeScene } from '../../content/scenes/coffee';
import type { Correction } from '../../domain/types';
import { RecapPhase } from './RecapPhase';

const corrections: Correction[] = [
  { kind: 'chunk', impact: 3, said: 'how much', better: 'How much is this?', why: '加上 is this 更像完整问句' },
  { kind: 'order', impact: 2, said: 'this one take', better: "I'll take this one.", why: '英语先说动作再说对象' },
  { kind: 'chunk', impact: 1, said: 'card', better: 'Card, please.', why: '加一个 please 更礼貌' },
  { kind: 'chunk', impact: 1, said: 'thanks', better: 'Thank you.', why: '完整一点' },
  { kind: 'pronunciation', impact: 1, said: 'tink', better: 'think', why: 'th 的舌尖放在上下齿之间' },
];

describe('recap', () => {
  it('shows at most three corrections, each with the three labels', () => {
    render(
      <RecapPhase
        scene={coffeeScene}
        day={3}
        kind="scene"
        stats={{ turns: 8, independentTurns: 4, hints: 1, chunksUsed: ['coffee-price', 'coffee-order'] }}
        corrections={corrections}
        onComplete={() => {}}
      />,
    );
    expect(screen.getAllByTestId('correction')).toHaveLength(3);
    expect(screen.getAllByText('你说的').length).toBeGreaterThan(0);
    expect(screen.getAllByText('更自然').length).toBeGreaterThan(0);
    expect(screen.getAllByText('为什么').length).toBeGreaterThan(0);
    expect(screen.getByText('今天说对了 2 句')).toBeInTheDocument();
  });
});
