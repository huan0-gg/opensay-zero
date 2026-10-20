import type { Scene } from '../domain/types';
import { coffeeScene } from './scenes/coffee';
import { introScene } from './scenes/intro';
import { supermarketScene } from './scenes/supermarket';
import { directionsScene } from './scenes/directions';
import { restaurantScene } from './scenes/restaurant';

export const allScenes: Scene[] = [
  coffeeScene,
  introScene,
  supermarketScene,
  directionsScene,
  restaurantScene,
];

export function sceneById(id: string): Scene | undefined {
  return allScenes.find((scene) => scene.id === id);
}

export function allChunks(): Scene['chunks'] {
  return allScenes.flatMap((scene) => scene.chunks);
}

export { coffeeScene, introScene, supermarketScene, directionsScene, restaurantScene };
