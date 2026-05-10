/**
 * Editor Store - Active editing session state
 * MVP: Brush, color picker, undo/redo
 */

import { create } from 'zustand';
import { ClothingLayer } from '@/lib/types';

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
  // Tool state
  selectedTool: ToolType;
  brushConfig: BrushConfig;
  
  // Canvas/Viewport state
  canvasSize: { width: number; height: number };
  zoom: number;
  pan: { x: number; y: number };
  
  // UI state
  showGrid: boolean;
  showPreview: boolean;
  isExporting: boolean;
  exportProgress: number;

  // 3D Bridge (Interaction)
  lastUV: { 
    uv: { x: number; y: number }; 
    isFirst: boolean; 
    isEnd: boolean; 
    timestamp: number;
    normal?: { x: number; y: number; z: number };
    viewDir?: { x: number; y: number; z: number };
  } | null;
  isPainting: boolean;
  shapeStartUV: { x: number; y: number } | null;
  shapePreviewUV: { x: number; y: number } | null;
  
  // Layer management (The Heart of the new Engine)
  layers: ClothingLayer[];
  activeLayerId: string | null;
  activeFabricId: string | null;
  
  activeDecalUrl: string | null;
  
  // Actions
  setTool: (tool: ToolType) => void;
  setBrushConfig: (config: Partial<BrushConfig>) => void;
  setIsPainting: (isPainting: boolean) => void;
  setDecal: (url: string | null) => void;
  setShapeStart: (uv: { x: number; y: number } | null) => void;
  setShapePreview: (uv: { x: number; y: number } | null) => void;
  
  // Layer Actions
  addLayer: (layer: Partial<ClothingLayer>) => void;
  removeLayer: (id: string) => void;
  updateLayer: (id: string, updates: Partial<ClothingLayer>) => void;
  setActiveLayer: (id: string | null) => void;
  setActiveFabric: (id: string | null) => void;
  
  // Bridge Actions
  drawFromUV: (
    uv: { x: number; y: number }, 
    isFirstPoint: boolean, 
    isEnd?: boolean, 
    normal?: { x: number; y: number; z: number },
    viewDir?: { x: number; y: number; z: number }
  ) => void;
  resetDrawingState: () => void;
  
  // History placeholder (Will be implemented via Layer Snaps)
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearCanvas: () => void;
}

const DEFAULT_BRUSH_CONFIG: BrushConfig = {
  size: 20,
  opacity: 100,
  color: '#EA931D',
  hardness: 80,
};

export const useEditorStore = create<EditorState>()((set, get) => ({
  // Initial state
  selectedTool: 'brush',
  brushConfig: DEFAULT_BRUSH_CONFIG,
  
  canvasSize: { width: 2048, height: 2048 },
  zoom: 1,
  pan: { x: 0, y: 0 },
  
  showGrid: true,
  showPreview: false,
  isExporting: false,
  exportProgress: 0,

  // Interaction
  lastUV: null,
  isPainting: false,
  shapeStartUV: null,
  shapePreviewUV: null,

  // Layers (Initialize with a base fabric layer)
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
  setTool: (tool) => {
    set({ selectedTool: tool });
    get().resetDrawingState();
  },
  
  setBrushConfig: (config) => set(state => ({
    brushConfig: { ...state.brushConfig, ...config }
  })),

  setIsPainting: (isPainting) => set({ isPainting }),
  
  setShapeStart: (uv) => set({ shapeStartUV: uv }),
  
  setShapePreview: (uv) => set({ shapePreviewUV: uv }),

  setDecal: (url) => set({ 
    activeDecalUrl: url, 
    selectedTool: url ? 'decal' : 'brush' 
  }),

  drawFromUV: (uv, isFirstPoint, isEnd = false, normal, viewDir) => {
    set({ 
      lastUV: { 
        uv, 
        isFirst: isFirstPoint, 
        isEnd,
        timestamp: Date.now(),
        normal,
        viewDir
      } 
    });
  },

  resetDrawingState: () => set({ 
    isPainting: false, 
    lastUV: null, 
    shapeStartUV: null, 
    shapePreviewUV: null 
  }),

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

  // History Stubs (GPU implementation will handle this via RenderTarget swapping)
  undo: () => console.log('Undo not yet implemented for GPU path'),
  redo: () => console.log('Redo not yet implemented for GPU path'),
  canUndo: () => false,
  canRedo: () => false,
  clearCanvas: () => {
    const activeId = get().activeLayerId;
    if (activeId) {
      get().updateLayer(activeId, { textureUrl: '' });
    }
  },
}));
