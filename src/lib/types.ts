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
  quality: number;
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

export type AccessoryType = 'head' | 'torso' | 'legs' | 'feet' | 'hands' | 'neck' | 'waist' | 'custom';
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
  quality: 0.8
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
