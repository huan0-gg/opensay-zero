import { SCHEDULE } from '../content/schedule';
import { allChunks } from '../content';
import type { PlanEntry, Progress } from './types';
import { isDue } from './scheduler';

export interface Assignment extends PlanEntry {
  index: number;
  allDone: boolean;
}

export function nextAssignment(progress: Progress): Assignment {
  const index = Math.min(progress.planIndex, SCHEDULE.length - 1);
  return {
    ...SCHEDULE[index],
    index,
    allDone: progress.planIndex >= SCHEDULE.length,
  };
}

export function dueChunkIds(progress: Progress, now = new Date()): string[] {
  return allChunks()
    .filter((chunk) => chunk.tier === 'core')
    .filter((chunk) => {
      const state = progress.chunks[chunk.id];
      return state ? isDue(state, now) : false;
    })
    .map((chunk) => chunk.id);
}

export function todayPlan(progress: Progress, now = new Date()) {
  const assignment = nextAssignment(progress);
  return {
    ...assignment,
    reviewCount: dueChunkIds(progress, now).length,
    minutes: 10,
  };
}
