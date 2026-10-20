import { describe, expect, it } from 'vitest';
import { allScenes } from './index';
import { validateContent } from './validate';
import { SCHEDULE } from './schedule';

describe('content', () => {
  it('ships five scenes with 4 core and 8 understand chunks each', () => {
    expect(allScenes).toHaveLength(5);
    for (const scene of allScenes) {
      expect(scene.chunks.filter((chunk) => chunk.tier === 'core')).toHaveLength(4);
      expect(scene.chunks.filter((chunk) => chunk.tier === 'understand')).toHaveLength(8);
    }
  });

  it('passes structural validation with no errors', () => {
    expect(validateContent(allScenes)).toEqual([]);
  });

  it('schedules twenty sessions covering every scene with one final', () => {
    expect(SCHEDULE).toHaveLength(20);
    expect(new Set(SCHEDULE.map((entry) => entry.sceneId)).size).toBe(5);
    expect(SCHEDULE.filter((entry) => entry.kind === 'final')).toHaveLength(1);
    expect(SCHEDULE[19]).toEqual({ sceneId: 'coffee', day: 3, kind: 'final' });
  });
});
