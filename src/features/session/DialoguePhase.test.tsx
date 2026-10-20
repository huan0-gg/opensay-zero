import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { coffeeScene } from '../../content/scenes/coffee';
import { FakeSpeech } from '../../services/speech';
import { DialoguePhase } from './DialoguePhase';
import type { SessionStats } from './session-types';

const settings = { rate: 0.8 as const, subtitles: 'en-zh' as const, sound: true };

function setup(speech = new FakeSpeech()) {
  const onProgress = vi.fn();
  const onFinish = vi.fn();
  const onExit = vi.fn();
  render(
    <DialoguePhase
      scene={coffeeScene}
      day={1}
      speech={speech}
      settings={settings}
      onProgress={onProgress}
      onFinish={onFinish}
      onExit={onExit}
    />,
  );
  return { onProgress, onFinish, onExit };
}

async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

afterEach(() => {
  vi.useRealTimers();
});

describe('dialogue phase', () => {
  it('shows two hint chips after three seconds of silence', async () => {
    vi.useFakeTimers();
    setup();
    await flush();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('button', { name: /How much is this/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /I'll take this one/ })).toBeInTheDocument();
  });

  it('falls back to text input when speech is unavailable', async () => {
    setup(new FakeSpeech(false));
    await flush();
    expect(screen.getByLabelText('也可以打字')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '点一下说话' })).not.toBeInTheDocument();
  });

  it('does not count a hinted turn as independent', async () => {
    vi.useFakeTimers();
    const { onProgress } = setup();
    await flush();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    fireEvent.click(screen.getByRole('button', { name: /How much is this/ }));

    const input = screen.getByLabelText('也可以打字');
    fireEvent.change(input, { target: { value: 'how much is this' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await flush();

    const last = onProgress.mock.calls.at(-1)?.[0] as { stats: SessionStats };
    expect(last.stats.hints).toBe(1);
    expect(last.stats.independentTurns).toBe(0);
  });

  it('ends the session at twelve minutes exactly once', async () => {
    vi.useFakeTimers();
    const { onFinish } = setup();
    await flush();
    act(() => {
      vi.advanceTimersByTime(12 * 60 * 1000);
    });
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('reports the first use of a core chunk', async () => {
    const onChunkLearned = vi.fn();
    render(
      <DialoguePhase
        scene={coffeeScene}
        day={1}
        speech={new FakeSpeech()}
        settings={settings}
        onProgress={() => {}}
        onFinish={() => {}}
        onExit={() => {}}
        onChunkLearned={onChunkLearned}
      />,
    );
    await flush();
    const input = screen.getByLabelText('也可以打字');
    fireEvent.change(input, { target: { value: "i'll take this one" } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await flush();
    expect(onChunkLearned).toHaveBeenCalledWith('coffee-order');
  });

  it('refuses medical and legal questions with a fixed line', async () => {
    const onFinch = vi.fn();
    render(
      <DialoguePhase
        scene={coffeeScene}
        day={1}
        speech={new FakeSpeech()}
        settings={settings}
        onProgress={() => {}}
        onFinish={onFinch}
        onExit={() => {}}
      />,
    );
    await flush();
    const input = screen.getByLabelText('也可以打字');
    fireEvent.change(input, { target: { value: 'I need a doctor' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await flush();
    expect(screen.getByText(/professional/)).toBeInTheDocument();
    expect(onFinch).not.toHaveBeenCalled();
  });
});
