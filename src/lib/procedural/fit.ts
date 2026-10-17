import * as THREE from 'three';

export interface TorsoFitInput {
  shoulderWidth: number;
  thickness: number;
  torsoLength: number;
}

export interface TorsoFit {
  backSurfaceZ: number;
  frontSurfaceZ: number;
  groupPosition: [number, number, number];
  leftSleeveRotationZ: number;
  rightSleeveRotationZ: number;
  shoulderX: number;
  shoulderY: number;
}

const ARM_FOLLOW_ANGLE = Math.PI * 0.43;
const NECK_OPENING_WORLD_Y = 1.78;

export function resolveTorsoFit(input: TorsoFitInput): TorsoFit {
  const halfShoulderWidth = input.shoulderWidth / 2;
  const shoulderInset = Math.min(0.035, halfShoulderWidth * 0.12);
  const surfaceOffset = input.thickness + 0.11;
  const torsoCenterY = NECK_OPENING_WORLD_Y - input.torsoLength / 2;

  return {
    backSurfaceZ: -surfaceOffset,
    frontSurfaceZ: surfaceOffset,
    groupPosition: [0, torsoCenterY, 0.02],
    leftSleeveRotationZ: -ARM_FOLLOW_ANGLE,
    rightSleeveRotationZ: ARM_FOLLOW_ANGLE,
    shoulderX: Math.max(0.05, halfShoulderWidth - shoulderInset),
    shoulderY: input.torsoLength * 0.36,
  };
}

export function addTorsoPanelWrap(
  geometry: THREE.BufferGeometry,
  side: 'front' | 'back',
  halfWidth: number,
  wrapDepth: number,
): void {
  const position = geometry.getAttribute('position');
  const direction = side === 'front' ? -1 : 1;

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const normalizedX = Math.min(Math.abs(x) / Math.max(halfWidth, 0.001), 1);
    const edgeFalloff = normalizedX * normalizedX;
    position.setZ(index, position.getZ(index) + direction * wrapDepth * edgeFalloff);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

export interface SideSeamGeometryInput {
  backZ: number;
  bottomX: number;
  bottomY: number;
  frontZ: number;
  side: 'left' | 'right';
  topX: number;
  topY: number;
  waistX?: number;
  waistT?: number;
  outwardBulge?: number;
  depthBulge?: number;
  segments?: number;
}

export function createSideSeamGeometry(input: SideSeamGeometryInput): THREE.BufferGeometry {
  const segments = Math.max(2, input.segments ?? 8);
  const sideSign = input.side === 'left' ? -1 : 1;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let row = 0; row <= segments; row += 1) {
    const t = row / segments;
    const y = THREE.MathUtils.lerp(input.topY, input.bottomY, t);
    const waistT = input.waistT ?? 0.58;
    const waistX = input.waistX ?? Math.min(input.topX, input.bottomX);
    const baseX = t < waistT
      ? THREE.MathUtils.lerp(input.topX, waistX, t / waistT)
      : THREE.MathUtils.lerp(waistX, input.bottomX, (t - waistT) / Math.max(1 - waistT, 0.001));
    const bulge = (input.outwardBulge ?? 0) * Math.sin(Math.PI * t);
    const depthCurve = (input.depthBulge ?? 0) * Math.sin(Math.PI * t);
    const x = sideSign * (baseX + bulge);

    positions.push(x, y, input.frontZ + depthCurve);
    positions.push(x, y, input.backZ - depthCurve);
    uvs.push(0, t);
    uvs.push(1, t);
  }

  for (let row = 0; row < segments; row += 1) {
    const frontTop = row * 2;
    const backTop = frontTop + 1;
    const frontBottom = frontTop + 2;
    const backBottom = frontTop + 3;

    if (input.side === 'left') {
      indices.push(frontTop, frontBottom, backTop);
      indices.push(backTop, frontBottom, backBottom);
    } else {
      indices.push(frontTop, backTop, frontBottom);
      indices.push(backTop, backBottom, frontBottom);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
