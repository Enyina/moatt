import type { DecalInstance, GarmentInstance, MaterialSlot, MeasurementKey } from '../../lib/types';
import {
  createDefaultGarmentInstance,
  getGarmentDefinition,
} from '../../lib/platform/garmentPlatform';
import type {
  LegacyStudioImport,
  SavedStudioGarment,
  SavedStudioLook,
  StudioGarmentInput,
  StudioInitInput,
  StudioMannequinState,
  StudioSelection,
  StudioState,
  StudioToolId,
} from './types';

const DEFAULT_MANNEQUIN: StudioMannequinState = {
  bodyTemplateId: 'female-standard',
  measurements: {},
  skinColor: '#9f6b4c',
  poseId: 'standing-default',
};

const now = (): string => new Date().toISOString();

const createId = (prefix: string): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

function createGarmentFromInput(input: StudioGarmentInput): GarmentInstance {
  const garment = createDefaultGarmentInstance(getGarmentDefinition(input.type), {
    id: input.id ?? createId(input.type),
    name: input.name,
    params: input.params,
    styleOptions: input.styleOptions,
    materials: input.materials,
    visible: input.visible,
  });

  return {
    ...garment,
    decals: input.decals?.map((decal) => ({ ...decal, anchor: { ...decal.anchor } })) ?? garment.decals,
    layer: input.layer ?? garment.layer,
  };
}

function pushHistory(state: StudioState, label: string): Pick<StudioState, 'historyPast' | 'historyFuture'> {
  const { historyPast: _historyPast, historyFuture: _historyFuture, ...snapshot } = state;
  void _historyPast;
  void _historyFuture;

  return {
    historyPast: [...state.historyPast, { label, snapshot }],
    historyFuture: [],
  };
}

function touch(state: StudioState): StudioState {
  return { ...state, updatedAt: now() };
}

function updateGarment(
  state: StudioState,
  garmentInstanceId: string,
  updater: (garment: GarmentInstance) => GarmentInstance,
  label: string,
): StudioState {
  const exists = state.outfit.garmentInstances.some((garment) => garment.id === garmentInstanceId);
  if (!exists) return state;

  return touch({
    ...state,
    ...pushHistory(state, label),
    outfit: {
      ...state.outfit,
      garmentInstances: state.outfit.garmentInstances.map((garment) => (
        garment.id === garmentInstanceId ? updater(garment) : garment
      )),
    },
  });
}

export function createInitialStudioState(input: StudioInitInput = {}): StudioState {
  const garments = input.garments?.length
    ? input.garments.map(createGarmentFromInput)
    : [createGarmentFromInput({ type: 'shirt' })];
  const activeGarmentInstanceId = garments[0]?.id ?? null;

  return {
    id: input.id ?? createId('studio'),
    name: input.name ?? 'Untitled Design',
    mannequin: {
      ...DEFAULT_MANNEQUIN,
      ...(input.mannequin ?? {}),
      measurements: {
        ...DEFAULT_MANNEQUIN.measurements,
        ...(input.mannequin?.measurements ?? {}),
      },
    },
    outfit: {
      id: createId('outfit'),
      name: input.name ?? 'Untitled Outfit',
      garmentInstances: garments,
      activeGarmentInstanceId,
    },
    selection: activeGarmentInstanceId
      ? { type: 'garment', garmentInstanceId: activeGarmentInstanceId }
      : { type: 'none' },
    activeToolId: 'select',
    draftOperation: null,
    camera: {
      view: 'three-quarter',
      mode: 'edit',
    },
    historyPast: [],
    historyFuture: [],
    updatedAt: now(),
  };
}

export function addGarmentToStudio(state: StudioState, input: StudioGarmentInput): StudioState {
  const garment = createGarmentFromInput(input);

  return touch({
    ...state,
    ...pushHistory(state, `Add ${garment.name}`),
    outfit: {
      ...state.outfit,
      garmentInstances: [...state.outfit.garmentInstances, garment],
      activeGarmentInstanceId: garment.id,
    },
    selection: { type: 'garment', garmentInstanceId: garment.id },
    activeToolId: 'select',
  });
}

export function selectStudioTarget(state: StudioState, selection: StudioSelection): StudioState {
  const activeGarmentInstanceId = 'garmentInstanceId' in selection
    ? selection.garmentInstanceId
    : state.outfit.activeGarmentInstanceId;

  return touch({
    ...state,
    selection,
    outfit: {
      ...state.outfit,
      activeGarmentInstanceId,
    },
  });
}

