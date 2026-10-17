import { createBodyProfile, type BodyProfile } from '../../lib/bodyProfile';
import type { GarmentInstance, MaterialSlot, MeasurementKey } from '../../lib/types';
import type { TShirtParams } from '../../lib/procedural/garmentTypes';
import { resolveGarmentRenderParams } from '../../lib/platform/garmentPlatform';
import type { StudioMannequinState, StudioState } from '../core/types';

export interface StudioGarmentRenderInput<TParams extends Record<string, number> = Record<string, number>> {
  baseColor?: string;
  garment: GarmentInstance;
  materialSlotId: string;
  params: TParams;
}

function normalizeMeasurements(
  measurements: StudioMannequinState['measurements'],
): Partial<Record<MeasurementKey, number | null>> {
  return Object.fromEntries(
    Object.entries(measurements).filter((entry): entry is [MeasurementKey, number | null] => (
      typeof entry[0] === 'string'
        && (typeof entry[1] === 'number' || entry[1] === null)
    )),
  );
}

function firstMaterial(garment: GarmentInstance): [string, Partial<MaterialSlot>] {
  const first = Object.entries(garment.materials)[0];
  return first ?? ['default-fabric', { baseColor: '#EA931D' }];
}

export function createStudioBodyProfile(mannequin: StudioMannequinState): BodyProfile {
  return createBodyProfile(
    mannequin.bodyTemplateId,
    normalizeMeasurements(mannequin.measurements),
  );
}

export function resolveStudioGarmentRenderInput<TParams extends Record<string, number> = TShirtParams>(
  studio: StudioState,
  garment: GarmentInstance,
): StudioGarmentRenderInput<TParams> {
  const bodyProfile = createStudioBodyProfile(studio.mannequin);
  const [materialSlotId, material] = firstMaterial(garment);

  return {
    garment,
    materialSlotId,
    baseColor: material.baseColor,
    params: resolveGarmentRenderParams<TParams>(garment, { bodyProfile }),
  };
}
