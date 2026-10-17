import * as THREE from 'three';
import { CrossSection, createCrossSectionRing } from './crossSection';

export interface ArmholeConfig {
  ring: THREE.Vector3[];
}

export interface TorsoShellInput {
  centerX: number;
  centerZ: number;
  chestY: number;
  depth: number;
  hemY: number;
  hipWidth: number;
  looseness: number;
  neckDropBack?: number;
  neckDropFront?: number;
  neckWidth: number;
  neckY: number;
  segments?: number;
  shoulderDrop?: number;
  shoulderWidth: number;
  waistWidth: number;
  waistY: number;
  leftArmhole?: ArmholeConfig;
  rightArmhole?: ArmholeConfig;
}

const smoothstep = (value: number): number => value * value * (3 - 2 * value);
const ARMHOLE_VERTICAL_SPAN = 4;

export function createTorsoShellGeometry(input: TorsoShellInput): THREE.BufferGeometry {
  const C = input.segments ?? 48;
  const R = 32;
  const chestRow = 10;
  const waistRow = 22;

  const w = Math.max(2, Math.round(C * 0.1)); 
  const rTop = 1;
  const rBottom = rTop + ARMHOLE_VERTICAL_SPAN;

  const rings: THREE.Vector3[][] = [];
  for (let r = 0; r <= R; r++) {
    let y: number, width: number, depth: number;
    let profile: 'ellipse' | 'roundedRectangle' = 'roundedRectangle';

    if (r <= chestRow) {
      const t = smoothstep(r / chestRow);
      y = THREE.MathUtils.lerp(input.neckY, input.chestY, t);
      width = THREE.MathUtils.lerp(input.neckWidth, input.shoulderWidth, t);
      depth = THREE.MathUtils.lerp(input.depth * 0.96, input.depth * (1.08 + (input.looseness - 1) * 0.32), t);
      profile = t < 0.34 ? 'ellipse' : 'roundedRectangle';
    } else if (r <= waistRow) {
      const t = smoothstep((r - chestRow) / (waistRow - chestRow));
      y = THREE.MathUtils.lerp(input.chestY, input.waistY, t);
      width = THREE.MathUtils.lerp(input.shoulderWidth, input.waistWidth, t);
      depth = THREE.MathUtils.lerp(input.depth * (1.08 + (input.looseness - 1) * 0.32), input.depth * (0.94 + (input.looseness - 1) * 0.28), t);
    } else {
      const t = smoothstep((r - waistRow) / (R - waistRow));
      y = THREE.MathUtils.lerp(input.waistY, input.hemY, t);
      width = THREE.MathUtils.lerp(input.waistWidth, input.hipWidth, t);
      depth = THREE.MathUtils.lerp(input.depth * (0.9 + (input.looseness - 1) * 0.28), input.depth * (0.96 + (input.looseness - 1) * 0.32), t);
    }

    const section: CrossSection = {
      center: new THREE.Vector3(input.centerX, y, input.centerZ),
      depth,
      profile,
      segments: C,
      width,
    };
    rings.push(createCrossSectionRing(section));
  }

  // --- POST-PROCESS SHAPING ---
  const neckDropFront = input.neckDropFront ?? 0;
  const neckDropBack = input.neckDropBack ?? 0;
  const shoulderDrop = input.shoulderDrop ?? 0;

  for (let r = 0; r <= chestRow; r++) {
    const fade = 1 - (r / chestRow);
    const easeFade = fade * fade;

    for (let c = 0; c < C; c++) {
      const angle = (c / C) * Math.PI * 2;
      
      const frontFactor = Math.max(0, Math.sin(angle));
      const backFactor = Math.max(0, -Math.sin(angle));
      // Give the neck opening a more rounded shape by exponentiating the factors slightly
      const frontCurve = Math.pow(frontFactor, 1.5);
      const backCurve = Math.pow(backFactor, 1.5);
      
      const sideFactor = Math.abs(Math.cos(angle));

      const drop = (frontCurve * neckDropFront + backCurve * neckDropBack + sideFactor * shoulderDrop) * easeFade;

      rings[r][c].y -= drop;
    }
  }

  function getArmholeBoundaryIndices(cCenter: number, dirFront: 1 | -1) {
    const list: {c: number, r: number}[] = [];
    for (let i = 0; i <= w; i++) list.push({ c: (cCenter + i * dirFront + C) % C, r: rTop });
    const cFront = (cCenter + w * dirFront + C) % C;
    for (let r = rTop + 1; r <= rBottom; r++) list.push({ c: cFront, r });
    for (let i = w - 1; i >= -w; i--) list.push({ c: (cCenter + i * dirFront + C) % C, r: rBottom });
    const cBack = (cCenter - w * dirFront + C) % C;
    for (let r = rBottom - 1; r >= rTop; r--) list.push({ c: cBack, r });
    for (let i = -w + 1; i <= -1; i++) list.push({ c: (cCenter + i * dirFront + C) % C, r: rTop });
    return list;
  }

  function blendArmholeBoundary(boundary: { c: number; r: number }[], ring: THREE.Vector3[]) {
    for (let i = 0; i < boundary.length; i++) {
      const { c, r } = boundary[i];
      const target = ring[i];
      if (!target) continue;

      rings[r][c].copy(target);

      const previousRow = Math.max(0, r - 1);
      const nextRow = Math.min(R, r + 1);
      if (previousRow !== r) rings[previousRow][c].lerp(target, 0.28);
      if (nextRow !== r) rings[nextRow][c].lerp(target, 0.18);

      const previousColumn = (c - 1 + C) % C;
      const nextColumn = (c + 1) % C;
      rings[r][previousColumn].lerp(target, 0.12);
      rings[r][nextColumn].lerp(target, 0.12);
    }
  }

  if (input.rightArmhole) {
    const rightIndices = getArmholeBoundaryIndices(0, 1);
    blendArmholeBoundary(rightIndices, input.rightArmhole.ring);
  }

  if (input.leftArmhole) {
    const leftIndices = getArmholeBoundaryIndices(C / 2, -1);
    blendArmholeBoundary(leftIndices, input.leftArmhole.ring);
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= R; r++) {
    const v = r / R;
    for (let c = 0; c < C; c++) {
      const pt = rings[r][c];
      positions.push(pt.x, pt.y, pt.z);
      uvs.push(c / C, v);
    }
  }

  for (let r = 0; r < R; r++) {
    for (let c = 0; c < C; c++) {
      const nextC = (c + 1) % C;

      const inRightHole = r >= rTop && r < rBottom && (c >= C - w || c < w);
      const inLeftHole = r >= rTop && r < rBottom && (c >= C / 2 - w && c < C / 2 + w);

      if (inRightHole && input.rightArmhole) continue;
      if (inLeftHole && input.leftArmhole) continue;

      const a = r * C + c;
      const b = r * C + nextC;
      const d = (r + 1) * C + c;
      const e = (r + 1) * C + nextC;

      indices.push(a, d, b, b, d, e);
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
