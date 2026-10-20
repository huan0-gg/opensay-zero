import type { Scene } from '../domain/types';
import { containsBannedWord } from './banned';

export function validateContent(scenes: Scene[]): string[] {
  const errors: string[] = [];
  const chunkIds = new Set<string>();
  const sceneOrders = new Set<number>();

  for (const scene of scenes) {
    const label = `[${scene.id}]`;
    if (sceneOrders.has(scene.order)) errors.push(`${label} duplicate scene order ${scene.order}`);
    sceneOrders.add(scene.order);

    const core = scene.chunks.filter((chunk) => chunk.tier === 'core');
    const understand = scene.chunks.filter((chunk) => chunk.tier === 'understand');
    if (core.length !== 4) errors.push(`${label} core chunks: ${core.length} (expected 4)`);
    if (understand.length !== 8) errors.push(`${label} understand chunks: ${understand.length} (expected 8)`);

    for (const chunk of scene.chunks) {
      if (chunkIds.has(chunk.id)) errors.push(`${label} duplicate chunk id ${chunk.id}`);
      chunkIds.add(chunk.id);
      if (chunk.variants.length < 1) errors.push(`${label} chunk ${chunk.id} has no variants`);
      if (containsBannedWord(JSON.stringify(chunk))) errors.push(`${label} banned word in ${chunk.id}`);
      if (chunk.sceneId !== scene.id) errors.push(`${label} chunk ${chunk.id} scene mismatch`);
    }

    const nodeIds = new Set(scene.nodes.map((node) => node.id));
    if (nodeIds.size !== scene.nodes.length) errors.push(`${label} duplicate node ids`);

    for (const node of scene.nodes) {
      if (node.intents.length < 2) {
        errors.push(`${label} node ${node.id} needs at least two intent branches`);
      }
      for (const intent of node.intents) {
        if (intent.next !== null && !nodeIds.has(intent.next)) {
          errors.push(`${label} node ${node.id} intent ${intent.id} points to missing node ${intent.next}`);
        }
        if (intent.chunkId && !scene.chunks.some((chunk) => chunk.id === intent.chunkId)) {
          errors.push(`${label} node ${node.id} intent ${intent.id} uses missing chunk ${intent.chunkId}`);
        }
      }
      if (containsBannedWord(JSON.stringify(node))) errors.push(`${label} banned word in node ${node.id}`);
      if (!canReachEnd(scene, node.id, new Set())) {
        errors.push(`${label} node ${node.id} cannot reach an ending`);
      }
    }

    if (!scene.nodes.some((node) => node.intents.some((intent) => intent.end))) {
      errors.push(`${label} has no ending intent`);
    }
  }

  if (scenes.length !== 5) errors.push(`expected 5 scenes, got ${scenes.length}`);
  return errors;
}

function canReachEnd(scene: Scene, nodeId: string, visiting: Set<string>): boolean {
  if (visiting.has(nodeId)) return false;
  const node = scene.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return false;
  const nextVisiting = new Set(visiting).add(nodeId);
  return node.intents.some((intent) => {
    if (intent.end) return true;
    if (intent.next === null) return false;
    return canReachEnd(scene, intent.next, nextVisiting);
  });
}
