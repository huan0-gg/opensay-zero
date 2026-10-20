import { z } from 'zod';
import type { Progress, Streak } from './types';

const ChunkStateSchema = z.object({
  stage: z.number().int().min(0).max(5),
  dueAt: z.string().min(1),
  lapses: z.number().int().min(0),
  needsSupport: z.boolean().optional(),
  lastResult: z.enum(['pass', 'fail']).optional(),
});

const SessionRecordSchema = z.object({
  id: z.string().min(1),
  date: z.string().min(1),
  sceneId: z.enum(['coffee', 'intro', 'supermarket', 'directions', 'restaurant']),
  day: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  kind: z.enum(['scene', 'variation', 'final']),
  planIndex: z.number().int().min(0),
  scheduled: z.boolean(),
  turns: z.number().int().min(0),
  independentTurns: z.number().int().min(0),
  minutes: z.number().min(0),
  hints: z.number().int().min(0),
  corrections: z.number().int().min(0),
  completed: z.boolean(),
});

const SceneProgressSchema = z.object({
  day: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  completedDays: z.array(z.number().int().min(1).max(3)),
  badge: z.boolean(),
});

const AssessmentSchema = z.object({
  completedAt: z.string().min(1),
  heard: z.number().int().min(0),
  spoke: z.number().int().min(0),
  skipped: z.boolean(),
});

const StreakSchema = z.object({
  current: z.number().int().min(0),
  longest: z.number().int().min(0),
  lastActiveDate: z.string().optional(),
  freezesUsed: z.number().int().min(0),
});

const SettingsSchema = z.object({
  rate: z.union([z.literal(0.8), z.literal(1), z.literal(1.2)]),
  subtitles: z.enum(['en', 'en-zh', 'off']),
  sound: z.boolean(),
});

const ActiveSessionSchema = z.object({
  id: z.string().min(1),
  sceneId: z.enum(['coffee', 'intro', 'supermarket', 'directions', 'restaurant']),
  day: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  nodeId: z.string().min(1),
  startedAt: z.string().min(1),
  turns: z.number().int().min(0),
  independentTurns: z.number().int().min(0),
  hints: z.number().int().min(0),
  minutes: z.number().min(0),
});

export const ProgressSchema = z.object({
  schemaVersion: z.literal(1),
  assessment: AssessmentSchema.optional(),
  chunks: z.record(z.string(), ChunkStateSchema),
  scenes: z.record(z.string(), SceneProgressSchema),
  sessions: z.array(SessionRecordSchema),
  streak: StreakSchema,
  settings: SettingsSchema,
  planIndex: z.number().int().min(0),
  active: ActiveSessionSchema.nullable().optional(),
});

export function todayKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createDefaultProgress(): Progress {
  return {
    schemaVersion: 1,
    chunks: {},
    scenes: {},
    sessions: [],
    streak: { current: 0, longest: 0, freezesUsed: 0 },
    settings: { rate: 0.8, subtitles: 'en-zh', sound: true },
    planIndex: 0,
    active: null,
  };
}

export function parseProgress(raw: string | null): { progress: Progress; recovered: boolean } {
  if (!raw) return { progress: createDefaultProgress(), recovered: false };
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = ProgressSchema.safeParse(parsed);
    if (!result.success) return { progress: createDefaultProgress(), recovered: true };
    return { progress: result.data as Progress, recovered: false };
  } catch {
    return { progress: createDefaultProgress(), recovered: true };
  }
}

function daysBetween(a: string, b: string): number {
  const first = new Date(`${a}T12:00:00`).getTime();
  const second = new Date(`${b}T12:00:00`).getTime();
  return Math.round((second - first) / (24 * 60 * 60 * 1000));
}

export function touchStreak(streak: Streak, date: string): Streak {
  if (streak.lastActiveDate === date) return streak;

  let current = 1;
  let freezesUsed = streak.freezesUsed;
  if (streak.lastActiveDate) {
    const gap = daysBetween(streak.lastActiveDate, date);
    if (gap === 1) current = streak.current + 1;
    else if (gap === 2 && freezesUsed < 1) {
      current = streak.current + 1;
      freezesUsed += 1;
    }
  }

  return {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveDate: date,
    freezesUsed,
  };
}
