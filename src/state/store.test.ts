import { describe, expect, it } from 'vitest';
import { createDefaultProgress } from '../domain/progress';
import type { SessionRecord } from '../domain/types';
import { createProgressStore } from './store';

function record(overrides: Partial<SessionRecord> = {}): SessionRecord {
  return {
    id: 's1',
    date: '2026-10-20',
    sceneId: 'coffee',
    day: 1,
    kind: 'scene',
    planIndex: 0,
    scheduled: true,
    turns: 8,
    independentTurns: 4,
    minutes: 9,
    hints: 1,
    corrections: 2,
    completed: true,
    ...overrides,
  };
}

describe('progress store', () => {
  it('does not double-count a repeated completion', () => {
    const store = createProgressStore(createDefaultProgress());
    const completion = record();
    store.getState().completeSession(completion);
    store.getState().completeSession(completion);
    expect(store.getState().progress.sessions).toHaveLength(1);
    expect(store.getState().progress.planIndex).toBe(1);
  });

  it('marks scene days and the badge on day three', () => {
    const store = createProgressStore(createDefaultProgress());
    store.getState().completeSession(record({ id: 'a', day: 1 }));
    store.getState().completeSession(record({ id: 'b', day: 3, planIndex: 1 }));
    const scene = store.getState().progress.scenes.coffee;
    expect(scene?.completedDays).toEqual([1, 3]);
    expect(scene?.badge).toBe(true);
  });

  it('records a chunk review result through the scheduler', () => {
    const store = createProgressStore(createDefaultProgress());
    store.getState().recordChunkResult('coffee-price', 'pass', new Date('2026-10-20T10:00:00+08:00'));
    const state = store.getState().progress.chunks['coffee-price'];
    expect(state?.stage).toBe(1);
    expect(state?.dueAt).toBe(new Date('2026-10-21T10:00:00+08:00').toISOString());
  });

  it('does not advance the plan for an extra practice session', () => {
    const store = createProgressStore({ ...createDefaultProgress(), planIndex: 1 });
    store.getState().completeSession(record({ id: 'extra', planIndex: 1, scheduled: false }));
    expect(store.getState().progress.planIndex).toBe(1);
    expect(store.getState().progress.sessions).toHaveLength(1);
  });

  it('does not advance on a scheduled session with zero independent turns', () => {
    const store = createProgressStore(createDefaultProgress());
    store.getState().completeSession(
      record({ id: 'zero', scheduled: true, independentTurns: 0, planIndex: 0 }),
    );
    expect(store.getState().progress.planIndex).toBe(0);
  });
});
