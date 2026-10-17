import { SavedDesignDocument, SavedProject, SavedGarment } from './types';
import { DEFAULT_HOODIE_PARAMS } from './procedural/hoodie';
import { DEFAULT_TSHIRT_PARAMS } from './procedural/tshirt';
import type { MeasurementKey } from './types';

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

function normalizeLegacyMeasurements(
  measurements: Partial<Record<MeasurementKey, number | null>> | undefined,
): Record<MeasurementKey, number | null> {
  return MEASUREMENT_KEYS.reduce<Record<MeasurementKey, number | null>>((nextMeasurements, key) => {
    nextMeasurements[key] = measurements?.[key] ?? null;
    return nextMeasurements;
  }, {} as Record<MeasurementKey, number | null>);
}

export function isV1Save(data: any): data is SavedDesignDocument {
  return data && data.version === 1;
}

export function isV2Save(data: any): data is SavedProject {
  return data && data.schema && data.schema.version === 2;
}

/**
 * Migrates a V1 SavedDesignDocument to a V2 SavedProject
 * Generates procedural parameters based on the V1 garmentType
 */
export function migrateV1ToV2(v1: SavedDesignDocument): SavedProject {
  let generator = '';
  let params: any = {};
  
  if (v1.garmentType === 'hoodie') {
    generator = 'procedural-hoodie-v1';
    params = { ...DEFAULT_HOODIE_PARAMS };
  } else {
    // Default fallback to tshirt if unknown
    generator = 'procedural-tshirt-v1';
    params = { ...DEFAULT_TSHIRT_PARAMS };
  }

  const savedGarment: SavedGarment = {
    id: `garment_${v1.id}`,
    type: (v1.garmentType === 'hoodie' ? 'hoodie' : 'shirt') as any,
    generator,
    params,
    styleOptions: v1.selectedStyleOptions || {},
    materials: v1.materialSelections || {},
    decals: v1.decals || []
  };

  return {
    schema: {
      version: 2,
      generatorVersion: '0.3.0'
    },
    id: v1.id,
    name: v1.name,
    createdAt: v1.createdAt,
    updatedAt: v1.updatedAt || v1.createdAt,
    garments: [savedGarment],
    avatar: {
      bodyTemplate: v1.bodyTemplate,
      measurementValues: normalizeLegacyMeasurements(v1.measurementValues)
    },
    editorState: {
      viewMode: v1.view?.mode || 'edit',
      previewThumbnail: v1.view?.previewThumbnail || null
    }
  };
}
