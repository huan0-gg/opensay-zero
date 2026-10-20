import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { coffeeScene } from '../../content/scenes/coffee';
import { FakeSpeech } from '../../services/speech';
import { useProgress } from '../../state/store';
import { ReviewPhase } from './ReviewPhase';

const settings = { rate: 0.8 as const, subtitles: 'en-zh' as const, sound: true };

describe('review phase', () => {
  beforeEach(() => {
    useProgress.getState().reset();
  });

  it('records a pass and moves through every due chunk', () => {
    const speech = new FakeSpeech();
    const onDone = vi.fn();
    const chunks = coffeeScene.chunks.filter((chunk) => chunk.tier === 'core').slice(0, 2);
    render(<ReviewPhase chunks={chunks} speech={speech} settings={settings} onDone={onDone} />);

    fireEvent.click(screen.getByRole('button', { name: '说对了' }));
    expect(useProgress.getState().progress.chunks[chunks[0].id]?.stage).toBe(1);

    fireEvent.click(screen.getByRole('button', { name: '说对了' }));
    expect(useProgress.getState().progress.chunks[chunks[1].id]?.stage).toBe(1);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('offers a slower repeat before recording a failure', () => {
    const speech = new FakeSpeech();
    const onDone = vi.fn();
    const chunks = coffeeScene.chunks.filter((chunk) => chunk.tier === 'core').slice(0, 1);
    render(<ReviewPhase chunks={chunks} speech={speech} settings={settings} onDone={onDone} />);

    fireEvent.click(screen.getByRole('button', { name: '还没说出来' }));
    expect(screen.getAllByText(/先听慢速/).length).toBeGreaterThan(0);
    expect(useProgress.getState().progress.chunks[chunks[0].id]).toBeUndefined();

    fireEvent.click(screen.getByRole('button', { name: '还是没说出来' }));
    expect(useProgress.getState().progress.chunks[chunks[0].id]?.stage).toBe(0);
    expect(useProgress.getState().progress.chunks[chunks[0].id]?.needsSupport).toBe(false);
  });
});
