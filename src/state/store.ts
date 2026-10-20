import { create } from 'zustand';
import { createStore, type StoreApi } from 'zustand/vanilla';
import type {
  ActiveSession,
  AssessmentResult,
  Progress,
  SceneProgress,
  SessionRecord,
  Settings,
} from '../domain/types';
import { createDefaultProgress, todayKey, touchStreak } from '../domain/progress';
import { newChunkState, scheduleNext } from '../domain/scheduler';
import { clearProgress, loadProgress, saveProgress } from '../services/storage';

export interface ProgressState {
  progress: Progress;
  recovered: boolean;
  dismissRecovery: () => void;
  completeSession: (record: SessionRecord) => void;
  recordChunkResult: (chunkId: string, result: 'pass' | 'fail', now?: Date) => void;
  setAssessment: (assessment: AssessmentResult) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setPlanIndex: (index: number) => void;
  setActive: (active: ActiveSession | null) => void;
  reset: () => void;
  replace: (progress: Progress) => void;
}

type SetState = StoreApi<ProgressState>['setState'];
type GetState = StoreApi<ProgressState>['getState'];

function createActions(set: SetState, get: GetState): Omit<ProgressState, 'progress' | 'recovered'> {
  return {
    dismissRecovery() {
      set({ recovered: false });
    },

    completeSession(record) {
      const current = get().progress;
      if (current.sessions.some((session) => session.id === record.id)) return;

      const scenes: Progress['scenes'] = { ...current.scenes };
      if (record.completed) {
        const existing: SceneProgress = scenes[record.sceneId] ?? {
          day: 1,
          completedDays: [],
          badge: false,
        };
        const completedDays = Array.from(
          new Set([...existing.completedDays, record.day]),
        ).sort((a, b) => a - b);
        scenes[record.sceneId] = {
          day: Math.max(existing.day, record.day) as 1 | 2 | 3,
          completedDays,
          badge: existing.badge || completedDays.includes(3),
        };
      }

      const planIndex =
        record.completed &&
        record.scheduled &&
        record.independentTurns > 0 &&
        record.planIndex === current.planIndex
          ? record.planIndex + 1
          : current.planIndex;

      set({
        progress: {
          ...current,
          sessions: [...current.sessions, record],
          scenes,
          planIndex,
          streak: record.completed ? touchStreak(current.streak, record.date) : current.streak,
          active: null,
        },
      });
    },

    recordChunkResult(chunkId, result, now = new Date()) {
      const current = get().progress;
      const state = current.chunks[chunkId] ?? newChunkState(now);
      set({
        progress: {
          ...current,
          chunks: { ...current.chunks, [chunkId]: scheduleNext(state, result, now) },
        },
      });
    },

    setAssessment(assessment) {
      set({ progress: { ...get().progress, assessment } });
    },

    updateSettings(patch) {
      const current = get().progress;
      set({ progress: { ...current, settings: { ...current.settings, ...patch } } });
    },

    setPlanIndex(index) {
      set({ progress: { ...get().progress, planIndex: Math.max(0, index) } });
    },

    setActive(active) {
      set({ progress: { ...get().progress, active } });
    },

    reset() {
      clearProgress();
      set({ progress: createDefaultProgress() });
    },

    replace(progress) {
      set({ progress });
    },
  };
}

export function createProgressStore(initial: Progress = createDefaultProgress(), recovered = false) {
  return createStore<ProgressState>((set, get) => ({
    progress: initial,
    recovered,
    ...createActions(set, get),
  }));
}

const loaded = loadProgress();

export const useProgress = create<ProgressState>()((set, get) => ({
  progress: loaded.progress,
  recovered: loaded.recovered,
  ...createActions(set, get),
}));

if (typeof window !== 'undefined') {
  useProgress.subscribe((state) => saveProgress(state.progress));
}

export function markToday(progress: Progress): string {
  return progress.streak.lastActiveDate ?? todayKey();
}
