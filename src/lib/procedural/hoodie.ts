import * as THREE from 'three';
import { HOODIE_UV_REGIONS } from './uvRegions';
import { applyPlanarUVProjection, applyCylinderUVRegion } from './uvHelpers';
import { HoodieParams, ProceduralGarmentOptions } from './garmentTypes';
import { addTorsoPanelWrap, createSideSeamGeometry } from './fit';
import { createBodyProfile } from '../bodyProfile';
import { resolveBodyLandmarks, Vector3Like } from '../bodyLandmarks';
import { createHoodieAnchorMap, normalize, subtract } from '../garmentAnchors';

const PROCEDURAL_DEBUG_HELPERS = false;

export const DEFAULT_HOODIE_PARAMS: HoodieParams = {
  torsoWidth: 0.68,
  torsoLength: 0.85,
  looseness: 1.05,
  sleeveLength: 0.65,
  sleeveTopRadius: 0.088,
  sleeveCuffRadius: 0.064,
  hoodDepth: 0.28,
  hoodHeight: 0.38,
  pocketWidth: 0.4,
  pocketHeight: 0.18,
  thickness: 0.028,
};

function createHoodieTorso(isFront: boolean, params: HoodieParams): THREE.BufferGeometry {
  const shoulderWidth = params.torsoWidth * 0.82;
  const waistWidth = params.torsoWidth * 0.9;
  const height = params.torsoLength;
  const depth = params.thickness;

  const necklineWidth = 0.28;
  const necklineDrop = isFront ? 0.12 : 0.04;
  const armholeDrop = 0.35;
  const flareWidth = waistWidth * (1.02 + (params.looseness - 1) * 0.55);
  const segments = 12;
  const halfHeight = height / 2;

  const shape = new THREE.Shape();
  
  shape.moveTo(-waistWidth / 2, -halfHeight);
  shape.quadraticCurveTo(-flareWidth / 2, -halfHeight * 0.5, -shoulderWidth / 2 + 0.05, halfHeight - armholeDrop);
  shape.quadraticCurveTo(-shoulderWidth / 2, halfHeight - armholeDrop * 0.5, -shoulderWidth / 2, halfHeight - necklineDrop * 2.2);
  shape.lineTo(-necklineWidth / 2, halfHeight - necklineDrop * 0.15);
  shape.quadraticCurveTo(0, halfHeight - necklineDrop * 2, necklineWidth / 2, halfHeight);
  shape.lineTo(shoulderWidth / 2, halfHeight - necklineDrop * 2.2);
  shape.quadraticCurveTo(shoulderWidth / 2, halfHeight - armholeDrop * 0.5, shoulderWidth / 2 - 0.05, halfHeight - armholeDrop);
  shape.quadraticCurveTo(flareWidth / 2, -halfHeight * 0.5, waistWidth / 2, -halfHeight);
  shape.lineTo(-waistWidth / 2, -halfHeight);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.015,
    bevelThickness: 0.015,
    curveSegments: segments,
  });

  geometry.center();
  addTorsoPanelWrap(geometry, isFront ? 'front' : 'back', shoulderWidth / 2, Math.max(depth * 2.5, 0.085));
  return geometry;
}

function createTaperedSleeve(params: HoodieParams): THREE.BufferGeometry {
  const geometry = new THREE.CylinderGeometry(
    params.sleeveTopRadius,
    params.sleeveCuffRadius,
    params.sleeveLength,
    24,
    1,
    false
  );
  geometry.translate(0, -params.sleeveLength / 2, 0); 
  return geometry;
}

