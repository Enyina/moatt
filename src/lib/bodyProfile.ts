import type { MeasurementKey } from './types';
import type { BodyLandmarks, LandmarkOverrides } from './bodyLandmarks';

export type MeasurementValues = Record<MeasurementKey, number | null>;

export interface BodyProfile {
  bodyTemplateId: string;
  explicitLandmarks?: BodyLandmarks;
  landmarkOverrides?: LandmarkOverrides;
  measurementValues: MeasurementValues;
  scale: number;
}

const emptyMeasurements = (): MeasurementValues => ({
  bust: null,
  chest: null,
  hip: null,
  inseam: null,
  length: null,
  neck: null,
  shoulder: null,
  sleeve: null,
  thigh: null,
  waist: null,
});

const landmark = (x: number, y: number, z: number) => ({ x, y, z });

const createAdultLandmarks = (widthScale = 1, heightScale = 1): BodyLandmarks => ({
  head: landmark(0, 1.04 * heightScale, 0.01),
  neck: landmark(0, 0.82 * heightScale, 0.02),
  chest: landmark(0, 0.62 * heightScale, 0.03),
  waist: landmark(0, 0.36 * heightScale, 0.02),
  hip: landmark(0, 0.16 * heightScale, 0),
  leftShoulder: landmark(-0.36 * widthScale, 0.76 * heightScale, 0),
  rightShoulder: landmark(0.36 * widthScale, 0.76 * heightScale, 0),
  leftElbow: landmark(-0.64 * widthScale, 0.67 * heightScale, 0),
  rightElbow: landmark(0.64 * widthScale, 0.67 * heightScale, 0),
  leftWrist: landmark(-0.9 * widthScale, 0.63 * heightScale, 0),
  rightWrist: landmark(0.9 * widthScale, 0.63 * heightScale, 0),
  leftThigh: landmark(-0.13 * widthScale, -0.02 * heightScale, 0),
  rightThigh: landmark(0.13 * widthScale, -0.02 * heightScale, 0),
  leftKnee: landmark(-0.11 * widthScale, -0.31 * heightScale, 0.01),
  rightKnee: landmark(0.11 * widthScale, -0.31 * heightScale, 0.01),
  leftAnkle: landmark(-0.1 * widthScale, -0.62 * heightScale, 0.02),
  rightAnkle: landmark(0.1 * widthScale, -0.62 * heightScale, 0.02),
  leftFoot: landmark(-0.1 * widthScale, -0.71 * heightScale, 0.12),
  rightFoot: landmark(0.1 * widthScale, -0.71 * heightScale, 0.12),
  spineBase: landmark(0, 0.16 * heightScale, -0.02),
  spineMid: landmark(0, 0.5 * heightScale, -0.02),
  spineTop: landmark(0, 0.76 * heightScale, -0.01),
  frontDepth: landmark(0, 0.5 * heightScale, 0.1 * widthScale),
  backDepth: landmark(0, 0.5 * heightScale, -0.09 * widthScale),
});

export const DEFAULT_BODY_PROFILES: Record<string, BodyProfile> = {
  'female-standard': {
    bodyTemplateId: 'female-standard',
    explicitLandmarks: createAdultLandmarks(0.92, 0.98),
    measurementValues: emptyMeasurements(),
    scale: 1,
  },
  'female-athletic': {
    bodyTemplateId: 'female-athletic',
    explicitLandmarks: createAdultLandmarks(0.95, 0.99),
    measurementValues: emptyMeasurements(),
    scale: 1,
  },
  'female-plus': {
    bodyTemplateId: 'female-plus',
    explicitLandmarks: createAdultLandmarks(1.08, 0.98),
    measurementValues: emptyMeasurements(),
    scale: 1,
  },
  'male-standard': {
    bodyTemplateId: 'male-standard',
    explicitLandmarks: createAdultLandmarks(1, 1),
    measurementValues: emptyMeasurements(),
    scale: 1,
  },
  'male-athletic': {
    bodyTemplateId: 'male-athletic',
    explicitLandmarks: createAdultLandmarks(1.08, 1),
    measurementValues: emptyMeasurements(),
    scale: 1,
  },
  'male-plus': {
    bodyTemplateId: 'male-plus',
    explicitLandmarks: createAdultLandmarks(1.14, 0.99),
    measurementValues: emptyMeasurements(),
    scale: 1,
  },
  'child-toddler': {
    bodyTemplateId: 'child-toddler',
    explicitLandmarks: createAdultLandmarks(0.58, 0.68),
    measurementValues: emptyMeasurements(),
    scale: 0.72,
  },
  'child-youth': {
    bodyTemplateId: 'child-youth',
    explicitLandmarks: createAdultLandmarks(0.76, 0.84),
    measurementValues: emptyMeasurements(),
    scale: 0.85,
  },
  'child-teen': {
    bodyTemplateId: 'child-teen',
    explicitLandmarks: createAdultLandmarks(0.88, 0.94),
    measurementValues: emptyMeasurements(),
    scale: 0.95,
  },
};

export function createBodyProfile(
  bodyTemplateId: string,
  measurementValues?: Partial<MeasurementValues>,
  landmarkOverrides?: LandmarkOverrides,
): BodyProfile {
  const fallback = DEFAULT_BODY_PROFILES[bodyTemplateId] ?? DEFAULT_BODY_PROFILES['female-standard'];

  return {
    ...fallback,
    bodyTemplateId,
    explicitLandmarks: fallback.explicitLandmarks,
    landmarkOverrides,
    measurementValues: {
      ...emptyMeasurements(),
      ...fallback.measurementValues,
      ...measurementValues,
    },
  };
}
