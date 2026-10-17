import type {
  DecalInstance,
  GarmentInstance,
  MeasurementKey,
  MeshRegion,
  MaterialSlot,
  SavedDesignDocument,
} from '../../lib/types';

export type StudioToolId =
  | 'select'
  | 'shape'
  | 'panel'
  | 'fabric'
  | 'graphic'
  | 'outfit'
  | 'mannequin'
  | 'preview'
  | 'export';

export type StudioSelection =
  | { type: 'none' }
  | { type: 'mannequin' }
  | { type: 'garment'; garmentInstanceId: string }
  | { type: 'panel'; garmentInstanceId: string; panelId: string }
  | { type: 'decal'; garmentInstanceId: string; decalId: string }
  | { type: 'region'; region: MeshRegion };

export interface StudioMannequinState {
  bodyTemplateId: string;
  measurements: Partial<Record<MeasurementKey, number | null>>;
  skinColor: string;
  poseId: string;
}

export interface StudioOutfitState {
  id: string;
  name: string;
  garmentInstances: GarmentInstance[];
  activeGarmentInstanceId: string | null;
}

export interface StudioCameraState {
  view: 'front' | 'side' | 'back' | 'three-quarter';
  mode: 'edit' | 'preview';
}

export interface StudioHistoryEntry {
  label: string;
  snapshot: Omit<StudioState, 'historyPast' | 'historyFuture'>;
}

export interface StudioState {
  id: string;
  name: string;
  mannequin: StudioMannequinState;
  outfit: StudioOutfitState;
  selection: StudioSelection;
  activeToolId: StudioToolId;
  draftOperation: null | {
    toolId: StudioToolId;
    startedAt: number;
  };
  camera: StudioCameraState;
  historyPast: StudioHistoryEntry[];
  historyFuture: StudioHistoryEntry[];
  updatedAt: string;
}

export interface StudioGarmentInput {
  type: GarmentInstance['type'];
  id?: string;
  name?: string;
  params?: Record<string, number>;
  styleOptions?: Record<string, string>;
  materials?: Record<string, Partial<MaterialSlot>>;
  decals?: DecalInstance[];
  visible?: boolean;
  layer?: GarmentInstance['layer'];
}

export interface StudioInitInput {
  id?: string;
  name?: string;
  mannequin?: Partial<StudioMannequinState>;
  garments?: StudioGarmentInput[];
}

export interface SavedStudioGarment {
  id: string;
  name: string;
  type: GarmentInstance['type'];
  params: Record<string, number>;
  styleOptions: Record<string, string>;
  materials: Record<string, Partial<MaterialSlot>>;
  decals: DecalInstance[];
  layer: GarmentInstance['layer'];
}

export interface SavedStudioLook {
  schemaVersion: 1;
  id: string;
  name: string;
  mannequin: StudioMannequinState;
  garments: SavedStudioGarment[];
  activeGarmentInstanceId: string | null;
  camera: StudioCameraState;
  savedAt: string;
}

export interface LegacyStudioImport {
  legacy: SavedDesignDocument;
}
