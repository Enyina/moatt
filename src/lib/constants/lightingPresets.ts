export type LightingPreset = {
  id: string;
  name: string;
  description: string;
  dreiPreset: 'studio' | 'city' | 'apartment' | 'sunset' | 'dawn' | 'warehouse' | 'forest' | 'lobby' | 'night' | 'park';
  environmentIntensity: number;
  background: boolean;
  backgroundBlur?: number;
  exposure: number;
  keyLight?: {
    enabled: boolean;
    intensity: number;
    position: [number, number, number];
  };
};

export const LIGHTING_PRESETS: Record<string, LightingPreset> = {
  'studio-softbox': {
    id: 'studio-softbox',
    name: 'Studio Softbox',
    description: 'Clean, neutral product lighting with soft reflections.',
    dreiPreset: 'studio',
    environmentIntensity: 0.8,
    background: false,
    exposure: 1.0,
    keyLight: {
      enabled: true,
      intensity: 0.5,
      position: [5, 5, 5]
    }
  },
  'fashion-runway': {
    id: 'fashion-runway',
    name: 'Fashion Runway',
    description: 'High contrast, dramatic spotlighting.',
    dreiPreset: 'warehouse',
    environmentIntensity: 1.0,
    background: false,
    exposure: 1.2,
    keyLight: {
      enabled: true,
      intensity: 1.2,
      position: [0, 8, 8]
    }
  },
  'neutral-gray': {
    id: 'neutral-gray',
    name: 'Neutral Gray Studio',
    description: 'Evenly lit, low contrast environment for accurate color reading.',
    dreiPreset: 'studio',
    environmentIntensity: 0.6,
    background: true,
    backgroundBlur: 0.5,
    exposure: 0.9,
    keyLight: {
      enabled: true,
      intensity: 0.3,
      position: [-5, 5, 5]
    }
  },
  'outdoor-overcast': {
    id: 'outdoor-overcast',
    name: 'Outdoor Overcast',
    description: 'Soft, diffuse outdoor lighting with natural tones.',
    dreiPreset: 'park',
    environmentIntensity: 1.0,
    background: false,
    exposure: 1.0,
    keyLight: {
      enabled: true,
      intensity: 0.2,
      position: [2, 10, 2]
    }
  },
  'warm-showroom': {
    id: 'warm-showroom',
    name: 'Warm Showroom',
    description: 'Cozy, warm indoor lighting.',
    dreiPreset: 'apartment',
    environmentIntensity: 0.9,
    background: false,
    exposure: 1.1,
    keyLight: {
      enabled: true,
      intensity: 0.4,
      position: [4, 4, 4]
    }
  },
  'dark-editorial': {
    id: 'dark-editorial',
    name: 'Dark Editorial',
    description: 'Moody, low-key lighting for dramatic silhouettes.',
    dreiPreset: 'night',
    environmentIntensity: 0.4,
    background: false,
    exposure: 0.8,
    keyLight: {
      enabled: true,
      intensity: 0.8,
      position: [-6, 6, 4]
    }
  }
};

export const LIGHTING_PRESET_LIST = Object.values(LIGHTING_PRESETS);
export const DEFAULT_LIGHTING_PRESET_ID = 'studio-softbox';
