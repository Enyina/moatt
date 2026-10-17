/**
 * Editor Store - Active editing session state
 * MVP: Brush, color picker, undo/redo
 */

import { create } from 'zustand';
import {
  ClothingLayer,
  ProductState,
  Selection,
  ConfiguratorView,
  DecalInstance,
  DesignImportResult,
  GarmentDefinition,
  GarmentType,
  MeasurementKey,
  MaterialSlot,
  SavedDesignDocument,
  SavedProject
} from '@/lib/types';
import {
  buildProductStateFromGarment,
  DEFAULT_GARMENT_TYPE,
  GARMENT_DEFINITIONS,
} from '@/lib/constants/products';
import {
  normalizeImportedDesign,
} from '@/lib/designPersistence';

export type ToolType = 'select' | 'brush' | 'eraser' | 'shape' | 'decal';


export interface BrushConfig {
  size: number;        // 1-50px
  opacity: number;     // 10-100%
  color: string;         // hex
  hardness: number;     // 0-100 (brush edge hardness)
}

export interface Point {
  x: number;
  y: number;
  pressure?: number;
}

export interface BrushStroke {
  id: string;
  tool: ToolType;
  points: Point[];
  color: string;
  size: number;
  opacity: number;
  timestamp: number;
}

export interface HistoryState {
  strokes: BrushStroke[];
  timestamp: number;
}
interface EditorState {
  // Config state
  selectedBodyType: string;
  selectedClothingType: GarmentType;
  selectedGarmentDefinition: GarmentDefinition;
  selectedStyleOptions: Record<string, string>;
  measurementValues: Record<MeasurementKey, number | null>;

  // Tool state
  selectedTool: ToolType;
  brushConfig: BrushConfig;
  strokes: BrushStroke[];
  canvasSize: { width: number; height: number };
  lastUV: { uv: Point; isFirst: boolean } | null;

  // Showroom Workflow State
  viewMode: 'item' | 'full'; // 'item' = isolated garment, 'full' = on mannequin
  renderStage: 1 | 2 | 3;    // 1: Draft, 2: Preview Item, 3: Wear on Model
  finalTexture: string | null; // DataURL of the captured 2D canvas

  // UI state
  showGrid: boolean;
  showPreview: boolean;
  isExporting: boolean;
  importError: string | null;
  lastImportWarnings: string[];
  previewThumbnail: string | null;

  // Layer management
  layers: ClothingLayer[];
  activeLayerId: string | null;
  activeFabricId: string | null;
  activeDecalUrl: string | null;

  // Actions
  setBodyType: (type: string) => void;
  setClothingType: (type: string) => void;
  setStyleOption: (optionName: string, value: string) => void;
  setMeasurementValue: (measurement: MeasurementKey, value: number | null) => void;
  setTool: (tool: ToolType) => void;
  setBrushConfig: (config: Partial<BrushConfig>) => void;
  setLastUV: (lastUV: EditorState['lastUV']) => void;
  setDecal: (url: string | null) => void;
  setViewMode: (mode: 'item' | 'full') => void;
  setRenderStage: (stage: 1 | 2 | 3) => void;
  setFinalTexture: (url: string | null) => void;
  setPreviewThumbnail: (url: string | null) => void;
  exportDesignDocument: (name?: string, previewThumbnail?: string | null) => SavedProject;
  importDesignDocument: (input: unknown) => DesignImportResult;

  // Layer Actions
  addLayer: (layer: Partial<ClothingLayer>) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<ClothingLayer>) => void;
  setActiveLayer: (id: string | null) => void;
  setActiveFabric: (id: string | null) => void;

  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  resetDrawingState: () => void;

  // --- NEW CONFIGURATOR STATE (SHADOW SYSTEM) ---
  product: ProductState;
  selection: Selection;
  configView: ConfiguratorView;

  // Configurator Actions
  setInteractionMode: (mode: ConfiguratorView['mode']) => void;
  selectTarget: (selection: Selection) => void;
  updateMaterial: (slotId: string, updates: Partial<MaterialSlot>) => void;
  addDecalInstance: (decal: Omit<DecalInstance, 'id' | 'zIndex'>) => void;
  updateDecalInstance: (id: string, updates: Partial<DecalInstance>) => void;
  removeDecalInstance: (id: string) => void;
  invalidateScene: () => void;

  // Computed (Helper)
  getInteractionIntent: () => 'select' | 'stamp' | 'none';

  // Fabric Canvas State
  fabricCanvasState: any;
  setFabricCanvasState: (state: any) => void;

  // Environment State
  activeLightingPresetId: string;
  setActiveLightingPresetId: (id: string) => void;
}


