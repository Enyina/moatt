import * as THREE from 'three';
import { GarmentInstance, ProceduralGarmentOptions } from './garmentTypes';
import { createProceduralTShirtGroup } from './tshirt';
import { createProceduralHoodieGroup } from './hoodie';

type GeneratorFunction = (params: any, options?: ProceduralGarmentOptions) => THREE.Group;

export const garmentRegistry: Record<GarmentInstance['type'], { generate: GeneratorFunction }> = {
  tshirt: { generate: createProceduralTShirtGroup },
  hoodie: { generate: createProceduralHoodieGroup },
};
