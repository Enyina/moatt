import type { DecalInstance, GarmentInstance, GarmentType, MaterialSlot } from '../../lib/types';
import { DEFAULT_TSHIRT_PARAMS } from '../../lib/procedural/tshirt';
import {
  addGarmentToStudio,
  addStudioDecal,
  applySavedStudioGarment,
  applySavedStudioLook,
  createSavedStudioGarment,
  createSavedStudioLook,
  createInitialStudioState,
  createStudioInputFromLegacyDesign,
  duplicateStudioGarment,
  removeStudioGarment,
  selectStudioTarget,
  setStudioMannequin,
  setStudioTool,
  toggleStudioGarmentVisibility,
  updateStudioDecal,
  updateStudioGarmentMaterial,
  updateStudioGarmentParams,
  updateStudioGarmentStyleOption,
} from './studioState';
import type { SavedStudioGarment, SavedStudioLook, StudioInitInput, StudioSelection, StudioState, StudioToolId } from './types';

const expectType = <T>(value: T): void => {
  void value;
};

const studio = createInitialStudioState({
  mannequin: {
    bodyTemplateId: 'female-standard',
    measurements: { chest: 36, waist: 28, hip: 38 },
    skinColor: '#9f6b4c',
    poseId: 'standing-default',
  },
  garments: [
    {
      type: 'shirt',
      params: DEFAULT_TSHIRT_PARAMS,
      styleOptions: { fit: 'regular' },
    },
  ],
});

expectType<StudioState>(studio);
expectType<GarmentInstance[]>(studio.outfit.garmentInstances);
expectType<StudioToolId>(studio.activeToolId);

const withTrouser = addGarmentToStudio(studio, {
  type: 'trouser',
  name: 'Client Trouser',
});
expectType<GarmentType>(withTrouser.outfit.garmentInstances[0].type);

const selected = selectStudioTarget(withTrouser, {
  type: 'garment',
  garmentInstanceId: withTrouser.outfit.activeGarmentInstanceId!,
});
expectType<StudioSelection>(selected.selection);

const shaped = updateStudioGarmentParams(selected, selected.outfit.activeGarmentInstanceId!, {
  torsoLength: 0.5,
  looseness: 1.12,
});
expectType<Record<string, number>>(shaped.outfit.garmentInstances[0].params);

const materialUpdate: Partial<MaterialSlot> = {
  baseColor: '#2255aa',
  roughness: 0.6,
  maps: {},
};
const withMaterial = updateStudioGarmentMaterial(
  shaped,
  shaped.outfit.activeGarmentInstanceId!,
  'shirt-fabric',
  materialUpdate,
);
expectType<Record<string, Partial<MaterialSlot>>>(withMaterial.outfit.garmentInstances[0].materials);

const withDecal = addStudioDecal(withMaterial, withMaterial.outfit.activeGarmentInstanceId!, {
  image: '/decals/logo.png',
  anchor: {
    type: 'mesh',
    meshId: 'shirt_front',
    position: [0, 0, 0],
    normal: [0, 0, 1],
  },
  scale: 0.2,
  rotation: 0,
  opacity: 1,
});
expectType<DecalInstance[]>(withDecal.outfit.garmentInstances[0].decals);

const decalId = withDecal.outfit.garmentInstances.find((garment) => garment.id === withDecal.outfit.activeGarmentInstanceId!)!.decals[0].id;
const movedDecal = updateStudioDecal(withDecal, withDecal.outfit.activeGarmentInstanceId!, decalId, {
  scale: 0.28,
  anchor: { position: [0.1, 0.02, 0.01] },
});
expectType<DecalInstance[]>(movedDecal.outfit.garmentInstances[0].decals);

const restyled = updateStudioGarmentStyleOption(
  movedDecal,
  movedDecal.outfit.activeGarmentInstanceId!,
  'fit',
  'slim',
);
expectType<Record<string, string>>(restyled.outfit.garmentInstances[0].styleOptions);

const savedGarment = createSavedStudioGarment(restyled, restyled.outfit.activeGarmentInstanceId!, 'Reusable Shirt');
expectType<SavedStudioGarment | null>(savedGarment);

const withReusableGarment = applySavedStudioGarment(restyled, savedGarment!);
expectType<GarmentInstance[]>(withReusableGarment.outfit.garmentInstances);

const savedLook = createSavedStudioLook(withReusableGarment, 'Client Look');
expectType<SavedStudioLook>(savedLook);

const newMannequin = setStudioMannequin(withReusableGarment, {
  bodyTemplateId: 'male-athletic',
  measurements: { chest: 44 },
});
const reappliedLook = applySavedStudioLook(newMannequin, savedLook, { keepCurrentMannequin: true });
expectType<StudioState>(reappliedLook);

const legacyInput = createStudioInputFromLegacyDesign({
  legacy: {
    version: 1,
    id: 'legacy-shirt',
    name: 'Legacy Shirt',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    bodyTemplate: 'female-standard',
    garmentType: 'shirt',
    selectedStyleOptions: { fit: 'regular' },
    measurementValues: {
      bust: null,
      chest: 36,
      hip: null,
      inseam: null,
      length: null,
      neck: null,
      shoulder: null,
      sleeve: null,
      thigh: null,
      waist: 28,
    },
    materialSelections: { 'shirt-fabric': materialUpdate },
    meshMaterialAssignments: {},
    decals: [],
    view: {
      mode: 'edit',
      previewThumbnail: null,
    },
  },
});
expectType<StudioInitInput>(legacyInput);

const hidden = toggleStudioGarmentVisibility(reappliedLook, reappliedLook.outfit.activeGarmentInstanceId!);
const duplicated = duplicateStudioGarment(hidden, hidden.outfit.activeGarmentInstanceId!);
const removed = removeStudioGarment(duplicated, duplicated.outfit.activeGarmentInstanceId!);
const mannequinChanged = setStudioMannequin(removed, {
  measurements: { chest: 40 },
  poseId: 'runway-front',
});
const toolChanged = setStudioTool(mannequinChanged, 'fabric');

expectType<StudioState>(toolChanged);
