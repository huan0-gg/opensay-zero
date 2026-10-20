import type { ChunkState } from './types';

const DAY_MS = 24 * 60 * 60 * 1000;
const INTERVALS = [1, 3, 7, 15, 30];

function addDays(now: Date, days: number): string {
  return new Date(now.getTime() + days * DAY_MS).toISOString();
}

export function newChunkState(now: Date): ChunkState {
  return { stage: 0, dueAt: now.toISOString(), lapses: 0 };
}

export function scheduleNext(
  state: ChunkState,
  result: 'pass' | 'fail',
  now: Date,
): ChunkState {
  if (result === 'fail') {
    const lapses = state.lapses + 1;
    return {
      stage: Math.max(0, state.stage - 1),
      lapses,
      dueAt: addDays(now, 1),
      needsSupport: lapses >= 2,
      lastResult: 'fail',
    };
  }

  const stage = Math.min(5, state.stage + 1);
  const days = INTERVALS[Math.min(Math.max(stage - 1, 0), INTERVALS.length - 1)];
  return {
    stage,
    lapses: 0,
    dueAt: addDays(now, days),
    needsSupport: false,
    lastResult: 'pass',
  };
}

export function isDue(state: ChunkState, now: Date): boolean {
  return new Date(state.dueAt).getTime() <= now.getTime();
}
