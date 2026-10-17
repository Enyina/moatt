import * as THREE from 'three';
import { TSHIRT_UV_REGIONS } from './uvRegions';
import { applyCylinderUVRegion, applyPlanarUVProjection } from './uvHelpers';
import { ProceduralGarmentOptions, TShirtParams } from './garmentTypes';
import { createBodyProfile } from '../bodyProfile';
import { resolveBodyLandmarks, Vector3Like } from '../bodyLandmarks';
import { createTShirtAnchorMap, normalize, subtract } from '../garmentAnchors';
import { createTorsoShellGeometry } from './surfaces/torsoShell';
import { createSleeveShellGeometry } from './surfaces/sleeveShell';

const PROCEDURAL_DEBUG_HELPERS = false;

export const DEFAULT_TSHIRT_PARAMS: TShirtParams = {
  torsoWidth: 0.52,
  torsoLength: 0.58,
  looseness: 1.0,
  sleeveLength: 0.3,
  sleeveTopRadius: 0.045, // Reduced from 0.065
  sleeveCuffRadius: 0.040, // Reduced from 0.052
  neckWidth: 0.22,
  neckDropFront: 0.045,
  neckDropBack: 0.015,
  thickness: 0.024,
};

const TORSO_SEGMENTS = 48;
const ARMHOLE_VERTICAL_SPAN = 4;
const GARMENT_CLEARANCE = 0.026;

function getArmholeBoundaryCount(segments: number): number {
  const halfWidth = Math.max(2, Math.round(segments * 0.1));
  const verticalSpan = ARMHOLE_VERTICAL_SPAN;
  return halfWidth * 4 + verticalSpan * 2;
}

function toVector3(value: Vector3Like): THREE.Vector3 {
  return new THREE.Vector3(value.x, value.y, value.z);
}

function resolveBodyFitFactors(bodyTemplateId: string) {
  const isMale = bodyTemplateId.includes('male');
  const isPlus = bodyTemplateId.includes('plus');
  const isAthletic = bodyTemplateId.includes('athletic');

  return {
    chestWidthFactor: isMale ? 0.82 : 0.74,
    depthFactor: (isMale ? 1.06 : 0.98) * (isPlus ? 1.08 : 1),
    shoulderFactor: isAthletic ? 1.05 : 1,
    waistWidthFactor: isPlus ? 0.54 : 0.42,
    hipWidthFactor: isMale ? 0.48 : 0.58,
  };
}

function generateArmholeRing(input: {
  center: THREE.Vector3;
  count: number;
  depthRadius: number;
  sideSign: -1 | 1;
  verticalRadius: number;
}): THREE.Vector3[] {
  const ring: THREE.Vector3[] = [];
  for (let i = 0; i < input.count; i++) {
    const angle = (i / input.count) * Math.PI * 2;
    const frontBack = Math.sin(angle);
    const topBottom = Math.cos(angle);
    const sideCurve = 0.012 * input.sideSign * Math.pow(Math.abs(frontBack), 1.35);

    ring.push(new THREE.Vector3(
      input.center.x + sideCurve,
      input.center.y + input.verticalRadius * topBottom,
      input.center.z + input.depthRadius * frontBack,
    ));
  }
  return ring;
}

type TorsoPanelPart = 'back' | 'front' | 'leftSide' | 'rightSide';