function createKangarooPocket(params: HoodieParams): THREE.BufferGeometry {
  const width = params.pocketWidth;
  const height = params.pocketHeight;
  const depth = params.thickness * 0.6; 

  const topWidth = width * 0.6;
  const halfHeight = height / 2;

  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -halfHeight);
  shape.lineTo(-width / 2, -halfHeight + height * 0.4); 
  shape.quadraticCurveTo(-width / 2 + 0.05, halfHeight, -topWidth / 2, halfHeight); 
  shape.lineTo(topWidth / 2, halfHeight); 
  shape.quadraticCurveTo(width / 2 - 0.05, halfHeight, width / 2, -halfHeight + height * 0.4); 
  shape.lineTo(width / 2, -halfHeight); 
  shape.lineTo(-width / 2, -halfHeight);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.005,
    bevelThickness: 0.005,
    curveSegments: 8,
  });

  geometry.center();
  return geometry;
}

function createHood(params: HoodieParams): THREE.BufferGeometry {
  const depth = params.hoodDepth;
  const height = params.hoodHeight;
  const thickness = params.thickness * 1.5;

  const shape = new THREE.Shape();
  
  // Start from bottom front (neck)
  shape.moveTo(0, 0);
  
  // Curve back and up
  shape.quadraticCurveTo(-depth * 0.2, height * 0.2, -depth * 0.8, height * 0.4);
  
  // Curve up to top back
  shape.quadraticCurveTo(-depth, height * 0.8, -depth * 0.5, height);
  
  // Curve forward to top front
  shape.quadraticCurveTo(depth * 0.1, height, depth * 0.3, height * 0.8);
  
  // Now trace the inner profile (hollow part)
  const innerOffset = thickness;
  shape.lineTo(depth * 0.3 - innerOffset, height * 0.8 - innerOffset);
  
  // Inner curve back to top back
  shape.quadraticCurveTo(-depth * 0.5 + innerOffset, height - innerOffset, -depth + innerOffset*2, height * 0.8 - innerOffset);
  
  // Inner curve down
  shape.quadraticCurveTo(-depth * 0.8 + innerOffset*2, height * 0.4, -depth * 0.2 + innerOffset, height * 0.2 - innerOffset);
  
  // Inner curve to neck
  shape.lineTo(innerOffset, 0);
  shape.lineTo(0, 0);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: params.torsoWidth * 0.4, // Width of the hood opening
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.01,
    bevelThickness: 0.01,
    curveSegments: 12,
  });

  geometry.center();
  return geometry;
}

function createDrawstring(): THREE.BufferGeometry {
  const path = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.02, -0.1, 0.02),
    new THREE.Vector3(-0.01, -0.2, 0.01),
    new THREE.Vector3(0, -0.3, 0)
  ]);
  
  return new THREE.TubeGeometry(path, 8, 0.005, 8, false);
}

function angleFromDownVector(direction: Vector3Like): number {
  return Math.atan2(direction.x, -direction.y);
}

