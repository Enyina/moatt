import type { BodyProfile } from '../bodyProfile';
import { DEFAULT_TSHIRT_PARAMS } from '../procedural/tshirt';
import type { TShirtParams } from '../procedural/garmentTypes';
import type { GarmentType, MaterialSlot, SavedProject } from '../types';
import {
  createDefaultGarmentInstance,
  getAvailableGarmentDefinitions,
  getGarmentDefinition,
  normalizeGarmentInstances,
  resolveGarmentRenderParams,
  validateGarmentDefinition,
} from './garmentPlatform';

const expectType = <T>(value: T): void => {
  void value;
};

const shirtDefinition = getGarmentDefinition('shirt');
const shirtValidation = validateGarmentDefinition(shirtDefinition);
expectType<true>(shirtValidation.ok);

const availableDefinitions = getAvailableGarmentDefinitions();
expectType<string>(availableDefinitions[0].id);
expectType<MaterialSlot[]>(shirtDefinition.materialSlots);

const shirtInstance = createDefaultGarmentInstance(shirtDefinition, {
  id: 'item-shirt-1',
  styleOptions: { fit: 'relaxed', sleeveType: 'sleeveless', neckline: 'crew' },
  params: DEFAULT_TSHIRT_PARAMS,
});

expectType<'shirt'>(shirtInstance.type);
expectType<string>(shirtInstance.definitionId);
expectType<Record<string, Partial<MaterialSlot>>>(shirtInstance.materials);

const resolvedParams = resolveGarmentRenderParams<TShirtParams>(shirtInstance, {
  bodyProfile: { bodyTemplateId: 'female-standard' } as BodyProfile,
});
expectType<TShirtParams>(resolvedParams);

const migratedInstances = normalizeGarmentInstances({
  garments: [
    {
      id: 'saved-shirt',
      type: 'shirt',
      generator: 'procedural-tshirt-v1',
      params: DEFAULT_TSHIRT_PARAMS,
      styleOptions: { fit: 'slim' },
      materials: {},
      decals: [],
    },
  ],
} as Pick<SavedProject, 'garments'>);

expectType<string>(migratedInstances[0].id);
expectType<GarmentType>(migratedInstances[0].type);
