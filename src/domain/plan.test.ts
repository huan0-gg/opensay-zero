import { describe, expect, it } from 'vitest';
import { createDefaultProgress } from './progress';
import { dueChunkIds, nextAssignment } from './plan';

describe('plan', () => {
  it('starts at coffee day one', () => {
    expect(nextAssignment(createDefaultProgress())).toMatchObject({
      index: 0,
      sceneId: 'coffee',
      day: 1,
      kind: 'scene',
      allDone: false,
    });
  });

  it('advances to intro day one after three sessions', () => {
    expect(nextAssignment({ ...createDefaultProgress(), planIndex: 3 })).toMatchObject({
      index: 3,
      sceneId: 'intro',
      day: 1,
    });
  });

  it('reports all done after twenty sessions', () => {
    expect(nextAssignment({ ...createDefaultProgress(), planIndex: 20 }).allDone).toBe(true);
  });

  it('lists due review chunks only for core chunks with a due state', () => {
    const progress = createDefaultProgress();
    progress.chunks['coffee-price'] = {
      stage: 1,
      dueAt: '2026-10-19T00:00:00.000Z',
      lapses: 0,
    };
    progress.chunks['coffee-hear-greet'] = {
      stage: 1,
      dueAt: '2026-10-19T00:00:00.000Z',
      lapses: 0,
    };
    const due = dueChunkIds(progress, new Date('2026-10-20T00:00:00.000Z'));
    expect(due).toEqual(['coffee-price']);
  });
});