export function createProceduralHoodieGroup(
  customParams?: Partial<HoodieParams>,
  options: ProceduralGarmentOptions = {},
): THREE.Group {
  const params = { ...DEFAULT_HOODIE_PARAMS, ...customParams };
  const group = new THREE.Group();
  group.name = 'procedural-hoodie';
  const bodyProfile = options.bodyProfile ?? createBodyProfile('male-standard');
  const landmarks = resolveBodyLandmarks(bodyProfile);
  const anchors = createHoodieAnchorMap(landmarks, {
    hemDrop: params.torsoLength,
    looseness: params.looseness,
  });
  const shoulderWidth = Math.abs(anchors.shoulderLine.right.x - anchors.shoulderLine.left.x);
  const panelParams: HoodieParams = {
    ...params,
    torsoWidth: Math.max(params.torsoWidth, shoulderWidth / 0.82),
  };
  const surfaceOffset = params.thickness + 0.018;
  const frontSurfaceZ = anchors.torsoEnvelope.frontZ + surfaceOffset;
  const backSurfaceZ = anchors.torsoEnvelope.backZ - surfaceOffset;
  const topSideY = anchors.shoulderLine.left.y - params.torsoLength * 0.2;
  const bottomSideY = anchors.neckline.y - params.torsoLength + 0.02;
  const sideTopX = panelParams.torsoWidth * 0.82 / 2 - 0.035;
  const sideWaistX = panelParams.torsoWidth * (0.86 + (params.looseness - 1) * 0.28) / 2;
  const sideBottomX = panelParams.torsoWidth * (0.9 + (params.looseness - 1) * 0.32) / 2;

  // Front Panel
  const frontGeo = createHoodieTorso(true, panelParams);
  if (HOODIE_UV_REGIONS.front) applyPlanarUVProjection(frontGeo, HOODIE_UV_REGIONS.front);
  const frontMesh = new THREE.Mesh(frontGeo);
  frontMesh.position.set(anchors.neckline.x, anchors.neckline.y - params.torsoLength / 2, frontSurfaceZ);
  frontMesh.name = 'hoodie-front';
  frontMesh.userData = { garmentId: 'hoodie', part: 'front', uvRegion: HOODIE_UV_REGIONS.front };
  group.add(frontMesh);

  // Back Panel
  const backGeo = createHoodieTorso(false, panelParams);
  if (HOODIE_UV_REGIONS.back) applyPlanarUVProjection(backGeo, HOODIE_UV_REGIONS.back);
  const backMesh = new THREE.Mesh(backGeo);
  backMesh.position.set(anchors.neckline.x, anchors.neckline.y - params.torsoLength / 2, backSurfaceZ);
  backMesh.name = 'hoodie-back';
  backMesh.userData = { garmentId: 'hoodie', part: 'back', uvRegion: HOODIE_UV_REGIONS.back };
  group.add(backMesh);

  const leftSideMesh = new THREE.Mesh(createSideSeamGeometry({
    backZ: backSurfaceZ,
    bottomX: sideBottomX,
    bottomY: bottomSideY,
    frontZ: frontSurfaceZ,
    side: 'left',
    topX: sideTopX,
    topY: topSideY,
    waistX: sideWaistX,
    waistT: 0.56,
    outwardBulge: 0.018 * params.looseness,
    depthBulge: 0.015,
  }));
  leftSideMesh.name = 'hoodie-leftSide';
  leftSideMesh.userData = { garmentId: 'hoodie', part: 'leftSide', uvRegion: HOODIE_UV_REGIONS.leftSide };
  group.add(leftSideMesh);

  const rightSideMesh = new THREE.Mesh(createSideSeamGeometry({
    backZ: backSurfaceZ,
    bottomX: sideBottomX,
    bottomY: bottomSideY,
    frontZ: frontSurfaceZ,
    side: 'right',
    topX: sideTopX,
    topY: topSideY,
    waistX: sideWaistX,
    waistT: 0.56,
    outwardBulge: 0.018 * params.looseness,
    depthBulge: 0.015,
  }));
  rightSideMesh.name = 'hoodie-rightSide';
  rightSideMesh.userData = { garmentId: 'hoodie', part: 'rightSide', uvRegion: HOODIE_UV_REGIONS.rightSide };
  group.add(rightSideMesh);

  // Left Sleeve
  const leftSleeveGeo = createTaperedSleeve(params);
  if (HOODIE_UV_REGIONS.leftSleeve) applyCylinderUVRegion(leftSleeveGeo, HOODIE_UV_REGIONS.leftSleeve);
  const leftSleeveMesh = new THREE.Mesh(leftSleeveGeo);
  const leftDirection = normalize(subtract(anchors.sleeveAttachLeft.wrist, anchors.sleeveAttachLeft.origin));
  leftSleeveMesh.position.set(
    anchors.sleeveAttachLeft.origin.x,
    anchors.sleeveAttachLeft.origin.y,
    anchors.sleeveAttachLeft.origin.z,
  ); 
  leftSleeveMesh.rotation.z = angleFromDownVector(leftDirection); 
  leftSleeveMesh.name = 'hoodie-leftSleeve';
  leftSleeveMesh.userData = { garmentId: 'hoodie', part: 'leftSleeve', uvRegion: HOODIE_UV_REGIONS.leftSleeve };
  group.add(leftSleeveMesh);

  // Right Sleeve
  const rightSleeveGeo = createTaperedSleeve(params);
  if (HOODIE_UV_REGIONS.rightSleeve) applyCylinderUVRegion(rightSleeveGeo, HOODIE_UV_REGIONS.rightSleeve);
  const rightSleeveMesh = new THREE.Mesh(rightSleeveGeo);
  const rightDirection = normalize(subtract(anchors.sleeveAttachRight.wrist, anchors.sleeveAttachRight.origin));
  rightSleeveMesh.position.set(
    anchors.sleeveAttachRight.origin.x,
    anchors.sleeveAttachRight.origin.y,
    anchors.sleeveAttachRight.origin.z,
  ); 
  rightSleeveMesh.rotation.z = angleFromDownVector(rightDirection); 
  rightSleeveMesh.name = 'hoodie-rightSleeve';
  rightSleeveMesh.userData = { garmentId: 'hoodie', part: 'rightSleeve', uvRegion: HOODIE_UV_REGIONS.rightSleeve };
  group.add(rightSleeveMesh);

  // Hood
  const hoodGeo = createHood(params);
  if (HOODIE_UV_REGIONS.hood) applyPlanarUVProjection(hoodGeo, HOODIE_UV_REGIONS.hood);
  const hoodMesh = new THREE.Mesh(hoodGeo);
  hoodMesh.position.set(
    anchors.hoodAnchor?.x ?? anchors.neckline.x,
    anchors.hoodAnchor?.y ?? anchors.neckline.y,
    (anchors.hoodAnchor?.z ?? backSurfaceZ) - 0.03,
  );
  hoodMesh.name = 'hoodie-hood';
  hoodMesh.userData = { garmentId: 'hoodie', part: 'hood', uvRegion: HOODIE_UV_REGIONS.hood };
  group.add(hoodMesh);

  // Pocket
  const pocketGeo = createKangarooPocket(params);
  if (HOODIE_UV_REGIONS.pocket) applyPlanarUVProjection(pocketGeo, HOODIE_UV_REGIONS.pocket);
  const pocketMesh = new THREE.Mesh(pocketGeo);
  pocketMesh.position.set(
    anchors.pocketAnchor?.x ?? anchors.neckline.x,
    anchors.pocketAnchor?.y ?? anchors.hemline.y + params.pocketHeight,
    frontSurfaceZ + 0.025,
  );
  pocketMesh.name = 'hoodie-pocket';
  pocketMesh.userData = { garmentId: 'hoodie', part: 'pocket', uvRegion: HOODIE_UV_REGIONS.pocket };
  group.add(pocketMesh);

  // Drawstrings (no UV mapping, special part)
  const leftDrawstringGeo = createDrawstring();
  const leftDrawstringMesh = new THREE.Mesh(leftDrawstringGeo);
  leftDrawstringMesh.position.set(anchors.neckline.x - 0.08, anchors.neckline.y - 0.08, frontSurfaceZ + 0.04);
  leftDrawstringMesh.name = 'hoodie-drawstringLeft';
  leftDrawstringMesh.userData = { garmentId: 'hoodie', part: 'drawstringLeft', isSolidColor: true };
  group.add(leftDrawstringMesh);

  const rightPath = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.02, -0.12, 0.02),
    new THREE.Vector3(0.01, -0.18, 0.01),
    new THREE.Vector3(0, -0.28, 0)
  ]);
  const rightDrawstringGeoUnique = new THREE.TubeGeometry(rightPath, 8, 0.005, 8, false);
  const rightDrawstringMesh = new THREE.Mesh(rightDrawstringGeoUnique);
  rightDrawstringMesh.position.set(anchors.neckline.x + 0.08, anchors.neckline.y - 0.08, frontSurfaceZ + 0.04);
  rightDrawstringMesh.name = 'hoodie-drawstringRight';
  rightDrawstringMesh.userData = { garmentId: 'hoodie', part: 'drawstringRight', isSolidColor: true };
  group.add(rightDrawstringMesh);

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