function createTorsoPanelGeometry(
  source: THREE.BufferGeometry,
  part: TorsoPanelPart,
  centerX: number,
  centerZ: number,
): THREE.BufferGeometry {
  const sourcePosition = source.getAttribute('position');
  const sourceNormal = source.getAttribute('normal');
  const sourceIndex = source.getIndex();
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let nextIndex = 0;

  const readVertex = (index: number): THREE.Vector3 => new THREE.Vector3(
    sourcePosition.getX(index),
    sourcePosition.getY(index),
    sourcePosition.getZ(index),
  );

  const triangleCount = sourceIndex ? sourceIndex.count : sourcePosition.count;
  for (let i = 0; i < triangleCount; i += 3) {
    const vertexIndices = sourceIndex
      ? [sourceIndex.getX(i), sourceIndex.getX(i + 1), sourceIndex.getX(i + 2)]
      : [i, i + 1, i + 2];
    const vertices = vertexIndices.map(readVertex);
    const center = new THREE.Vector3()
      .add(vertices[0])
      .add(vertices[1])
      .add(vertices[2])
      .multiplyScalar(1 / 3);
    const angle = Math.atan2(center.z - centerZ, center.x - centerX);
    const frontBack = Math.sin(angle);
    const side = Math.cos(angle);
    const belongsToPart = (
      (part === 'front' && frontBack > 0.42)
      || (part === 'back' && frontBack < -0.42)
      || (part === 'rightSide' && frontBack >= -0.42 && frontBack <= 0.42 && side >= 0)
      || (part === 'leftSide' && frontBack >= -0.42 && frontBack <= 0.42 && side < 0)
    );

    if (!belongsToPart) continue;

    vertices.forEach((vertex, index) => {
      const sourceVertexIndex = vertexIndices[index];
      positions.push(vertex.x, vertex.y, vertex.z);
      if (sourceNormal) {
        normals.push(
          sourceNormal.getX(sourceVertexIndex),
          sourceNormal.getY(sourceVertexIndex),
          sourceNormal.getZ(sourceVertexIndex),
        );
      }
      uvs.push(0, 0);
    });
    indices.push(nextIndex, nextIndex + 1, nextIndex + 2);
    nextIndex += 3;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length === positions.length) {
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  if (normals.length !== positions.length) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function createTorsoPanelMesh(input: {
  centerX: number;
  centerZ: number;
  garmentId: string;
  part: TorsoPanelPart;
  sourceGeometry: THREE.BufferGeometry;
}): THREE.Mesh {
  const geometry = createTorsoPanelGeometry(
    input.sourceGeometry,
    input.part,
    input.centerX,
    input.centerZ,
  );
  const uvRegion = TSHIRT_UV_REGIONS[input.part];
  if (uvRegion) applyPlanarUVProjection(geometry, uvRegion);

  const mesh = new THREE.Mesh(geometry);
  mesh.name = `tshirt-${input.part}`;
  mesh.userData = {
    garmentId: input.garmentId,
    part: input.part,
    uvRegion,
    isSurfaceShell: true,
  };
  return mesh;
}

export function createProceduralTShirtGroup(
  customParams?: Partial<TShirtParams>,
  options: ProceduralGarmentOptions = {},
): THREE.Group {
  const params = { ...DEFAULT_TSHIRT_PARAMS, ...customParams };
  const group = new THREE.Group();
  group.name = 'procedural-tshirt';
  const bodyProfile = options.bodyProfile ?? createBodyProfile('male-standard');
  const landmarks = resolveBodyLandmarks(bodyProfile);
  const anchors = createTShirtAnchorMap(landmarks, {
    hemDrop: params.torsoLength,
    looseness: params.looseness,
  });
  
  const shoulderWidth = Math.abs(anchors.shoulderLine.right.x - anchors.shoulderLine.left.x);
  const fitFactors = resolveBodyFitFactors(bodyProfile.bodyTemplateId);
  const torsoCenterZ = (anchors.torsoEnvelope.frontZ + anchors.torsoEnvelope.backZ) / 2;
  const bodyDepth = Math.abs(landmarks.frontDepth.z - landmarks.backDepth.z) * fitFactors.depthFactor;
  const bodyChestWidth = shoulderWidth * fitFactors.chestWidthFactor;
  const bodyShoulderWidth = shoulderWidth * fitFactors.shoulderFactor;
  const bodyWaistWidth = shoulderWidth * fitFactors.waistWidthFactor;
  const bodyHipWidth = shoulderWidth * fitFactors.hipWidthFactor;
  
  const loosenessAllowance = GARMENT_CLEARANCE + (params.looseness - 1) * 0.055;
  const chestWidth = Math.max(params.torsoWidth, bodyChestWidth + loosenessAllowance * 2.4);
  const shoulderShellWidth = Math.max(
    bodyShoulderWidth + loosenessAllowance * 1.2,
    chestWidth * 0.94,
  );
  const waistWidth = Math.max(bodyWaistWidth + loosenessAllowance * 2.1, chestWidth * 0.72);
  const hipWidth = Math.max(bodyHipWidth + loosenessAllowance * 2.1, chestWidth * 0.82);

  const depth = bodyDepth + GARMENT_CLEARANCE * 2 + params.thickness * 0.9;
  const hemY = anchors.neckline.y - params.torsoLength;
  const neckBaseY = anchors.neckline.y - shoulderWidth * 0.018;
  const chestY = THREE.MathUtils.lerp(neckBaseY, landmarks.chest.y, 0.72);
  const waistY = anchors.neckline.y - params.torsoLength * 0.68;

  const armholeVertexCount = getArmholeBoundaryCount(TORSO_SEGMENTS);

  const leftDirection = toVector3(normalize(subtract(anchors.sleeveAttachLeft.wrist, anchors.sleeveAttachLeft.origin)));
  const rightDirection = toVector3(normalize(subtract(anchors.sleeveAttachRight.wrist, anchors.sleeveAttachRight.origin)));
  leftDirection.y -= 0.14;
  rightDirection.y -= 0.14;
  leftDirection.normalize();
  rightDirection.normalize();

  const armholeTopY = anchors.shoulderLine.left.y + shoulderWidth * 0.018;
  const armholeBottomY = THREE.MathUtils.lerp(armholeTopY, chestY, 0.58);
  const armholeCenterY = (armholeTopY + armholeBottomY) / 2;
  const armholeVerticalRadius = Math.max((armholeTopY - armholeBottomY) / 2, params.sleeveTopRadius * 0.62);
  const armholeDepthRadius = Math.max(bodyDepth * 0.36 + GARMENT_CLEARANCE * 0.45, params.sleeveTopRadius * 0.66);
  const shoulderSideX = shoulderShellWidth / 2;
  const armholeInset = GARMENT_CLEARANCE * 0.22;
  const leftArmholeCenter = new THREE.Vector3(
    anchors.neckline.x - shoulderSideX - armholeInset,
    armholeCenterY,
    torsoCenterZ,
  );
  const rightArmholeCenter = new THREE.Vector3(
    anchors.neckline.x + shoulderSideX + armholeInset,
    armholeCenterY,
    torsoCenterZ,
  );

  const leftRing = generateArmholeRing({
    center: leftArmholeCenter,
    count: armholeVertexCount,
    depthRadius: armholeDepthRadius,
    sideSign: -1,
    verticalRadius: armholeVerticalRadius,
  });
  const rightRing = generateArmholeRing({
    center: rightArmholeCenter,
    count: armholeVertexCount,
    depthRadius: armholeDepthRadius,
    sideSign: 1,
    verticalRadius: armholeVerticalRadius,
  });

  const torsoGeo = createTorsoShellGeometry({
    centerX: anchors.neckline.x,
    centerZ: torsoCenterZ,
    chestY,
    depth,
    hemY,
    hipWidth: hipWidth * (1.0 + (params.looseness - 1) * 0.35),
    looseness: params.looseness,
    neckWidth: params.neckWidth,
    neckY: neckBaseY + shoulderWidth * 0.034,
    neckDropFront: Math.min(params.neckDropFront, shoulderWidth * 0.028),
    neckDropBack: Math.min(params.neckDropBack, shoulderWidth * 0.014),
    segments: TORSO_SEGMENTS,
    shoulderDrop: shoulderWidth * 0.026,
    shoulderWidth: shoulderShellWidth,
    waistWidth: waistWidth * (1.0 + (params.looseness - 1) * 0.18),
    waistY,
    leftArmhole: { ring: leftRing },
    rightArmhole: { ring: rightRing },
  });
  const torsoPanelBase = {
    centerX: anchors.neckline.x,
    centerZ: torsoCenterZ,
    garmentId: 'tshirt-basic',
    sourceGeometry: torsoGeo,
  };
  group.add(createTorsoPanelMesh({ ...torsoPanelBase, part: 'front' }));
  group.add(createTorsoPanelMesh({ ...torsoPanelBase, part: 'back' }));
  group.add(createTorsoPanelMesh({ ...torsoPanelBase, part: 'leftSide' }));
  group.add(createTorsoPanelMesh({ ...torsoPanelBase, part: 'rightSide' }));

  // Left Sleeve
  const leftSleeveGeo = createSleeveShellGeometry({
    boundaryRing: leftRing,
    cuffRadius: params.sleeveCuffRadius,
    direction: new THREE.Vector3(leftDirection.x, leftDirection.y, leftDirection.z),
    length: params.sleeveLength,
  });
  applyCylinderUVRegion(leftSleeveGeo, TSHIRT_UV_REGIONS.leftSleeve!);
  const leftSleeveMesh = new THREE.Mesh(leftSleeveGeo);
  leftSleeveMesh.name = 'tshirt-leftSleeve';
  leftSleeveMesh.userData = { garmentId: 'tshirt-basic', part: 'leftSleeve', uvRegion: TSHIRT_UV_REGIONS.leftSleeve };
  group.add(leftSleeveMesh);

  // Right Sleeve
  const rightSleeveGeo = createSleeveShellGeometry({
    boundaryRing: rightRing,
    cuffRadius: params.sleeveCuffRadius,
    direction: new THREE.Vector3(rightDirection.x, rightDirection.y, rightDirection.z),
    length: params.sleeveLength,
  });
  applyCylinderUVRegion(rightSleeveGeo, TSHIRT_UV_REGIONS.rightSleeve!);
  const rightSleeveMesh = new THREE.Mesh(rightSleeveGeo);
  rightSleeveMesh.name = 'tshirt-rightSleeve';
  rightSleeveMesh.userData = { garmentId: 'tshirt-basic', part: 'rightSleeve', uvRegion: TSHIRT_UV_REGIONS.rightSleeve };
  group.add(rightSleeveMesh);

  // --- DEBUG HELPERS ---
  if (PROCEDURAL_DEBUG_HELPERS) {
    const createMarker = (color: number) => {
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.02, 8, 8),
        new THREE.MeshBasicMaterial({ color, depthTest: false })
      );
      mesh.renderOrder = 999;
      return mesh;
    };

    const centerMarker = createMarker(0xff0000); // Red: Torso Center
    group.add(centerMarker);

    const leftShoulderMarker = createMarker(0x00ff00); // Green: Left Shoulder
    leftShoulderMarker.position.set(anchors.shoulderLine.left.x, anchors.shoulderLine.left.y, anchors.shoulderLine.left.z);
    group.add(leftShoulderMarker);

    const rightShoulderMarker = createMarker(0x0000ff); // Blue: Right Shoulder
    rightShoulderMarker.position.set(anchors.shoulderLine.right.x, anchors.shoulderLine.right.y, anchors.shoulderLine.right.z);
    group.add(rightShoulderMarker);

    const box = new THREE.BoxHelper(group, 0xffff00); // Yellow: Bounding Box
    group.add(box);
  }

  return group;
}
