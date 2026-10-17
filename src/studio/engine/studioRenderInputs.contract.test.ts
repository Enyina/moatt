import type { TShirtParams } from '../../lib/procedural/garmentTypes';
import type { BodyProfile } from '../../lib/bodyProfile';
import { createInitialStudioState } from '../core/studioState';
import {
  createStudioBodyProfile,
  resolveStudioGarmentRenderInput,
} from './studioRenderInputs';

const expectType = <T>(value: T): void => {
  void value;
};

const studio = createInitialStudioState({
  mannequin: {
    bodyTemplateId: 'female-plus',
    measurements: { chest: 42, waist: 34 },
  },
  garments: [
    {
      type: 'shirt',
      styleOptions: { fit: 'relaxed' },
      params: { looseness: 1.2 },
    },
  ],
});

const bodyProfile = createStudioBodyProfile(studio.mannequin);
expectType<BodyProfile>(bodyProfile);

const shirt = studio.outfit.garmentInstances[0];
const renderInput = resolveStudioGarmentRenderInput(studio, shirt);
expectType<TShirtParams>(renderInput.params);
expectType<string>(renderInput.materialSlotId);
expectType<string | undefined>(renderInput.baseColor);
