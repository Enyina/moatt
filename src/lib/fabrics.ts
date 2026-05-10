import * as THREE from 'three';

export interface FabricMaterial {
  id: string;
  name: string;
  baseTexture?: string;
  normalMap?: string;
  roughnessMap?: string;
  metalness?: number;
  roughness?: number;
  bumpScale?: number;
  category: 'cotton' | 'silk' | 'denim' | 'wool' | 'leather' | 'synthetic';
}

export const FABRIC_MATERIALS: FabricMaterial[] = [
  // Cotton fabrics
  {
    id: 'cotton-white',
    name: 'White Cotton',
    category: 'cotton',
    roughness: 0.8,
    metalness: 0.05,
    bumpScale: 0.02,
  },
  {
    id: 'cotton-heather',
    name: 'Heather Cotton',
    category: 'cotton',
    roughness: 0.85,
    metalness: 0.03,
    bumpScale: 0.03,
  },

  // Denim
  {
    id: 'denim-blue',
    name: 'Classic Denim',
    category: 'denim',
    roughness: 0.9,
    metalness: 0.02,
    bumpScale: 0.05,
  },
  {
    id: 'denim-black',
    name: 'Black Denim',
    category: 'denim',
    roughness: 0.88,
    metalness: 0.04,
    bumpScale: 0.04,
  },

  // Silk
  {
    id: 'silk-white',
    name: 'White Silk',
    category: 'silk',
    roughness: 0.3,
    metalness: 0.1,
    bumpScale: 0.01,
  },
  {
    id: 'silk-red',
    name: 'Red Silk',
    category: 'silk',
    roughness: 0.35,
    metalness: 0.08,
    bumpScale: 0.01,
  },

  // Wool
  {
    id: 'wool-knit',
    name: 'Knit Wool',
    category: 'wool',
    roughness: 0.95,
    metalness: 0.01,
    bumpScale: 0.08,
  },
  {
    id: 'wool-cashmere',
    name: 'Cashmere',
    category: 'wool',
    roughness: 0.92,
    metalness: 0.02,
    bumpScale: 0.06,
  },

  // Leather
  {
    id: 'leather-black',
    name: 'Black Leather',
    category: 'leather',
    roughness: 0.4,
    metalness: 0.15,
    bumpScale: 0.03,
  },
  {
    id: 'leather-brown',
    name: 'Brown Leather',
    category: 'leather',
    roughness: 0.45,
    metalness: 0.12,
    bumpScale: 0.04,
  },

  // Synthetic
  {
    id: 'polyester',
    name: 'Polyester',
    category: 'synthetic',
    roughness: 0.6,
    metalness: 0.08,
    bumpScale: 0.02,
  },
  {
    id: 'nylon',
    name: 'Nylon',
    category: 'synthetic',
    roughness: 0.5,
    metalness: 0.1,
    bumpScale: 0.015,
  },
];

export function getFabricMaterial(id: string): FabricMaterial | undefined {
  return FABRIC_MATERIALS.find(fabric => fabric.id === id);
}

export function getFabricsByCategory(category: FabricMaterial['category']): FabricMaterial[] {
  return FABRIC_MATERIALS.filter(fabric => fabric.category === category);
}

// Helper to create Three.js material from fabric config
export function createFabricMaterial(fabric: FabricMaterial, texture?: THREE.Texture): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: fabric.roughness ?? 0.8,
    metalness: fabric.metalness ?? 0.05,
    bumpScale: fabric.bumpScale ?? 0.02,
    side: THREE.DoubleSide,
  });
}
