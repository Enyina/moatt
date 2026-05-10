'use client';

// Model configuration for all body types using MakeHuman
export interface BodyTypeConfig {
  id: string;
  name: string;
  category: 'women' | 'men' | 'children';
  modelPath: string;
  scale: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  description: string;
}

// MakeHuman model mapping for all body types
export const BODY_TYPE_CONFIGS: Record<string, BodyTypeConfig> = {
  // Women body types
  'female-standard': {
    id: 'female-standard',
    name: 'Women Standard',
    category: 'women',
    modelPath: '/models/makehuman/female_standard.dae',
    scale: 1.0,
    position: [0, -1, 0],
    description: 'Standard adult female build'
  },
  'female-athletic': {
    id: 'female-athletic',
    name: 'Women Athletic',
    category: 'women',
    modelPath: '/models/makehuman/female_athletic.dae',
    scale: 1.0,
    position: [0, -1, 0],
    description: 'Athletic female build with toned proportions'
  },
  'female-plus': {
    id: 'female-plus',
    name: 'Women Plus Size',
    category: 'women',
    modelPath: '/models/makehuman/female_plus.dae',
    scale: 1.0,
    position: [0, -1, 0],
    description: 'Plus size female build'
  },

  // Men body types
  'male-standard': {
    id: 'male-standard',
    name: 'Men Standard',
    category: 'men',
    modelPath: '/models/makehuman/male_standard.dae',
    scale: 1.0,
    position: [0, -1, 0],
    description: 'Standard adult male build'
  },
  'male-athletic': {
    id: 'male-athletic',
    name: 'Men Athletic',
    category: 'men',
    modelPath: '/models/makehuman/male_athletic.dae',
    scale: 1.0,
    position: [0, -1, 0],
    description: 'Athletic male build with muscular proportions'
  },
  'male-plus': {
    id: 'male-plus',
    name: 'Men Plus Size',
    category: 'men',
    modelPath: '/models/makehuman/male_plus.dae',
    scale: 1.0,
    position: [0, -1, 0],
    description: 'Plus size male build'
  },

  // Children body types
  'child-toddler': {
    id: 'child-toddler',
    name: 'Child Toddler',
    category: 'children',
    modelPath: '/models/makehuman/child_toddler.dae',
    scale: 0.72,
    position: [0, -0.8, 0],
    description: 'Toddler build (ages 2-4)'
  },
  'child-youth': {
    id: 'child-youth',
    name: 'Child Youth',
    category: 'children',
    modelPath: '/models/makehuman/child_youth.dae',
    scale: 0.85,
    position: [0, -0.9, 0],
    description: 'Youth build (ages 8-12)'
  },
  'child-teen': {
    id: 'child-teen',
    name: 'Child Teen',
    category: 'children',
    modelPath: '/models/makehuman/child_teen.dae',
    scale: 0.95,
    position: [0, -0.95, 0],
    description: 'Teen build (ages 13-17)'
  }
};

// Helper functions
export function getBodyTypeConfig(id: string): BodyTypeConfig | undefined {
  return BODY_TYPE_CONFIGS[id];
}

export function getBodyTypesByCategory(category: 'women' | 'men' | 'children' | 'unisex'): BodyTypeConfig[] {
  return Object.values(BODY_TYPE_CONFIGS).filter(config => config.category === category);
}

export function getAllBodyTypes(): BodyTypeConfig[] {
  return Object.values(BODY_TYPE_CONFIGS);
}

// Fallback to current female_base.dae for backward compatibility
export function getModelPath(bodyTypeId: string): string {
  const config = getBodyTypeConfig(bodyTypeId);
  if (config) {
    return config.modelPath;
  }
  
  // Fallback logic - try to infer from ID
  if (bodyTypeId.includes('female') || bodyTypeId === '1' || bodyTypeId === '2' || bodyTypeId === '3') {
    return '/models/female_base.dae'; // Current fallback
  }
  
  // Default fallback
  return '/models/female_base.dae';
}
