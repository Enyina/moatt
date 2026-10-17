export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Accessory {
  id: string;
  name: string;
  type: string;
  modelUrl: string;
  thumbnail?: string;
  isVisible: boolean;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  bone?: string;
  textureUrl?: string;
  color?: string;
  opacity?: number;
}

export interface ClothingLayer {
  id: string;
  name: string;
  type: 'drawing' | 'fabric' | 'pattern' | 'paint' | 'decal';
  textureUrl: string; // URL or Data URL (for serialization)
  visible: boolean;
  opacity: number;
  blendMode?: 'normal' | 'multiply' | 'screen' | 'overlay' | 'add';
  resolution?: number; // e.g. 1024, 2048
}

export interface FabricProperty {
  roughness: number;
  metalness: number;
  bumpScale: number;
  normalMap?: string;
  roughnessMap?: string;
}

export interface Pose {
  id: string;
  name: string;
  category?: string;
  tags?: string[];
  thumbnail?: string;
  rotations?: { boneName: string; rotation: [number, number, number] }[];
}

export interface MannequinModel {
  id: string;
  name: string;
  modelUrl: string;
  category: 'women' | 'men' | 'children' | 'unisex';
  thumbnailUrl?: string;
  bodyType: string;
  gender: 'female' | 'male' | 'unisex';
  ageGroup: 'child' | 'adult';
  description?: string;
}

export interface AvatarState {
  id: string;
  version: number;
  modelUrl: string;
  bodyTypeId: string;
  poseId: string;
  activeFabricId?: string;
  clothingTexture: string;
  clothingLayers: ClothingLayer[];
  accessories: Accessory[];
  skinColor: string;
  createdAt: string;
  updatedAt: string;
}

