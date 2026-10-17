import type { BodyLandmarks, Vector3Like } from './bodyLandmarks';

export type AttachmentZone =
  | 'headwear'
  | 'neckwear'
  | 'upperBody'
  | 'lowerBody'
  | 'frontTorso'
  | 'back'
  | 'waist'
  | 'leftArm'
  | 'rightArm'
  | 'leftLeg'
  | 'rightLeg'
  | 'feet';

export interface TorsoEnvelope {
  backZ: number;
  centerX: number;
  frontZ: number;
  leftX: number;
  rightX: number;
}

export interface GarmentAnchorMap {
  attachmentZones: AttachmentZone[];
  hemline: Vector3Like;
  hoodAnchor?: Vector3Like;
  neckline: Vector3Like;
  pocketAnchor?: Vector3Like;
  shoulderLine: {
    left: Vector3Like;
    right: Vector3Like;
  };
  sleeveAttachLeft: {
    direction: Vector3Like;
    origin: Vector3Like;
    wrist: Vector3Like;
  };
  sleeveAttachRight: {
    direction: Vector3Like;
    origin: Vector3Like;
    wrist: Vector3Like;
  };
  torsoEnvelope: TorsoEnvelope;
}

export const subtract = (a: Vector3Like, b: Vector3Like): Vector3Like => ({
  x: a.x - b.x,
  y: a.y - b.y,
  z: a.z - b.z,
});

export const normalize = (value: Vector3Like): Vector3Like => {
  const length = Math.hypot(value.x, value.y, value.z);
  if (length <= 0.0001) return { x: 1, y: 0, z: 0 };

  return {
    x: value.x / length,
    y: value.y / length,
    z: value.z / length,
  };
};

const midpoint = (a: Vector3Like, b: Vector3Like): Vector3Like => ({
  x: (a.x + b.x) / 2,
  y: (a.y + b.y) / 2,
  z: (a.z + b.z) / 2,
});

export function createUpperBodyAnchorMap(
  landmarks: BodyLandmarks,
  options: {
    hemDrop?: number;
    looseness?: number;
  } = {},
): GarmentAnchorMap {
  const looseness = options.looseness ?? 1;
  const shoulderCenter = midpoint(landmarks.leftShoulder, landmarks.rightShoulder);
  const chestHalfWidth = Math.abs(landmarks.rightShoulder.x - landmarks.leftShoulder.x) * 0.48 * looseness;
  const waistHalfWidth = chestHalfWidth * 0.82 * looseness;
  const hemY = options.hemDrop !== undefined
    ? landmarks.neck.y - options.hemDrop
    : landmarks.hip.y;
  const hemline = {
    x: landmarks.hip.x,
    y: Math.max(Math.min(hemY, landmarks.waist.y), landmarks.hip.y - 0.08),
    z: landmarks.hip.z,
  };
  const torsoHalfWidth = Math.max(chestHalfWidth, waistHalfWidth);

  return {
    attachmentZones: ['upperBody', 'frontTorso', 'back', 'leftArm', 'rightArm'],
    hemline,
    neckline: landmarks.neck,
    shoulderLine: {
      left: landmarks.leftShoulder,
      right: landmarks.rightShoulder,
    },
    sleeveAttachLeft: {
      direction: normalize(subtract(landmarks.leftWrist, landmarks.leftShoulder)),
      origin: landmarks.leftShoulder,
      wrist: landmarks.leftWrist,
    },
    sleeveAttachRight: {
      direction: normalize(subtract(landmarks.rightWrist, landmarks.rightShoulder)),
      origin: landmarks.rightShoulder,
      wrist: landmarks.rightWrist,
    },
    torsoEnvelope: {
      backZ: landmarks.backDepth.z,
      centerX: shoulderCenter.x,
      frontZ: landmarks.frontDepth.z,
      leftX: shoulderCenter.x - torsoHalfWidth,
      rightX: shoulderCenter.x + torsoHalfWidth,
    },
  };
}

export function createTShirtAnchorMap(
  landmarks: BodyLandmarks,
  options: {
    hemDrop?: number;
    looseness?: number;
  } = {},
): GarmentAnchorMap {
  return createUpperBodyAnchorMap(landmarks, options);
}

export function createHoodieAnchorMap(
  landmarks: BodyLandmarks,
  options: {
    hemDrop?: number;
    looseness?: number;
  } = {},
): GarmentAnchorMap {
  const upperBody = createUpperBodyAnchorMap(landmarks, options);

  return {
    ...upperBody,
    attachmentZones: [...upperBody.attachmentZones, 'headwear', 'neckwear'],
    hoodAnchor: {
      x: (landmarks.head.x + landmarks.neck.x) / 2,
      y: (landmarks.head.y + landmarks.neck.y) / 2,
      z: landmarks.backDepth.z,
    },
    pocketAnchor: {
      x: landmarks.waist.x,
      y: (landmarks.waist.y + upperBody.hemline.y) / 2,
      z: landmarks.frontDepth.z,
    },
  };
}
