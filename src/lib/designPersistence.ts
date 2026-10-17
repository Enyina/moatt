import { GARMENT_DEFINITIONS, buildProductStateFromGarment } from './constants/products';
import { getBodyTypeConfig } from './models';
import {
  DecalInstance,
  GarmentDefinition,
  GarmentType,
  MaterialSlot,
  MeasurementKey,
  ProductState,
  SavedDesignDocument,
  SavedProject,
  SavedGarment,
  ConfiguratorView,
  GarmentInstance as PlatformGarmentInstance,
} from './types';
import { GarmentInstance as ProceduralGarmentInstance } from './procedural/garmentTypes';
import { isV1Save, isV2Save, migrateV1ToV2 } from './projectMigrations';
import { createDefaultGarmentInstance, normalizeGarmentInstances } from './platform/garmentPlatform';

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

const DEFAULT_DESIGN_NAME = 'Moatt Design';
const MAX_PREVIEW_THUMBNAIL_LENGTH = 1_500_000;
const MAX_DECAL_DATA_IMAGE_LENGTH = 2_000_000;

interface ImportContext {
  currentBodyTemplate: string;
}

export interface NormalizedDesignState {
  bodyTemplate: string;
  garment: GarmentDefinition;
  measurementValues: Record<MeasurementKey, number | null>;
  previewThumbnail: string | null;
  product: ProductState;
  sceneMode: ConfiguratorView['mode'];
  selectedStyleOptions: Record<string, string>;
  warnings: string[];
  activeGarment: ProceduralGarmentInstance;
  garmentInstances: PlatformGarmentInstance[];
  fabricCanvasState?: any;
  activeLightingPresetId?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMeasurementKey(value: string): value is MeasurementKey {
  return MEASUREMENT_KEYS.includes(value as MeasurementKey);
}

function normalizeSceneMode(value: unknown): ConfiguratorView['mode'] {
  return value === 'orbit' || value === 'preview' || value === 'edit' ? value : 'edit';
}

function normalizePreviewThumbnail(value: unknown, warnings: string[]): string | null {
  if (value === undefined || value === null) return null;

  if (typeof value !== 'string' || !value.startsWith('data:image/')) {
    warnings.push('Preview thumbnail was invalid and was removed.');
    return null;
  }

  if (value.length > MAX_PREVIEW_THUMBNAIL_LENGTH) {
    warnings.push('Preview thumbnail was too large and was removed.');
    return null;
  }

  return value;
}

function createEmptyMeasurementValues(): Record<MeasurementKey, number | null> {
  return MEASUREMENT_KEYS.reduce<Record<MeasurementKey, number | null>>((measurements, measurement) => {
    measurements[measurement] = null;
    return measurements;
  }, {} as Record<MeasurementKey, number | null>);
}

function normalizeMeasurementValues(
  value: unknown,
  garment: GarmentDefinition,
  warnings: string[],
): Record<MeasurementKey, number | null> {
  const measurements = createEmptyMeasurementValues();

  if (!isRecord(value)) {
    warnings.push('Measurement values were missing or invalid and were reset.');
    return measurements;
  }

  garment.requiredMeasurements.forEach((measurement) => {
    const nextValue = value[measurement];

    if (nextValue === null || nextValue === undefined || nextValue === '') {
      measurements[measurement] = null;
      return;
    }

    if (typeof nextValue === 'number' && Number.isFinite(nextValue)) {
      measurements[measurement] = nextValue;
      return;
    }

    warnings.push(`Measurement "${measurement}" was invalid and was reset.`);
  });

  return measurements;
}

function normalizeStyleOptions(
  value: unknown,
  garment: GarmentDefinition,
  warnings: string[],
): Record<string, string> {
  const selectedStyleOptions: Record<string, string> = {};
  const source = isRecord(value) ? value : {};

  Object.entries(garment.styleOptions).forEach(([optionName, allowedValues]) => {
    const importedValue = source[optionName];
    const fallbackValue = allowedValues[0];

    if (typeof importedValue === 'string' && allowedValues.includes(importedValue)) {
      selectedStyleOptions[optionName] = importedValue;
      return;
    }

    if (fallbackValue) {
      selectedStyleOptions[optionName] = fallbackValue;
    }
  });

  return selectedStyleOptions;
}

function normalizeMaterialSelections(
  value: unknown,
  product: ProductState,
  warnings: string[],
): ProductState['materials'] {
  if (!isRecord(value)) return product.materials;

  const materials: ProductState['materials'] = { ...product.materials };

  Object.entries(value).forEach(([slotId, materialUpdates]) => {
    const existingMaterial = materials[slotId];

    if (!existingMaterial || !isRecord(materialUpdates)) {
      warnings.push(`Material slot "${slotId}" is not valid for this garment and was ignored.`);
      return;
    }

    const nextMaterial: MaterialSlot = { ...existingMaterial };

    if (typeof materialUpdates.fabricPresetId === 'string') nextMaterial.fabricPresetId = materialUpdates.fabricPresetId;
    if (typeof materialUpdates.baseColor === 'string') nextMaterial.baseColor = materialUpdates.baseColor;
    if (typeof materialUpdates.roughness === 'number' && Number.isFinite(materialUpdates.roughness)) {
      nextMaterial.roughness = materialUpdates.roughness;
    }
    if (typeof materialUpdates.metalness === 'number' && Number.isFinite(materialUpdates.metalness)) {
      nextMaterial.metalness = materialUpdates.metalness;
    }
    if (typeof materialUpdates.normalScale === 'number' && Number.isFinite(materialUpdates.normalScale)) {
      nextMaterial.normalScale = materialUpdates.normalScale;
    }
    if (typeof materialUpdates.textureRepeat === 'number' && Number.isFinite(materialUpdates.textureRepeat)) {
      nextMaterial.textureRepeat = materialUpdates.textureRepeat;
    }
    if (typeof materialUpdates.opacity === 'number' && Number.isFinite(materialUpdates.opacity)) {
      nextMaterial.opacity = materialUpdates.opacity;
    }
    if (isRecord(materialUpdates.maps)) {
      nextMaterial.maps = { ...nextMaterial.maps, ...materialUpdates.maps as any };
    }

    materials[slotId] = nextMaterial;
  });

  return materials;
}

function isPositionTuple(value: unknown): value is [number, number, number] {
  return Array.isArray(value) && value.length === 3 && value.every((item) => typeof item === 'number' && Number.isFinite(item));
}

function createImportedDecalId(index: number): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `imported_decal_${crypto.randomUUID()}`;
  }
  return `imported_decal_${Date.now()}_${index}`;
}