const DEFAULT_BRUSH_CONFIG: BrushConfig = {
  size: 20,
  opacity: 100,
  color: '#EA931D',
  hardness: 80,
};

const MEASUREMENT_KEYS: MeasurementKey[] = [
  'chest',
  'bust',
  'waist',
  'hip',
  'shoulder',
  'sleeve',
  'length',
  'inseam',
  'thigh',
  'neck',
];

const createDecalId = (): string => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `decal_${crypto.randomUUID()}`;
  }

  return `decal_${Date.now()}_${Math.random().toString(36).slice(2)}`;
};

const getNextDecalZIndex = (decals: DecalInstance[]): number => {
  if (decals.length === 0) return 1;
  return Math.max(...decals.map((decal) => decal.zIndex)) + 1;
};

const getDefaultStyleOptions = (garment: GarmentDefinition): Record<string, string> => (
  Object.entries(garment.styleOptions).reduce<Record<string, string>>((options, [optionName, values]) => {
    const firstValue = values[0];
    if (firstValue) {
      options[optionName] = firstValue;
    }
    return options;
  }, {})
);

const createEmptyMeasurementValues = (): Record<MeasurementKey, number | null> => (
  MEASUREMENT_KEYS.reduce<Record<MeasurementKey, number | null>>((measurements, measurement) => {
    measurements[measurement] = null;
    return measurements;
  }, {} as Record<MeasurementKey, number | null>)
);

const keepRequiredMeasurements = (
  currentMeasurements: Record<MeasurementKey, number | null>,
  garment: GarmentDefinition,
): Record<MeasurementKey, number | null> => (
  MEASUREMENT_KEYS.reduce<Record<MeasurementKey, number | null>>((measurements, measurement) => {
    measurements[measurement] = garment.requiredMeasurements.includes(measurement)
      ? currentMeasurements[measurement] ?? null
      : null;
    return measurements;
  }, {} as Record<MeasurementKey, number | null>)
);

