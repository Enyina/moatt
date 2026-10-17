import { create } from 'zustand';

export interface Sticker {
  id: string;
  image: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
}

export interface PartMaterial {
  color: string;
  roughness: number;
  metalness: number;
  texture?: string;
}

interface PivotState {
  activePart: string | null;
  parts: Record<string, PartMaterial>;
  stickers: Sticker[];
  viewMode: 'standard' | 'exploded' | 'wireframe';
  environment: string;
  intensity: number;
  
  // Actions
  setActivePart: (part: string | null) => void;
  setPartColor: (part: string, color: string) => void;
  setPartTexture: (part: string, texture: string) => void;
  setPartProperty: (part: string, key: keyof PartMaterial, value: any) => void;
  addSticker: (image: string, position: [number, number, number], rotation?: [number, number, number]) => string;
  removeSticker: (id: string) => void;
  updateSticker: (id: string, updates: Partial<Sticker>) => void;
  setEnvironment: (env: string) => void;
  setIntensity: (val: number) => void;
}

export const usePivotStore = create<PivotState>((set) => ({
  activePart: null,
  parts: {
    'torso': { color: '#ffffff', roughness: 0.7, metalness: 0.1 },
    'legs': { color: '#ffffff', roughness: 0.7, metalness: 0.1 },
    'arms': { color: '#ffffff', roughness: 0.7, metalness: 0.1 },
  },
  stickers: [],
  viewMode: 'standard',
  environment: 'city',
  intensity: 1.0,

  setActivePart: (part) => set({ activePart: part }),
  
  setPartColor: (part, color) => set((state) => {
    const partConfig = state.parts[part] || { color: '#ffffff', roughness: 0.7, metalness: 0.1 };
    return {
      parts: {
        ...state.parts,
        [part]: { ...partConfig, color }
      }
    };
  }),

  setPartTexture: (part, texture) => set((state) => {
    const partConfig = state.parts[part] || { color: '#ffffff', roughness: 0.7, metalness: 0.1 };
    return {
      parts: {
        ...state.parts,
        [part]: { ...partConfig, texture },
      },
    };
  }),

  setPartProperty: (part, key, value) => set((state) => {
    const partConfig = state.parts[part] || { color: '#ffffff', roughness: 0.7, metalness: 0.1 };
    return {
      parts: {
        ...state.parts,
        [part]: { ...partConfig, [key]: value }
      }
    };
  }),

  addSticker: (image, position, rotation = [0, 0, 0]) => {
    const id = Math.random().toString(36).substr(2, 9);
    set((state) => ({
      stickers: [...state.stickers, { id, image, position, rotation, scale: [0.2, 0.2, 0.2] }]
    }));
    return id;
  },

  removeSticker: (id) => set((state) => ({
    stickers: state.stickers.filter(s => s.id !== id)
  })),

  updateSticker: (id, updates) => set((state) => ({
    stickers: state.stickers.map(s => s.id === id ? { ...s, ...updates } : s)
  })),

  setEnvironment: (env) => set({ environment: env }),
  setIntensity: (intensity) => set({ intensity }),
}));