function normalizeImportedDecalImage(value: unknown, decalId: string, warnings: string[]): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (value.startsWith('/decals/') || value.startsWith('blob:')) return value;
  if (value.startsWith('data:image/')) {
    if (value.length <= MAX_DECAL_DATA_IMAGE_LENGTH) return value;
    warnings.push(`Decal "${decalId}" image was too large and was ignored.`);
    return null;
  }
  return null;
}

function normalizeDecals(
  value: unknown,
  product: ProductState,
  garment: GarmentDefinition,
  warnings: string[],
): DecalInstance[] {
  if (!Array.isArray(value)) return [];

  const usedIds = new Set<string>();
  const usedZIndexes = new Set<number>();
  const allowedDecalMeshIds = new Set(garment.decalZones.map((zone) => zone.meshId));

  return value.reduce<DecalInstance[]>((decals, candidate, index) => {
    if (!isRecord(candidate) || !isRecord(candidate.anchor)) return decals;

    const importedId = typeof candidate.id === 'string' && candidate.id.length > 0 ? candidate.id : `imported_decal_${index + 1}`;
    const id = usedIds.has(importedId) ? createImportedDecalId(index) : importedId;
    const meshId = candidate.anchor.meshId;

    if (typeof meshId !== 'string' || !product.meshes[meshId] || !allowedDecalMeshIds.has(meshId)) return decals;

    const image = normalizeImportedDecalImage(candidate.image, id, warnings);
    if (!image || !isPositionTuple(candidate.anchor.position)) return decals;

    usedIds.add(id);
    const importedZIndex = typeof candidate.zIndex === 'number' && Number.isFinite(candidate.zIndex) ? candidate.zIndex : decals.length + 1;
    const zIndex = usedZIndexes.has(importedZIndex) ? Math.max(0, ...Array.from(usedZIndexes)) + 1 : importedZIndex;

    usedZIndexes.add(zIndex);
    decals.push({
      id,
      image,
      anchor: {
        type: 'mesh',
        meshId,
        position: candidate.anchor.position,
        normal: isPositionTuple(candidate.anchor.normal) ? candidate.anchor.normal : [0, 0, 1],
      },
      scale: typeof candidate.scale === 'number' && Number.isFinite(candidate.scale) ? candidate.scale : 0.2,
      rotation: typeof candidate.rotation === 'number' && Number.isFinite(candidate.rotation) ? candidate.rotation : 0,
      zIndex,
      opacity: typeof candidate.opacity === 'number' && Number.isFinite(candidate.opacity) ? candidate.opacity : 1,
    });

    return decals;
  }, []).sort((a, b) => a.zIndex - b.zIndex);
}

