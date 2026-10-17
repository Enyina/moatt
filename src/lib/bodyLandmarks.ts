import type { BodyProfile } from './bodyProfile';
import type { MeasurementKey } from './types';

export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export type BodyLandmarkKey =
  | 'head'
  | 'neck'
  | 'chest'
  | 'waist'
  | 'hip'
  | 'leftShoulder'
  | 'rightShoulder'
  | 'leftElbow'
  | 'rightElbow'
  | 'leftWrist'
  | 'rightWrist'
  | 'leftThigh'
  | 'rightThigh'
  | 'leftKnee'
  | 'rightKnee'
  | 'leftAnkle'
  | 'rightAnkle'
  | 'leftFoot'
  | 'rightFoot'
  | 'spineBase'
  | 'spineMid'
  | 'spineTop'
  | 'frontDepth'
  | 'backDepth';

export type BodyLandmarks = Record<BodyLandmarkKey, Vector3Like>;

export type LandmarkOverrides = Partial<Record<BodyLandmarkKey, Vector3Like>>;

export interface BodyBounds {
  min: Vector3Like;
  max: Vector3Like;
}

const measurementScale = (
  measurements: BodyProfile['measurementValues'],
  key: MeasurementKey,
  baseline: number,
  sensitivity: number,
): number => {
  const value = measurements[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 1;

  return Math.min(Math.max(1 + ((value - baseline) / baseline) * sensitivity, 0.75), 1.45);
};

const fromBounds = (bounds: BodyBounds): BodyLandmarks => {
  const centerX = (bounds.min.x + bounds.max.x) / 2;
  const centerZ = (bounds.min.z + bounds.max.z) / 2;
  const height = Math.max(bounds.max.y - bounds.min.y, 0.001);
  const width = Math.max(bounds.max.x - bounds.min.x, 0.001);
  const depth = Math.max(bounds.max.z - bounds.min.z, 0.001);
  const yAt = (ratio: number) => bounds.min.y + height * ratio;
  const shoulderX = width * 0.22;
  const hipX = width * 0.12;
  const armX = width * 0.42;
  const legX = width * 0.1;
  const frontZ = centerZ + depth * 0.45;
  const backZ = centerZ - depth * 0.45;

  return {
    head: { x: centerX, y: yAt(0.94), z: centerZ },
    neck: { x: centerX, y: yAt(0.82), z: centerZ },
    chest: { x: centerX, y: yAt(0.72), z: centerZ },
    waist: { x: centerX, y: yAt(0.58), z: centerZ },
    hip: { x: centerX, y: yAt(0.48), z: centerZ },
    leftShoulder: { x: centerX - shoulderX, y: yAt(0.78), z: centerZ },
    rightShoulder: { x: centerX + shoulderX, y: yAt(0.78), z: centerZ },
    leftElbow: { x: centerX - armX, y: yAt(0.68), z: centerZ },
    rightElbow: { x: centerX + armX, y: yAt(0.68), z: centerZ },
    leftWrist: { x: centerX - armX * 1.5, y: yAt(0.66), z: centerZ },
    rightWrist: { x: centerX + armX * 1.5, y: yAt(0.66), z: centerZ },
    leftThigh: { x: centerX - hipX, y: yAt(0.4), z: centerZ },
    rightThigh: { x: centerX + hipX, y: yAt(0.4), z: centerZ },
    leftKnee: { x: centerX - legX, y: yAt(0.25), z: centerZ },
    rightKnee: { x: centerX + legX, y: yAt(0.25), z: centerZ },
    leftAnkle: { x: centerX - legX, y: yAt(0.08), z: centerZ },
    rightAnkle: { x: centerX + legX, y: yAt(0.08), z: centerZ },
    leftFoot: { x: centerX - legX, y: bounds.min.y, z: frontZ },
    rightFoot: { x: centerX + legX, y: bounds.min.y, z: frontZ },
    spineBase: { x: centerX, y: yAt(0.48), z: centerZ },
    spineMid: { x: centerX, y: yAt(0.64), z: centerZ },
    spineTop: { x: centerX, y: yAt(0.78), z: centerZ },
    frontDepth: { x: centerX, y: yAt(0.64), z: frontZ },
    backDepth: { x: centerX, y: yAt(0.64), z: backZ },
  };
};

const estimateFromMeasurements = (profile: BodyProfile, base: BodyLandmarks): BodyLandmarks => {
  const shoulderFactor = measurementScale(profile.measurementValues, 'shoulder', 18, 0.4);
  const chestFactor = measurementScale(profile.measurementValues, 'chest', 38, 0.25)
    * measurementScale(profile.measurementValues, 'bust', 38, 0.25);
  const waistFactor = measurementScale(profile.measurementValues, 'waist', 32, 0.22);
  const hipFactor = measurementScale(profile.measurementValues, 'hip', 40, 0.25);
  const armFactor = measurementScale(profile.measurementValues, 'sleeve', 24, 0.35);
  const center = base.neck.x;

  const scaleXFromCenter = (point: Vector3Like, factor: number): Vector3Like => ({
    ...point,
    x: center + (point.x - center) * factor,
  });

  return {
    ...base,
    leftShoulder: scaleXFromCenter(base.leftShoulder, shoulderFactor),
    rightShoulder: scaleXFromCenter(base.rightShoulder, shoulderFactor),
    leftElbow: scaleXFromCenter(base.leftElbow, armFactor),
    rightElbow: scaleXFromCenter(base.rightElbow, armFactor),
    leftWrist: scaleXFromCenter(base.leftWrist, armFactor),
    rightWrist: scaleXFromCenter(base.rightWrist, armFactor),
    chest: { ...base.chest, z: base.chest.z + (base.frontDepth.z - base.chest.z) * (chestFactor - 1) },
    waist: { ...base.waist, z: base.waist.z + (base.frontDepth.z - base.waist.z) * (waistFactor - 1) },
    hip: scaleXFromCenter(base.hip, hipFactor),
    leftThigh: scaleXFromCenter(base.leftThigh, hipFactor),
    rightThigh: scaleXFromCenter(base.rightThigh, hipFactor),
  };
};

export function resolveBodyLandmarks(
  bodyProfile: BodyProfile,
  bodyBounds?: BodyBounds,
  overrides?: LandmarkOverrides,
): BodyLandmarks {
  const fallbackBounds = bodyBounds ?? {
    min: { x: -0.5, y: 0, z: -0.22 },
    max: { x: 0.5, y: 1.9, z: 0.22 },
  };
  const base = bodyProfile.explicitLandmarks ?? fromBounds(fallbackBounds);
  const estimated = estimateFromMeasurements(bodyProfile, base);

  return {
    ...estimated,
    ...bodyProfile.landmarkOverrides,
    ...overrides,
  };
}
