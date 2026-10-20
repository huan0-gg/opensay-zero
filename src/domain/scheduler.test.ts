import { describe, expect, it } from 'vitest';
import { newChunkState, scheduleNext } from './scheduler';

const now = new Date('2026-10-20T10:00:00+08:00');

describe('scheduler', () => {
  it('moves a passed chunk to stage 1 and schedules it tomorrow', () => {
    const next = scheduleNext(newChunkState(now), 'pass', now);
    expect(next.stage).toBe(1);
    expect(next.dueAt).toBe(new Date('2026-10-21T10:00:00+08:00').toISOString());
  });

  it('grows the interval as stages advance', () => {
    const stage2 = scheduleNext({ stage: 1, dueAt: now.toISOString(), lapses: 0 }, 'pass', now);
    expect(stage2.stage).toBe(2);
    expect(stage2.dueAt).toBe(new Date('2026-10-23T10:00:00+08:00').toISOString());
  });

  it('drops a failed chunk one stage and asks for support after two lapses', () => {
    const next = scheduleNext({ stage: 4, dueAt: now.toISOString(), lapses: 1 }, 'fail', now);
    expect(next.stage).toBe(3);
    expect(next.lapses).toBe(2);
    expect(next.needsSupport).toBe(true);
    expect(next.dueAt).toBe(new Date('2026-10-21T10:00:00+08:00').toISOString());
  });

  it('caps at stage 5 and clears support after a pass', () => {
    const next = scheduleNext(
      { stage: 5, dueAt: now.toISOString(), lapses: 2, needsSupport: true },
      'pass',
      now,
    );
    expect(next.stage).toBe(5);
    expect(next.lapses).toBe(0);
    expect(next.needsSupport).toBe(false);
  });
});