export function createSavedProject(params: {
  bodyTemplate: string;
  measurementValues: Record<MeasurementKey, number | null>;
  name?: string;
  previewThumbnail: string | null;
  product: ProductState;
  sceneMode: ConfiguratorView['mode'];
  selectedStyleOptions: Record<string, string>;
  activeGarment: ProceduralGarmentInstance;
  garmentInstances?: PlatformGarmentInstance[];
  fabricCanvasState?: any;
  activeLightingPresetId?: string;
}): SavedProject {
  const now = new Date().toISOString();

  const fallbackType: GarmentType = params.activeGarment.type === 'tshirt' ? 'shirt' : params.activeGarment.type;
  const fallbackDefinition = GARMENT_DEFINITIONS[fallbackType];
  const fallbackInstance = createDefaultGarmentInstance(fallbackDefinition, {
    id: params.activeGarment.id,
    params: params.activeGarment.params as Record<string, number>,
    styleOptions: params.selectedStyleOptions,
    materials: params.product.materials,
  });
  const sourceGarments = params.garmentInstances?.length ? params.garmentInstances : [fallbackInstance];
  const savedGarments: SavedGarment[] = sourceGarments.map((garment) => ({
    id: garment.id,
    type: garment.type,
    generator: garment.source.kind === 'procedural' ? garment.source.generator : 'model',
    params: garment.params,
    styleOptions: garment.id === params.activeGarment.id ? params.selectedStyleOptions : garment.styleOptions,
    materials: garment.id === params.activeGarment.id ? params.product.materials : garment.materials,
    decals: garment.id === params.activeGarment.id ? params.product.decals : garment.decals,
  }));

  return {
    schema: {
      version: 2,
      generatorVersion: '0.3.0',
    },
    id: `project_${Date.now()}`,
    name: params.name?.trim() || DEFAULT_DESIGN_NAME,
    createdAt: now,
    updatedAt: now,
    garments: savedGarments,
    avatar: {
      bodyTemplate: params.bodyTemplate,
      measurementValues: params.measurementValues,
    },
    fabricCanvasState: params.fabricCanvasState,
    editorState: {
      viewMode: params.sceneMode,
      previewThumbnail: params.previewThumbnail,
      activeLightingPresetId: params.activeLightingPresetId,
    },
  };
}

export function normalizeImportedDesign(
  input: unknown,
  context: ImportContext,
): NormalizedDesignState {
  const warnings: string[] = [];

  let project: SavedProject;

  if (isV1Save(input)) {
    project = migrateV1ToV2(input);
    warnings.push('Imported legacy V1 design. Migrating to V2.');
  } else if (isV2Save(input)) {
    project = input;
  } else {
    throw new Error('Design file is not a valid Moatt project.');
  }

  const savedGarment = project.garments[0];
  if (!savedGarment) {
    throw new Error('Project contains no garments.');
  }

  const garmentType = savedGarment.type;
  const garment = GARMENT_DEFINITIONS[garmentType];

  if (!garment || garment.status !== 'available') {
    throw new Error(`Garment "${garmentType}" is not available in this editor.`);
  }

  let product = buildProductStateFromGarment(garment);
  const selectedStyleOptions = normalizeStyleOptions(savedGarment.styleOptions, garment, warnings);
  const measurementValues = normalizeMeasurementValues(project.avatar.measurementValues, garment, warnings);

  product = {
    ...product,
    materials: normalizeMaterialSelections(savedGarment.materials, product, warnings),
  };
  product = {
    ...product,
    decals: normalizeDecals(savedGarment.decals, product, garment, warnings),
  };

  const bodyTemplate = typeof project.avatar.bodyTemplate === 'string' && getBodyTypeConfig(project.avatar.bodyTemplate)
    ? project.avatar.bodyTemplate
    : context.currentBodyTemplate;

  const activeGarment: ProceduralGarmentInstance = {
    id: savedGarment.id,
    type: savedGarment.type === 'shirt' ? 'tshirt' : savedGarment.type as any,
    params: savedGarment.params as any,
  };
  const garmentInstances = normalizeGarmentInstances(project);

  return {
    bodyTemplate,
    garment,
    measurementValues,
    previewThumbnail: project.editorState?.previewThumbnail || null,
    product,
    sceneMode: project.editorState?.viewMode || 'edit',
    selectedStyleOptions,
    warnings,
    activeGarment,
    garmentInstances,
    fabricCanvasState: project.fabricCanvasState,
    activeLightingPresetId: project.editorState?.activeLightingPresetId,
  };
}
