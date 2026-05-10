'use client';

import { getBodyTypeConfig, getBodyTypesByCategory } from './models';

// UV template configuration for all body types
export interface UVTemplateConfig {
  bodyTypeId: string;
  category: 'women' | 'men' | 'children';
  templates: {
    shirt: string;
    pants: string;
    dress?: string; // Women only
    shorts?: string; // Children/summer
  };
}

// UV template paths for each body type
export const UV_TEMPLATE_CONFIGS: Record<string, UVTemplateConfig> = {
  // Women templates
  'female-standard': {
    bodyTypeId: 'female-standard',
    category: 'women',
    templates: {
      shirt: '/templates/makehuman/women/female-standard-shirt.png',
      pants: '/templates/makehuman/women/female-standard-pants.png',
      dress: '/templates/makehuman/women/female-standard-dress.png'
    }
  },
  'female-athletic': {
    bodyTypeId: 'female-athletic',
    category: 'women',
    templates: {
      shirt: '/templates/makehuman/women/female-athletic-shirt.png',
      pants: '/templates/makehuman/women/female-athletic-pants.png',
      dress: '/templates/makehuman/women/female-athletic-dress.png'
    }
  },
  'female-plus': {
    bodyTypeId: 'female-plus',
    category: 'women',
    templates: {
      shirt: '/templates/makehuman/women/female-plus-shirt.png',
      pants: '/templates/makehuman/women/female-plus-pants.png',
      dress: '/templates/makehuman/women/female-plus-dress.png'
    }
  },

  // Men templates
  'male-standard': {
    bodyTypeId: 'male-standard',
    category: 'men',
    templates: {
      shirt: '/templates/makehuman/men/male-standard-shirt.png',
      pants: '/templates/makehuman/men/male-standard-pants.png'
    }
  },
  'male-athletic': {
    bodyTypeId: 'male-athletic',
    category: 'men',
    templates: {
      shirt: '/templates/makehuman/men/male-athletic-shirt.png',
      pants: '/templates/makehuman/men/male-athletic-pants.png'
    }
  },
  'male-plus': {
    bodyTypeId: 'male-plus',
    category: 'men',
    templates: {
      shirt: '/templates/makehuman/men/male-plus-shirt.png',
      pants: '/templates/makehuman/men/male-plus-pants.png'
    }
  },

  // Children templates
  'child-toddler': {
    bodyTypeId: 'child-toddler',
    category: 'children',
    templates: {
      shirt: '/templates/makehuman/children/child-toddler-shirt.png',
      pants: '/templates/makehuman/children/child-toddler-pants.png',
      shorts: '/templates/makehuman/children/child-toddler-shorts.png'
    }
  },
  'child-youth': {
    bodyTypeId: 'child-youth',
    category: 'children',
    templates: {
      shirt: '/templates/makehuman/children/child-youth-shirt.png',
      pants: '/templates/makehuman/children/child-youth-pants.png',
      shorts: '/templates/makehuman/children/child-youth-shorts.png'
    }
  },
  'child-teen': {
    bodyTypeId: 'child-teen',
    category: 'children',
    templates: {
      shirt: '/templates/makehuman/children/child-teen-shirt.png',
      pants: '/templates/makehuman/children/child-teen-pants.png',
      shorts: '/templates/makehuman/children/child-teen-shorts.png'
    }
  }
};

// Helper functions
export function getUVTemplateConfig(bodyTypeId: string): UVTemplateConfig | undefined {
  return UV_TEMPLATE_CONFIGS[bodyTypeId];
}

export function getUVTemplatePath(bodyTypeId: string, clothingType: 'shirt' | 'pants' | 'dress' | 'shorts'): string | undefined {
  const config = getUVTemplateConfig(bodyTypeId);
  return config?.templates[clothingType];
}

export function getAvailableClothingTypes(bodyTypeId: string): string[] {
  const config = getUVTemplateConfig(bodyTypeId);
  if (!config) return [];
  
  return Object.keys(config.templates);
}

export function getTemplatesByCategory(category: 'women' | 'men' | 'children'): UVTemplateConfig[] {
  return Object.values(UV_TEMPLATE_CONFIGS).filter(config => config.category === category);
}

// Fallback to female templates for backward compatibility
export function getFallbackUVTemplate(clothingType: 'shirt' | 'pants' | 'dress' | 'shorts'): string {
  const fallbackPaths = {
    shirt: '/templates/makehuman/female/shirt.svg',
    pants: '/templates/makehuman/female/shirt.svg', // Use shirt as fallback
    dress: '/templates/makehuman/female/shirt.svg',
    shorts: '/templates/makehuman/female/shirt.svg'
  };
  
  return fallbackPaths[clothingType];
}