export function setStudioTool(state: StudioState, toolId: StudioToolId): StudioState {
  return touch({
    ...state,
    activeToolId: toolId,
    draftOperation: null,
  });
}

export function setStudioMannequin(
  state: StudioState,
  updates: Partial<Omit<StudioMannequinState, 'measurements'>> & {
    measurements?: Partial<Record<MeasurementKey, number | null>>;
  },
): StudioState {
  return touch({
    ...state,
    ...pushHistory(state, 'Update mannequin'),
    mannequin: {
      ...state.mannequin,
      ...updates,
      measurements: {
        ...state.mannequin.measurements,
        ...(updates.measurements ?? {}),
      },
    },
  });
}

export function updateStudioGarmentParams(
  state: StudioState,
  garmentInstanceId: string,
  params: Record<string, number>,
): StudioState {
  return updateGarment(
    state,
    garmentInstanceId,
    (garment) => ({
      ...garment,
      params: {
        ...garment.params,
        ...params,
      },
    }),
    'Update garment shape',
  );
}

export function updateStudioGarmentMaterial(
  state: StudioState,
  garmentInstanceId: string,
  materialSlotId: string,
  updates: Partial<MaterialSlot>,
): StudioState {
  return updateGarment(
    state,
    garmentInstanceId,
    (garment) => {
      const currentMaterial = garment.materials[materialSlotId] ?? {};

      return {
        ...garment,
        materials: {
          ...garment.materials,
          [materialSlotId]: {
            ...currentMaterial,
            ...updates,
            maps: {
              ...(currentMaterial.maps ?? {}),
              ...(updates.maps ?? {}),
            },
          },
        },
      };
    },
    'Update garment material',
  );
}

export function updateStudioGarmentStyleOption(
  state: StudioState,
  garmentInstanceId: string,
  optionId: string,
  value: string,
): StudioState {
  return updateGarment(
    state,
    garmentInstanceId,
    (garment) => ({
      ...garment,
      styleOptions: {
        ...garment.styleOptions,
        [optionId]: value,
      },
    }),
    'Update garment style',
  );
}

export function addStudioDecal(
  state: StudioState,
  garmentInstanceId: string,
  decal: Omit<DecalInstance, 'id' | 'zIndex'>,
): StudioState {
  return updateGarment(
    state,
    garmentInstanceId,
    (garment) => {
      const zIndex = garment.decals.length === 0
        ? 1
        : Math.max(...garment.decals.map((item) => item.zIndex)) + 1;
      const nextDecal: DecalInstance = {
        ...decal,
        id: createId('decal'),
        zIndex,
      };

      return {
        ...garment,
        decals: [...garment.decals, nextDecal],
      };
    },
    'Add graphic',
  );
}

type StudioDecalUpdate = Partial<Omit<DecalInstance, 'id' | 'anchor'>> & {
  anchor?: Partial<DecalInstance['anchor']>;
};

export function updateStudioDecal(
  state: StudioState,
  garmentInstanceId: string,
  decalId: string,
  updates: StudioDecalUpdate,
): StudioState {
  return updateGarment(
    state,
    garmentInstanceId,
    (garment) => ({
      ...garment,
      decals: garment.decals.map((decal) => (
        decal.id === decalId
          ? {
              ...decal,
              ...updates,
              anchor: {
                ...decal.anchor,
                ...(updates.anchor ?? {}),
              },
            }
          : decal
      )),
    }),
    'Update graphic',
  );
}

export function toggleStudioGarmentVisibility(
  state: StudioState,
  garmentInstanceId: string,
): StudioState {
  return updateGarment(
    state,
    garmentInstanceId,
    (garment) => ({ ...garment, visible: !garment.visible }),
    'Toggle garment visibility',
  );
}

export function duplicateStudioGarment(state: StudioState, garmentInstanceId: string): StudioState {
  const sourceGarment = state.outfit.garmentInstances.find((garment) => garment.id === garmentInstanceId);
  if (!sourceGarment) return state;

  const duplicate: GarmentInstance = {
    ...sourceGarment,
    id: createId(sourceGarment.type),
    name: `${sourceGarment.name} Copy`,
    materials: Object.fromEntries(
      Object.entries(sourceGarment.materials).map(([id, material]) => [id, { ...material, maps: { ...(material.maps ?? {}) } }]),
    ),
    decals: sourceGarment.decals.map((decal) => ({ ...decal, id: createId('decal') })),
  };

  return touch({
    ...state,
    ...pushHistory(state, `Duplicate ${sourceGarment.name}`),
    outfit: {
      ...state.outfit,
      garmentInstances: [...state.outfit.garmentInstances, duplicate],
      activeGarmentInstanceId: duplicate.id,
    },
    selection: { type: 'garment', garmentInstanceId: duplicate.id },
  });
}

