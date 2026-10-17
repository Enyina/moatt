import { create } from 'zustand';
import { GarmentInstance as ProceduralGarmentInstance, HoodieParams, TShirtParams } from '@/lib/procedural/garmentTypes';
import { DEFAULT_TSHIRT_PARAMS } from '@/lib/procedural/tshirt';
import { DEFAULT_HOODIE_PARAMS } from '@/lib/procedural/hoodie';
import type { GarmentInstance, GarmentType } from '@/lib/types';
import {
  createDefaultGarmentInstance,
  getGarmentDefinition,
  getProceduralTypeForGarment,
} from '@/lib/platform/garmentPlatform';

const DEFAULT_SHIRT_INSTANCE = createDefaultGarmentInstance(getGarmentDefinition('shirt'), {
  id: 'shirt-basic',
  params: { ...DEFAULT_TSHIRT_PARAMS },
});

function toProceduralGarmentInstance(instance: GarmentInstance | null): ProceduralGarmentInstance | null {
  if (!instance) return null;

  const proceduralType = getProceduralTypeForGarment(instance.type);
  if (proceduralType === 'tshirt') {
    return {
      id: instance.id,
      type: 'tshirt',
      params: instance.params as TShirtParams,
    };
  }
  if (proceduralType === 'hoodie') {
    return {
      id: instance.id,
      type: 'hoodie',
      params: instance.params as HoodieParams,
    };
  }

  return null;
}

function fromProceduralGarmentInstance(instance: ProceduralGarmentInstance): GarmentInstance {
  const type: GarmentType = instance.type === 'tshirt' ? 'shirt' : instance.type;
  return createDefaultGarmentInstance(getGarmentDefinition(type), {
    id: instance.id,
    params: instance.params,
  });
}

type GarmentStore = {
  garmentInstances: GarmentInstance[];
  activeGarmentInstanceId: string | null;
  activeGarment: ProceduralGarmentInstance | null;
  garmentVersion: number;
  
  setGarmentInstances: (garments: GarmentInstance[], activeId?: string | null) => void;
  setActiveGarmentInstance: (id: string | null) => void;
  addGarmentInstance: (garment: GarmentInstance) => void;
  setActiveGarmentFromDefinition: (type: GarmentType) => void;
  setActiveGarment: (garment: ProceduralGarmentInstance | null) => void;
  updateGarmentParams: (partialParams: Partial<HoodieParams | TShirtParams>) => void;
  applyPreset: (params: HoodieParams | TShirtParams) => void;
};

