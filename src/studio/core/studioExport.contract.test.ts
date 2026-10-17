import { DEFAULT_TSHIRT_PARAMS } from '../../lib/procedural/tshirt';
import { createInitialStudioState, updateStudioGarmentMaterial } from './studioState';
import {
  createMoattStudioDesignDocument,
  createStudioStateFromMoattDesignDocument,
  isMoattStudioDesignDocument,
  normalizeStudioExportQuality,
  summarizeMaterial,
} from './studioExport';
import type { MoattStudioDesignDocument, StudioExportQuality } from './studioExport';
import type { StudioState } from './types';

const expectType = <T>(value: T): void => {
  void value;
};

const studio = createInitialStudioState({
  name: 'Texture Export Contract',
  garments: [
    {
      type: 'shirt',
      params: DEFAULT_TSHIRT_PARAMS,
      materials: {
        'shirt-fabric': {
          baseColor: '#2255aa',
          maps: { baseColorMap: 'data:image/png;base64,abc' },
          canvasState: { objects: [] },
        },
      },
    },
  ],
});

const textured = updateStudioGarmentMaterial(studio, studio.outfit.activeGarmentInstanceId!, 'shirt-fabric', {
  baseColor: '#ea931d',
  maps: { baseColorMap: 'data:image/png;base64,abc' },
  canvasState: { version: '5.3.0', objects: [] },
});

const document = createMoattStudioDesignDocument(textured, 'data:image/png;base64,preview');
expectType<MoattStudioDesignDocument>(document);
expectType<boolean>(isMoattStudioDesignDocument(document));

const restored = createStudioStateFromMoattDesignDocument(document);
expectType<StudioState>(restored);
expectType<string | null>(restored.outfit.activeGarmentInstanceId);

const invalidQuality = normalizeStudioExportQuality('print');
const validQuality = normalizeStudioExportQuality('high');
expectType<StudioExportQuality>(invalidQuality);
expectType<StudioExportQuality>(validQuality);

const materialSummary = summarizeMaterial(
  restored.outfit.garmentInstances[0].materials['shirt-fabric'],
);
expectType<string>(materialSummary);
