export type SceneId = 'coffee' | 'intro' | 'supermarket' | 'directions' | 'restaurant';
export type Tier = 'core' | 'understand';
export type SpeechSource = 'voice' | 'text' | 'choice';
export type SubtitleMode = 'en' | 'en-zh' | 'off';
export type PlaybackRate = 0.8 | 1 | 1.2;

export interface Chunk {
  id: string;
  sceneId: SceneId;
  tier: Tier;
  en: string;
  zh: string;
  variants: string[];
  tip?: string;
  why?: string;
}

export interface NpcLine {
  en: string;
  zh: string;
}

export interface Intent {
  id: string;
  patterns: string[];
  reply: NpcLine;
  next: string | null;
  end?: boolean;
  chunkId?: string;
}

export interface DialogueNode {
  id: string;
  npc: NpcLine[];
  intents: Intent[];
  hints: [NpcLine, NpcLine];
  repair: NpcLine;
  required: boolean;
}

export interface Scene {
  id: SceneId;
  title: string;
  subtitle: string;
  domain: string;
  level: 1 | 2;
  week: 1 | 2 | 3 | 4;
  order: number;
  objectives: string[];
  chunks: Chunk[];
  nodes: DialogueNode[];
  mission: NpcLine;
  badge: string;
  finalNote: string;
}

export interface ChunkState {
  stage: number;
  dueAt: string;
  lapses: number;
  needsSupport?: boolean;
  lastResult?: 'pass' | 'fail';
}

export interface SessionRecord {
  id: string;
  date: string;
  sceneId: SceneId;
  day: 1 | 2 | 3;
  kind: 'scene' | 'variation' | 'final';
  planIndex: number;
  scheduled: boolean;
  turns: number;
  independentTurns: number;
  minutes: number;
  hints: number;
  corrections: number;
  completed: boolean;
}

export interface SceneProgress {
  day: 1 | 2 | 3;
  completedDays: number[];
  badge: boolean;
}

export interface AssessmentResult {
  completedAt: string;
  heard: number;
  spoke: number;
  skipped: boolean;
}

export interface Streak {
  current: number;
  longest: number;
  lastActiveDate?: string;
  freezesUsed: number;
}

export interface Settings {
  rate: PlaybackRate;
  subtitles: SubtitleMode;
  sound: boolean;
}

export interface ActiveSession {
  id: string;
  sceneId: SceneId;
  day: 1 | 2 | 3;
  nodeId: string;
  startedAt: string;
  turns: number;
  independentTurns: number;
  hints: number;
  minutes: number;
}

export interface Progress {
  schemaVersion: 1;
  assessment?: AssessmentResult;
  chunks: Record<string, ChunkState>;
  scenes: Partial<Record<SceneId, SceneProgress>>;
  sessions: SessionRecord[];
  streak: Streak;
  settings: Settings;
  planIndex: number;
  active?: ActiveSession | null;
}

export interface TurnInput {
  text: string;
  confidence: number;
  source: SpeechSource;
  usedHint: boolean;
  isRepeat: boolean;
  intentId?: string;
}

export interface Correction {
  kind: 'chunk' | 'order' | 'pronunciation';
  impact: number;
  said: string;
  better: string;
  why: string;
}

export interface AsrResult {
  text: string;
  confidence: number;
  source: SpeechSource;
}

export interface PlanEntry {
  sceneId: SceneId;
  day: 1 | 2 | 3;
  kind: 'scene' | 'variation' | 'final';
}