export const useGarmentStore = create<GarmentStore>((set) => ({
  garmentInstances: [DEFAULT_SHIRT_INSTANCE],
  activeGarmentInstanceId: DEFAULT_SHIRT_INSTANCE.id,
  activeGarment: toProceduralGarmentInstance(DEFAULT_SHIRT_INSTANCE),
  garmentVersion: 0,

  setGarmentInstances: (garments, activeId) => {
    const nextActiveId = activeId === undefined ? garments[0]?.id ?? null : activeId;
    const activeInstance = garments.find((garment) => garment.id === nextActiveId) ?? null;
    set({
      garmentInstances: garments,
      activeGarmentInstanceId: activeInstance?.id ?? null,
      activeGarment: toProceduralGarmentInstance(activeInstance),
      garmentVersion: 0,
    });
  },

  setActiveGarmentInstance: (id) => set((state) => {
    const activeInstance = state.garmentInstances.find((garment) => garment.id === id) ?? null;
    return {
      activeGarmentInstanceId: activeInstance?.id ?? null,
      activeGarment: toProceduralGarmentInstance(activeInstance),
      garmentVersion: state.garmentVersion + 1,
    };
  }),

  addGarmentInstance: (garment) => set((state) => ({
    garmentInstances: [...state.garmentInstances, garment],
    activeGarmentInstanceId: garment.id,
    activeGarment: toProceduralGarmentInstance(garment),
    garmentVersion: state.garmentVersion + 1,
  })),

  setActiveGarmentFromDefinition: (type) => set((state) => {
    const definition = getGarmentDefinition(type);
    if (definition.status !== 'available') return state;

    const existing = state.garmentInstances.find((garment) => garment.type === type);
    const activeInstance = existing ?? createDefaultGarmentInstance(definition, {
      id: type === 'shirt' ? 'shirt-basic' : `${type}-basic`,
    });
    const nextGarments = existing
      ? state.garmentInstances
      : [...state.garmentInstances, activeInstance];

    return {
      garmentInstances: nextGarments,
      activeGarmentInstanceId: activeInstance.id,
      activeGarment: toProceduralGarmentInstance(activeInstance),
      garmentVersion: state.garmentVersion + 1,
    };
  }),

  setActiveGarment: (garment) => set((state) => {
    if (!garment) {
      return {
        activeGarmentInstanceId: null,
        activeGarment: null,
        garmentVersion: state.garmentVersion + 1,
      };
    }

    const platformGarment = fromProceduralGarmentInstance(garment);
    const nextGarments = state.garmentInstances.some((item) => item.id === platformGarment.id)
      ? state.garmentInstances.map((item) => item.id === platformGarment.id ? platformGarment : item)
      : [...state.garmentInstances, platformGarment];

    return {
      garmentInstances: nextGarments,
      activeGarmentInstanceId: platformGarment.id,
      activeGarment: garment,
      garmentVersion: state.garmentVersion + 1,
    };
  }),

  updateGarmentParams: (partialParams) => set((state) => {
    const activeInstance = state.garmentInstances.find((garment) => garment.id === state.activeGarmentInstanceId);
    if (!activeInstance) return state;

    const nextInstance: GarmentInstance = {
      ...activeInstance,
      params: {
        ...activeInstance.params,
        ...partialParams,
      },
    };

    return {
      garmentInstances: state.garmentInstances.map((garment) => garment.id === nextInstance.id ? nextInstance : garment),
      activeGarment: toProceduralGarmentInstance(nextInstance),
      garmentVersion: state.garmentVersion + 1,
    };
  }),

  applyPreset: (params) => set((state) => {
    const activeInstance = state.garmentInstances.find((garment) => garment.id === state.activeGarmentInstanceId);
    if (!activeInstance) return state;

    const nextInstance: GarmentInstance = {
      ...activeInstance,
      params: { ...params },
    };

    return {
      garmentInstances: state.garmentInstances.map((garment) => garment.id === nextInstance.id ? nextInstance : garment),
      activeGarment: toProceduralGarmentInstance(nextInstance),
      garmentVersion: state.garmentVersion + 1,
    };
  })
}));

export const GARMENT_PRESETS = {
  hoodie: {
    regular: DEFAULT_HOODIE_PARAMS,
    oversized: {
      ...DEFAULT_HOODIE_PARAMS,
      looseness: 1.3,
      torsoWidth: 0.85,
      sleeveTopRadius: 0.18,
      sleeveCuffRadius: 0.12,
    },
    slim: {
      ...DEFAULT_HOODIE_PARAMS,
      looseness: 0.95,
      torsoWidth: 0.68,
      sleeveTopRadius: 0.12,
      sleeveCuffRadius: 0.08,
    },
    cropped: {
      ...DEFAULT_HOODIE_PARAMS,
      torsoLength: 0.55,
      pocketHeight: 0.15,
      looseness: 1.15,
    }
  },
  tshirt: {
    regular: DEFAULT_TSHIRT_PARAMS,
    oversized: {
      ...DEFAULT_TSHIRT_PARAMS,
      looseness: 1.25,
      torsoWidth: 0.65,
      sleeveLength: 0.4,
      sleeveTopRadius: 0.15,
    },
    slim: {
      ...DEFAULT_TSHIRT_PARAMS,
      looseness: 0.9,
      torsoWidth: 0.48,
      sleeveTopRadius: 0.1,
    },
    cropped: {
      ...DEFAULT_TSHIRT_PARAMS,
      torsoLength: 0.45,
      looseness: 1.1,
    }
  }
};
