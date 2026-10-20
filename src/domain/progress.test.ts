import { describe, expect, it } from 'vitest';
import { createDefaultProgress, parseProgress, touchStreak } from './progress';

describe('progress schema', () => {
  it('returns defaults when nothing is stored', () => {
    const { progress, recovered } = parseProgress(null);
    expect(recovered).toBe(false);
    expect(progress.planIndex).toBe(0);
    expect(progress.sessions).toEqual([]);
  });

  it('recovers from corrupt storage with defaults', () => {
    const { progress, recovered } = parseProgress('{not json');
    expect(recovered).toBe(true);
    expect(progress.planIndex).toBe(0);
    expect(progress.sessions).toEqual([]);
    expect(progress.settings.subtitles).toBe('en-zh');
  });

  it('recovers from a wrong schema version', () => {
    const raw = JSON.stringify({ ...createDefaultProgress(), schemaVersion: 2 });
    const { progress, recovered } = parseProgress(raw);
    expect(recovered).toBe(true);
    expect(progress.schemaVersion).toBe(1);
  });

  it('round-trips a saved progress object', () => {
    const progress = createDefaultProgress();
    progress.planIndex = 4;
    progress.settings.rate = 1;
    const parsed = parseProgress(JSON.stringify(progress));
    expect(parsed.recovered).toBe(false);
    expect(parsed.progress.planIndex).toBe(4);
    expect(parsed.progress.settings.rate).toBe(1);
  });
});

describe('streak', () => {
  it('grows on consecutive days and resets after a gap', () => {
    const first = touchStreak({ current: 0, longest: 0, freezesUsed: 0 }, '2026-10-19');
    expect(first.current).toBe(1);
    const second = touchStreak(first, '2026-10-20');
    expect(second.current).toBe(2);
    expect(second.longest).toBe(2);
    const skipped = touchStreak(second, '2026-10-23');
    expect(skipped.current).toBe(1);
  });

  it('uses one freeze for a single missed day', () => {
    const streak = { current: 3, longest: 3, freezesUsed: 0, lastActiveDate: '2026-10-18' };
    const next = touchStreak(streak, '2026-10-20');
    expect(next.current).toBe(4);
    expect(next.freezesUsed).toBe(1);
  });

  it('does not grow twice on the same day', () => {
    const streak = { current: 2, longest: 2, freezesUsed: 0, lastActiveDate: '2026-10-20' };
    expect(touchStreak(streak, '2026-10-20')).toEqual(streak);
  });
});
