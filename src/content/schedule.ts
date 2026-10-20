import type { PlanEntry } from '../domain/types';

/**
 * 20 sessions, 4 weeks, 5 days per week.
 * Week 4 closes with variations and one final coffee run.
 */
export const SCHEDULE: PlanEntry[] = [
  { sceneId: 'coffee', day: 1, kind: 'scene' },
  { sceneId: 'coffee', day: 2, kind: 'scene' },
  { sceneId: 'coffee', day: 3, kind: 'scene' },
  { sceneId: 'intro', day: 1, kind: 'scene' },
  { sceneId: 'intro', day: 2, kind: 'scene' },
  { sceneId: 'intro', day: 3, kind: 'scene' },
  { sceneId: 'supermarket', day: 1, kind: 'scene' },
  { sceneId: 'supermarket', day: 2, kind: 'scene' },
  { sceneId: 'supermarket', day: 3, kind: 'scene' },
  { sceneId: 'coffee', day: 3, kind: 'variation' },
  { sceneId: 'directions', day: 1, kind: 'scene' },
  { sceneId: 'directions', day: 2, kind: 'scene' },
  { sceneId: 'directions', day: 3, kind: 'scene' },
  { sceneId: 'restaurant', day: 1, kind: 'scene' },
  { sceneId: 'restaurant', day: 2, kind: 'scene' },
  { sceneId: 'restaurant', day: 3, kind: 'scene' },
  { sceneId: 'coffee', day: 3, kind: 'variation' },
  { sceneId: 'supermarket', day: 3, kind: 'variation' },
  { sceneId: 'directions', day: 3, kind: 'variation' },
  { sceneId: 'coffee', day: 3, kind: 'final' },
];
