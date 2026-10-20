import { z } from 'zod';

export const NpcLineSchema = z.object({
  en: z.string().min(1),
  zh: z.string().min(1),
});

export const ChunkSchema = z.object({
  id: z.string().min(1),
  sceneId: z.enum(['coffee', 'intro', 'supermarket', 'directions', 'restaurant']),
  tier: z.enum(['core', 'understand']),
  en: z.string().min(1),
  zh: z.string().min(1),
  variants: z.array(z.string().min(1)).min(1),
  tip: z.string().optional(),
  why: z.string().optional(),
});

export const IntentSchema = z.object({
  id: z.string().min(1),
  patterns: z.array(z.string().min(1)).min(1),
  reply: NpcLineSchema,
  next: z.string().nullable(),
  end: z.boolean().optional(),
  chunkId: z.string().optional(),
});

export const DialogueNodeSchema = z.object({
  id: z.string().min(1),
  npc: z.array(NpcLineSchema).min(1),
  intents: z.array(IntentSchema).min(1),
  hints: z.tuple([NpcLineSchema, NpcLineSchema]),
  repair: NpcLineSchema,
  required: z.boolean(),
});

export const SceneSchema = z.object({
  id: z.enum(['coffee', 'intro', 'supermarket', 'directions', 'restaurant']),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  domain: z.string().min(1),
  level: z.union([z.literal(1), z.literal(2)]),
  week: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  order: z.number().int().min(1).max(5),
  objectives: z.array(z.string().min(1)).min(1),
  chunks: z.array(ChunkSchema).length(12),
  nodes: z.array(DialogueNodeSchema).min(1),
  mission: NpcLineSchema,
  badge: z.string().min(1),
  finalNote: z.string().min(1),
});