export function removeStudioGarment(state: StudioState, garmentInstanceId: string): StudioState {
  const nextGarments = state.outfit.garmentInstances.filter((garment) => garment.id !== garmentInstanceId);
  if (nextGarments.length === state.outfit.garmentInstances.length) return state;

  const activeGarmentInstanceId = state.outfit.activeGarmentInstanceId === garmentInstanceId
    ? nextGarments[0]?.id ?? null
    : state.outfit.activeGarmentInstanceId;

  return touch({
    ...state,
    ...pushHistory(state, 'Remove garment'),
    outfit: {
      ...state.outfit,
      garmentInstances: nextGarments,
      activeGarmentInstanceId,
    },
    selection: activeGarmentInstanceId
      ? { type: 'garment', garmentInstanceId: activeGarmentInstanceId }
      : { type: 'none' },
  });
}

function cloneSavedGarment(source: GarmentInstance, name = source.name): SavedStudioGarment {
  return {
    id: source.id,
    name,
    type: source.type,
    params: { ...source.params },
    styleOptions: { ...source.styleOptions },
    materials: Object.fromEntries(
      Object.entries(source.materials).map(([id, material]) => [id, { ...material, maps: { ...(material.maps ?? {}) } }]),
    ),
    decals: source.decals.map((decal) => ({ ...decal, anchor: { ...decal.anchor } })),
    layer: source.layer,
  };
}

export function createSavedStudioGarment(
  state: StudioState,
  garmentInstanceId = state.outfit.activeGarmentInstanceId,
  name?: string,
): SavedStudioGarment | null {
  const garment = state.outfit.garmentInstances.find((item) => item.id === garmentInstanceId);
  return garment ? cloneSavedGarment(garment, name ?? garment.name) : null;
}

export function applySavedStudioGarment(
  state: StudioState,
  savedGarment: SavedStudioGarment,
  options: { id?: string; name?: string } = {},
): StudioState {
  return addGarmentToStudio(state, {
    id: options.id ?? createId(savedGarment.type),
    name: options.name ?? savedGarment.name,
    type: savedGarment.type,
    params: savedGarment.params,
    styleOptions: savedGarment.styleOptions,
    materials: savedGarment.materials,
    decals: savedGarment.decals,
    layer: savedGarment.layer,
  });
}

export function createSavedStudioLook(state: StudioState, name = state.name): SavedStudioLook {
  return {
    schemaVersion: 1,
    id: createId('look'),
    name,
    mannequin: {
      ...state.mannequin,
      measurements: { ...state.mannequin.measurements },
    },
    garments: state.outfit.garmentInstances.map((garment) => cloneSavedGarment(garment)),
    activeGarmentInstanceId: state.outfit.activeGarmentInstanceId,
    camera: { ...state.camera },
    savedAt: now(),
  };
}

export function applySavedStudioLook(
  state: StudioState,
  savedLook: SavedStudioLook,
  options: { keepCurrentMannequin?: boolean } = {},
): StudioState {
  const garments = savedLook.garments.map((garment) => createGarmentFromInput({
    ...garment,
    id: createId(garment.type),
    decals: garment.decals,
  }));
  const activeGarmentInstanceId = garments[0]?.id ?? null;

  return touch({
    ...state,
    ...pushHistory(state, `Apply ${savedLook.name}`),
    name: savedLook.name,
    mannequin: options.keepCurrentMannequin
      ? state.mannequin
      : {
          ...savedLook.mannequin,
          measurements: { ...savedLook.mannequin.measurements },
        },
    outfit: {
      id: createId('outfit'),
      name: savedLook.name,
      garmentInstances: garments,
      activeGarmentInstanceId,
    },
    selection: activeGarmentInstanceId
      ? { type: 'garment', garmentInstanceId: activeGarmentInstanceId }
      : { type: 'none' },
    camera: { ...savedLook.camera },
  });
}

export function createStudioInputFromLegacyDesign({ legacy }: LegacyStudioImport): StudioInitInput {
  return {
    id: legacy.id,
    name: legacy.name,
    mannequin: {
      bodyTemplateId: legacy.bodyTemplate,
      measurements: legacy.measurementValues,
    },
    garments: [
      {
        id: `${legacy.id}_garment`,
        type: legacy.garmentType,
        params: {},
        styleOptions: legacy.selectedStyleOptions,
        materials: legacy.materialSelections,
        decals: legacy.decals,
      },
    ],
  };
}
