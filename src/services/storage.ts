import type { Progress } from '../domain/types';
import { parseProgress } from '../domain/progress';

const KEY = 'opensay.progress.v1';

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadRaw(): string | null {
  return storage()?.getItem(KEY) ?? null;
}

export function loadProgress(): { progress: Progress; recovered: boolean } {
  return parseProgress(loadRaw());
}

export function saveProgress(progress: Progress): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(progress));
  } catch {
    // A full or blocked storage must not break a session.
  }
}

export function clearProgress(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // ignore
  }
}