export interface WardrobeItem {
  id: string;
  name: string;
  avatarState: AvatarState;
  thumbnail?: string;
  isFavorite: boolean;
  isPublic?: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UIState {
  activePanel: string;
  selectedAccessoryType: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ExportOptions {
  format: 'glb' | 'gltf' | 'obj';
  includeTextures: boolean;
  includeAccessories?: boolean;
  quality: 'low' | 'medium' | 'high';
}

export interface ExportResult {
  success: boolean;
  url?: string;
  error?: string;
  filename: string;
}

// API Responses
export interface WardrobeResponse {
  success: boolean;
  data?: WardrobeItem[];
  error?: string;
}

export interface SaveWardrobeResponse {
  success: boolean;
  data?: WardrobeItem;
  error?: string;
}

export interface DeleteWardrobeResponse {
  success: boolean;
  error?: string;
}

export type AccessoryType =
  | 'head'
  | 'torso'
  | 'legs'
  | 'feet'
  | 'hands'
  | 'neck'
  | 'waist'
  | 'hat'
  | 'glasses'
  | 'jewelry'
  | 'bag'
  | 'shoes'
  | 'scarf'
  | 'belt'
  | 'watch'
  | 'gloves'
  | 'custom';
export type PoseCategory = 'standing' | 'walking' | 'sitting' | 'running' | 'dancing' | 'custom';

export interface AvatarStoreState {
  currentAvatar: AvatarState;
  wardrobeItems: WardrobeItem[];
  isLoadingWardrobe: boolean;
  availablePoses: Pose[];
  availableMannequins: MannequinModel[];
  availableAccessories: Accessory[];
  ui: UIState;
  settings: {
    autoSave: boolean;
    exportQuality: ExportOptions;
    preferredBodyType: string;
  };
}

export interface AvatarStoreActions {
  setAvatar: (updates: Partial<AvatarState>) => void;
  resetAvatar: () => void;
  loadAvatar: (avatarId: string) => Promise<void>;
  setClothingTexture: (texture: string) => void;
  clearClothingTexture: () => void;
  setPose: (poseId: string) => void;
  applyPose: (pose: Pose) => void;
  addAccessory: (accessory: Partial<Accessory>) => void;
  updateAccessory: (id: string, updates: Partial<Accessory>) => void;
  removeAccessory: (id: string) => void;
  toggleAccessoryVisibility: (id: string) => void;
  loadWardrobe: () => Promise<void>;
  saveToWardrobe: (name: string, options?: { tags?: string[]; isPublic?: boolean }) => Promise<void>;
  updateWardrobeItem: (id: string, updates: Partial<WardrobeItem>) => Promise<void>;
  deleteWardrobeItem: (id: string) => Promise<void>;
  loadAvailablePoses: () => Promise<void>;
  loadAvailableMannequins: () => Promise<void>;
  loadAvailableAccessories: () => Promise<void>;
  setActivePanel: (panel: string) => void;
  setSelectedAccessoryType: (type: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  exportAvatar: (options: ExportOptions) => Promise<ExportResult>;
  updateSettings: (settings: Partial<AvatarStoreState['settings']>) => void;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  format: 'glb',
  includeTextures: true,
  quality: 'medium'
};

export const DEFAULT_AVATAR_STATE: Omit<AvatarState, 'id' | 'createdAt' | 'updatedAt'> = {
  version: 1,
  modelUrl: '/models/makehuman/female_standard.dae',
  bodyTypeId: 'female-standard',
  poseId: 'standing-default',
  clothingTexture: '',
  clothingLayers: [],
  accessories: [],
  skinColor: '#D2B48C'
};

export type MannequinCategory = MannequinModel['category'];

/**
 * NEW: 3D Configurator Architecture Types
 * Transitioning from Tool-based to State-driven configuration.
 */

export type MeshRegion = 'torso' | 'arms' | 'legs' | 'head' | 'feet' | 'accessory';
export type MeshPanel = 'front' | 'back' | 'side' | 'sleeve' | 'collar' | 'cuff' | 'waistband' | 'pocket' | 'hem';
export type MeshLayer = 'outer' | 'inner' | 'lining' | 'trim';
export type MeshSide = 'left' | 'right' | 'center' | 'both';

export interface MeshMeta {
  id: string;           // Stable reference to the mesh node name in the 3D model
  region: MeshRegion;
  panel: MeshPanel;
  layer: MeshLayer;
  side: MeshSide;
  label: string;        // Human readable name (e.g., "Left Sleeve Cuff")
}

export interface DecalAnchor {
  type: 'uv' | 'mesh' | 'projection';
  uv?: [number, number];
  meshId?: string;      // Stable reference to mesh meta ID
  position: [number, number, number]; // Offset from anchor point
  normal: [number, number, number];   // Orientation/Projection vector
}

export interface DecalInstance {
  id: string;
  image: string;        // URL/Blob of the graphic
  anchor: DecalAnchor;
  scale: number;
  rotation: number;     // Z-axis rotation relative to normal
  zIndex: number;       // Rendering order to prevent z-fighting
  opacity: number;
}

export type GarmentType = 'shirt' | 'gown' | 'trouser' | 'skirt' | 'jacket' | 'native_wear' | 'hoodie';

export type MeasurementKey =
  | 'chest'
  | 'bust'
  | 'waist'
  | 'hip'
  | 'shoulder'
  | 'sleeve'
  | 'length'
  | 'inseam'
  | 'thigh'
  | 'neck';

export interface DecalZone {
  id: string;
  label: string;
  meshId: string;
  maxWidth?: number;
  maxHeight?: number;
}

export interface GarmentStyleOptions {
  neckline?: string[];
  sleeveType?: string[];
  fit?: string[];
  length?: string[];
  flare?: string[];
  closure?: string[];
}

export interface MaterialBehavior {
  id: string;
  name: string;
  stiffness: number;    // Conceptual: 0 (silk) to 1 (denim)
  stretch: number;      // Conceptual: 0 (static) to 1 (lycra)
  anisotropy: number;   // Visual grain direction influence
}

export interface MaterialSlot {
  id: string;
  name: string;
  baseColor: string;
  roughness: number;
  metalness: number;
  opacity: number;
  emissive?: string;
  behaviorId?: string;  // Reference to MaterialBehavior
  fabricPresetId?: string;
  normalScale?: number;
  textureRepeat?: number;
  maps: {
    baseColorMap?: string;
    normalMap?: string;
    roughnessMap?: string;
    metalnessMap?: string;
    aoMap?: string;
    alphaMap?: string;
  };
  canvasState?: unknown;
}

export interface FabricPreset {
  id: string;
  name: string;
  roughness: number;
  metalness: number;
  normalScale: number;
  textureRepeat: number;
  baseColor?: string; // Optional default base color
  normalMapUrl?: string;
  roughnessMapUrl?: string;
  maps?: {
    normalMap?: string;
    roughnessMap?: string;
  };
}

export type ProductRenderAsset =
  | ProductPrimitiveRenderAsset
  | ProductModelRenderAsset;

export interface ProductPrimitiveRenderAsset {
  type: 'primitive'; // Keeping 'primitive' label but it's now hybrid
  normalizedHeight?: number;
  position?: [number, number, number];
  nodes: ProductPrimitiveNode[];
}

export interface ProductModelRenderAsset {
  type: 'model';
  url: string;
}

export type ProductPrimitiveKind = 'cylinder' | 'torus' | 'capsule' | 'garmentPanel' | 'tube' | 'sphere' | 'model' | 'procedural-tshirt' | 'procedural-hoodie';

export interface ProductPrimitiveNode {
  name: string;
  primitive: ProductPrimitiveKind;
  args: number[];
  url?: string; // Required for 'model' kind
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  materialSlotId?: string;
}

export interface ProductState {
  id: string;
  metadata: {
    name: string;
    category: string;
  };
  renderAsset?: ProductRenderAsset;
  // Meshes map semantic IDs to material slot assignments and visibility
  meshes: {
    [semanticId: string]: {
      materialSlotId: string;
      visible: boolean;
      meta: MeshMeta;
    };
  };
  materials: {
    [slotId: string]: MaterialSlot;
  };
  behaviors: {
    [behaviorId: string]: MaterialBehavior;
  };
  bindings: MeshBinding[]; // Map GLB names -> semantic IDs
  decals: DecalInstance[];
}

export interface GarmentDefinition {
  id: string;
  type: GarmentType;
  label: string;
  status: 'available' | 'coming_soon';
  requiredMeasurements: MeasurementKey[];
  styleOptions: GarmentStyleOptions;
  panels: MeshMeta[];
  materialSlots: MaterialSlot[];
  materialBehaviors: MaterialBehavior[];
  bindings: MeshBinding[];
  renderAsset: ProductRenderAsset;
  decalZones: DecalZone[];
}

export type GarmentSource =
  | { kind: 'procedural'; generator: string }
  | { kind: 'model'; url: string };

export interface GarmentInstance {
  id: string;
  definitionId: string;
  type: GarmentType;
  source: GarmentSource;
  name: string;
  params: Record<string, number>;
  styleOptions: Record<string, string>;
  materials: Record<string, Partial<MaterialSlot>>;
  decals: DecalInstance[];
  visible: boolean;
  layer: MeshLayer;
  transform?: {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
  };
}

export interface GarmentRenderContext {
  bodyProfile?: import('./bodyProfile').BodyProfile;
}

export interface MeshBinding {
  meshName: string;     // Node name in GLTF (e.g. "Mesh_001")
  semanticId: string;   // Logic ID (e.g. "torso_front")
}

export type Selection =
  | { type: 'mesh'; targetId: string }
  | { type: 'region'; region: MeshRegion }
  | { type: 'decal'; targetId: string }
  | { type: 'none' };

export interface ConfiguratorView {
  mode: 'orbit' | 'preview' | 'edit';
  sceneVersion: number;
}

export interface ProductDefinition {
  id: string;
  metadata: {
    name: string;
    category: string;
  };
  meshes: MeshMeta[];
  defaultMaterials: MaterialSlot[];
  defaultBehaviors: MaterialBehavior[];
  bindings: MeshBinding[];
}

export interface SavedDesignDocument {
  version: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  bodyTemplate: string;
  garmentType: GarmentType;
  selectedStyleOptions: Record<string, string>;
  measurementValues: Record<MeasurementKey, number | null>;
  materialSelections: Record<string, Partial<MaterialSlot>>;
  meshMaterialAssignments: Record<string, string>;
  decals: DecalInstance[];
  view: {
    mode: ConfiguratorView['mode'];
    previewThumbnail: string | null;
  };
}

export type SavedGarment = {
  id: string;
  type: GarmentType;
  generator: string;
  params: Record<string, number>;
  styleOptions: Record<string, string>;
  materials: Record<string, Partial<MaterialSlot>>;
  decals: DecalInstance[];
};

export interface SavedProject {
  schema: {
    version: 2;
    generatorVersion: string;
  };
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  garments: SavedGarment[];
  avatar: {
    bodyTemplate: string;
    measurementValues: Record<MeasurementKey, number | null>;
  };
  camera?: any;
  fabricCanvasState?: any;
  editorState: {
    viewMode: ConfiguratorView['mode'];
    previewThumbnail: string | null;
    activeLightingPresetId?: string;
  };
}

export interface DesignImportResult {
  ok: boolean;
  warnings: string[];
}