export const useEditorStore = create<EditorState>()((set, get) => ({
  // Initial state
  selectedBodyType: 'female-standard',
  selectedClothingType: DEFAULT_GARMENT_TYPE,
  selectedGarmentDefinition: GARMENT_DEFINITIONS[DEFAULT_GARMENT_TYPE],
  selectedStyleOptions: getDefaultStyleOptions(GARMENT_DEFINITIONS[DEFAULT_GARMENT_TYPE]),
  measurementValues: keepRequiredMeasurements(createEmptyMeasurementValues(), GARMENT_DEFINITIONS[DEFAULT_GARMENT_TYPE]),
  selectedTool: 'brush',
  brushConfig: DEFAULT_BRUSH_CONFIG,
  strokes: [],
  canvasSize: { width: 2048, height: 2048 },
  lastUV: null,

  viewMode: 'full',
  renderStage: 1,
  finalTexture: null,

  showGrid: true,
  showPreview: false,
  isExporting: false,
  importError: null,
  lastImportWarnings: [],
  previewThumbnail: null,

  // Layers
  layers: [
    {
      id: 'base-fabric',
      name: 'Base Fabric',
      type: 'fabric',
      textureUrl: '',
      visible: true,
      opacity: 1,
      blendMode: 'normal'
    },
    {
      id: 'paint-layer-1',
      name: 'Design Layer 1',
      type: 'paint',
      textureUrl: '',
      visible: true,
      opacity: 1,
      blendMode: 'normal'
    }
  ],
  activeLayerId: 'paint-layer-1',
  activeFabricId: 'cotton-white',
  activeDecalUrl: null,

  // Actions
  setBodyType: (type) => set({ selectedBodyType: type }),
  setClothingType: (type) => set(state => {
    const garmentType = type in GARMENT_DEFINITIONS
      ? type as GarmentType
      : DEFAULT_GARMENT_TYPE;
    const garment = GARMENT_DEFINITIONS[garmentType];

    if (garment.status !== 'available') {
      console.warn('[EditorStore] Garment is not available yet:', garmentType);
      return {};
    }

    return {
      selectedClothingType: garmentType,
      selectedGarmentDefinition: garment,
      selectedStyleOptions: getDefaultStyleOptions(garment),
      measurementValues: keepRequiredMeasurements(state.measurementValues, garment),
      product: buildProductStateFromGarment(garment),
      selection: { type: 'none' },
      activeDecalUrl: null,
      selectedTool: 'brush',
      configView: {
        ...state.configView,
        sceneVersion: state.configView.sceneVersion + 1,
      },
    };
  }),
  setMeasurementValue: (measurement, value) => set(state => {
    if (!state.selectedGarmentDefinition.requiredMeasurements.includes(measurement)) {
      console.warn('[EditorStore] Measurement is not required for active garment:', measurement);
      return {};
    }

    return {
      measurementValues: {
        ...state.measurementValues,
        [measurement]: value,
      },
      configView: {
        ...state.configView,
        sceneVersion: state.configView.sceneVersion + 1,
      },
    };
  }),
  setStyleOption: (optionName, value) => set(state => {
    const allowedValues = state.selectedGarmentDefinition.styleOptions[
      optionName as keyof GarmentDefinition['styleOptions']
    ];

    if (!allowedValues?.includes(value)) {
      console.warn('[EditorStore] Invalid style option:', optionName, value);
      return {};
    }

    return {
      selectedStyleOptions: {
        ...state.selectedStyleOptions,
        [optionName]: value,
      },
      configView: {
        ...state.configView,
        sceneVersion: state.configView.sceneVersion + 1,
      },
    };
  }),
  setTool: (tool) => set({ selectedTool: tool }),
  setLastUV: (lastUV) => set({ lastUV }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setRenderStage: (stage) => set({ renderStage: stage }),
  setFinalTexture: (url) => set({ finalTexture: url }),
  setPreviewThumbnail: (url) => set({ previewThumbnail: url }),
  setFabricCanvasState: (state) => set({ fabricCanvasState: state }),
  exportDesignDocument: (name, previewThumbnail) => {
    const state = get();
    // Dynamically import GarmentStore to break circular dependencies if any,
    // or just use useGarmentStore.getState()
    const { useGarmentStore } = require('./garmentStore');
    const { createSavedProject } = require('../lib/designPersistence');

    const garmentStoreState = useGarmentStore.getState();

    if (!garmentStoreState.activeGarment) {
      throw new Error("Cannot export: No active garment.");
    }

    return createSavedProject({
      bodyTemplate: state.selectedBodyType,
      measurementValues: state.measurementValues,
      name,
      previewThumbnail: previewThumbnail ?? state.previewThumbnail,
      product: state.product,
      sceneMode: state.configView.mode,
      selectedStyleOptions: state.selectedStyleOptions,
      activeGarment: garmentStoreState.activeGarment,
      garmentInstances: garmentStoreState.garmentInstances,
      fabricCanvasState: state.fabricCanvasState,
      activeLightingPresetId: state.activeLightingPresetId,
    });
  },
  importDesignDocument: (input) => {
    try {
      const state = get();
      const { useGarmentStore } = require('./garmentStore');
      const { normalizeImportedDesign } = require('../lib/designPersistence');

      const normalizedDesign = normalizeImportedDesign(input, {
        currentBodyTemplate: state.selectedBodyType,
      });

      // Restore Editor State
      set({
        activeDecalUrl: null,
        importError: null,
        lastImportWarnings: normalizedDesign.warnings,
        measurementValues: normalizedDesign.measurementValues,
        previewThumbnail: normalizedDesign.previewThumbnail,
        product: normalizedDesign.product,
        selectedBodyType: normalizedDesign.bodyTemplate,
        selectedClothingType: normalizedDesign.garment.type,
        selectedGarmentDefinition: normalizedDesign.garment,
        selectedStyleOptions: normalizedDesign.selectedStyleOptions,
        selectedTool: 'brush',
        selection: { type: 'none' },
        fabricCanvasState: normalizedDesign.fabricCanvasState || null,
        activeLightingPresetId: normalizedDesign.activeLightingPresetId || 'studio-softbox',
        configView: {
          ...state.configView,
          mode: normalizedDesign.sceneMode,
          sceneVersion: state.configView.sceneVersion + 1,
        },
      });

      // Restore Garment State
      if (normalizedDesign.garmentInstances.length > 0) {
        useGarmentStore.getState().setGarmentInstances(
          normalizedDesign.garmentInstances,
          normalizedDesign.activeGarment.id,
        );
      } else if (normalizedDesign.activeGarment) {
        useGarmentStore.getState().setActiveGarment(normalizedDesign.activeGarment);
      }

      return { ok: true, warnings: normalizedDesign.warnings };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Design import failed.';
      set({
        importError: message,
        lastImportWarnings: [],
      });
      return { ok: false, warnings: [message] };
    }
  },
  
  setBrushConfig: (config) => set(state => ({
    brushConfig: { ...state.brushConfig, ...config }
  })),

  setDecal: (url) => set({ 
    activeDecalUrl: url, 
    selectedTool: url ? 'decal' : 'brush' 
  }),

  resetDrawingState: () => {
    // Legacy cleanup
  },

  // Layer Management
  addLayer: (layer) => {
    const id = `layer_${Date.now()}`;
    const newLayer: ClothingLayer = {
      id,
      name: layer.name || `Layer ${get().layers.length + 1}`,
      type: layer.type || 'paint',
      textureUrl: layer.textureUrl || '',
      visible: layer.visible ?? true,
      opacity: layer.opacity ?? 1,
      blendMode: layer.blendMode || 'normal',
      resolution: layer.resolution || 2048
    };
    set(state => ({
      layers: [...state.layers, newLayer],
      activeLayerId: id
    }));
  },

  removeLayer: (id) => set(state => {
    const newLayers = state.layers.filter(l => l.id !== id);
    return {
      layers: newLayers,
      activeLayerId: state.activeLayerId === id ? (newLayers[newLayers.length - 1]?.id || null) : state.activeLayerId
    };
  }),

  updateLayer: (id, updates) => set(state => ({
    layers: state.layers.map(l => l.id === id ? { ...l, ...updates } : l)
  })),

  setActiveLayer: (id) => set({ activeLayerId: id }),
  setActiveFabric: (id) => set({ activeFabricId: id }),

  undo: () => console.log('Undo logic moved to 2D engine'),
  redo: () => console.log('Redo logic moved to 2D engine'),
  clearCanvas: () => {
    const activeId = get().activeLayerId;
    if (activeId) {
      get().updateLayer(activeId, { textureUrl: '' });
    }
  },

  // --- NEW CONFIGURATOR IMPLEMENTATION ---
  product: buildProductStateFromGarment(GARMENT_DEFINITIONS[DEFAULT_GARMENT_TYPE]),
  selection: {
    type: 'none'
  },
  configView: {
    mode: 'edit',
    sceneVersion: 0
  },
  fabricCanvasState: null,
  activeLightingPresetId: 'studio-softbox',

  getInteractionIntent: () => {
    const { configView, selection, activeDecalUrl } = get();
    if (configView.mode === 'orbit') return 'none';
    if (activeDecalUrl) return 'stamp';
    return 'select';
  },

  setInteractionMode: (mode) => set(state => ({
    configView: { ...state.configView, mode }
  })),

  selectTarget: (selection) => {
    // 3. Selection -> Mesh Resolution Guard
    if (selection.type === 'mesh' && !get().product.meshes[selection.targetId]) {
      console.warn('[EditorStore] Invalid selection target meshId:', selection.targetId);
      return;
    }
    if (selection.type === 'decal' && !get().product.decals.some((decal) => decal.id === selection.targetId)) {
      console.warn('[EditorStore] Invalid selection target decalId:', selection.targetId);
      return;
    }
    set({ selection });
  },

  updateMaterial: (slotId, updates) => set(state => {
    const existingMaterial = state.product.materials[slotId];

    if (!existingMaterial) {
      console.warn('[EditorStore] Cannot update missing material slot:', slotId);
      return state;
    }

    return {
      product: {
        ...state.product,
        materials: {
          ...state.product.materials,
          [slotId]: {
            ...existingMaterial,
            ...updates,
            maps: {
              ...existingMaterial.maps,
              ...updates.maps,
            },
          },
        },
      },
    };
  }),

  addDecalInstance: (decal) => set(state => {
    const id = createDecalId();
    const zIndex = getNextDecalZIndex(state.product.decals);
    const newDecal: DecalInstance = {
      ...decal,
      id,
      zIndex,
      opacity: decal.opacity ?? 1.0
    };
    return {
      product: {
        ...state.product,
        decals: [...state.product.decals, newDecal]
      }
    };
  }),

  updateDecalInstance: (id, updates) => set(state => ({
    product: {
      ...state.product,
      decals: state.product.decals.map(d => d.id === id ? { ...d, ...updates } : d)
    }
  })),

  removeDecalInstance: (id) => set(state => {
    const nextSelection: Selection =
      state.selection.type === 'decal' && state.selection.targetId === id
        ? { type: 'none' }
        : state.selection;

    return {
      selection: nextSelection,
      product: {
        ...state.product,
        decals: state.product.decals.filter(d => d.id !== id)
      }
    };
  }),

  invalidateScene: () => set(state => ({
    configView: { ...state.configView, sceneVersion: state.configView.sceneVersion + 1 }
  })),

  setActiveLightingPresetId: (id) => set({ activeLightingPresetId: id })
}));
