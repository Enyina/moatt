import * as THREE from 'three';
import type { BodyProfile } from '../bodyProfile';
import { resolveBodyLandmarks, type Vector3Like } from '../bodyLandmarks';
import { CrossSection, createCrossSectionRing } from './surfaces/crossSection';

type BodyKind = 'female' | 'male' | 'child';

type LimbRadius = {
  end: number;
  start: number;
};

const skinMaterial = new THREE.MeshStandardMaterial({
  color: '#f3f6f7',
  metalness: 0,
  roughness: 0.58,
});

const toVector3 = (value: Vector3Like): THREE.Vector3 => new THREE.Vector3(value.x, value.y, value.z);

const midpoint = (a: THREE.Vector3, b: THREE.Vector3): THREE.Vector3 => (
  new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5)
);

const distance = (a: THREE.Vector3, b: THREE.Vector3): number => a.distanceTo(b);

function resolveBodyKind(profile: BodyProfile): BodyKind {
  if (profile.bodyTemplateId.includes('child')) return 'child';
  if (profile.bodyTemplateId.includes('male')) return 'male';
  return 'female';
}

function createNamedMesh(
  name: string,
  geometry: THREE.BufferGeometry,
  material: THREE.Material = skinMaterial,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.raycast = () => undefined;
  return mesh;
}

function createEllipsoidMesh(
  name: string,
  center: THREE.Vector3,
  scale: THREE.Vector3,
): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 32, 18);
  geometry.scale(scale.x, scale.y, scale.z);
  geometry.translate(center.x, center.y, center.z);
  return createNamedMesh(name, geometry);
}

function createCapsuleBetween(
  name: string,
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: LimbRadius,
  radialSegments = 20,
): THREE.Mesh {
  const axis = new THREE.Vector3().subVectors(end, start);
  const length = Math.max(axis.length(), 0.001);
  const geometry = new THREE.CylinderGeometry(
    radius.end,
    radius.start,
    length,
    radialSegments,
    8,
    false,
  );
  const orientation = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    axis.clone().normalize(),
  );
  geometry.applyQuaternion(orientation);
  const center = midpoint(start, end);
  geometry.translate(center.x, center.y, center.z);

  const startCap = new THREE.SphereGeometry(radius.start, radialSegments, 10);
  startCap.scale(1, 0.82, 1);
  startCap.applyQuaternion(orientation);
  startCap.translate(start.x, start.y, start.z);

  const endCap = new THREE.SphereGeometry(radius.end, radialSegments, 10);
  endCap.scale(1, 0.82, 1);
  endCap.applyQuaternion(orientation);
  endCap.translate(end.x, end.y, end.z);

  const merged = mergeGeometries([geometry, startCap, endCap]);
  return createNamedMesh(name, merged);
}

function createTorsoGeometry(input: {
  centerX: number;
  centerZ: number;
  chestY: number;
  chestWidth: number;
  depth: number;
  hipY: number;
  hipWidth: number;
  neckY: number;
  shoulderY: number;
  shoulderWidth: number;
  waistY: number;
  waistWidth: number;
}): THREE.BufferGeometry {
  const sections: CrossSection[] = [
    {
      center: new THREE.Vector3(input.centerX, input.neckY, input.centerZ),
      depth: input.depth * 0.42,
      profile: 'ellipse',
      segments: 40,
      width: input.shoulderWidth * 0.28,
    },
    {
      center: new THREE.Vector3(input.centerX, input.shoulderY, input.centerZ),
      depth: input.depth * 0.82,
      profile: 'ellipse',
      segments: 40,
      width: input.shoulderWidth,
    },
    {
      center: new THREE.Vector3(input.centerX, input.chestY, input.centerZ),
      depth: input.depth,
      profile: 'roundedRectangle',
      segments: 40,
      width: input.chestWidth,
    },
    {
      center: new THREE.Vector3(input.centerX, input.waistY, input.centerZ),
      depth: input.depth * 0.86,
      profile: 'ellipse',
      segments: 40,
      width: input.waistWidth,
    },
    {
      center: new THREE.Vector3(input.centerX, input.hipY, input.centerZ),
      depth: input.depth * 0.94,
      profile: 'ellipse',
      segments: 40,
      width: input.hipWidth,
    },
  ];

  const rings = sections.map((section) => createCrossSectionRing(section));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const segmentCount = sections[0].segments;

  rings.forEach((ring, row) => {
    ring.forEach((point, column) => {
      positions.push(point.x, point.y, point.z);
      uvs.push(column / segmentCount, row / Math.max(rings.length - 1, 1));
    });
  });

  for (let row = 0; row < rings.length - 1; row += 1) {
    for (let column = 0; column < segmentCount; column += 1) {
      const nextColumn = (column + 1) % segmentCount;
      const a = row * segmentCount + column;
      const b = row * segmentCount + nextColumn;
      const c = (row + 1) * segmentCount + column;
      const d = (row + 1) * segmentCount + nextColumn;
      indices.push(a, b, c, b, d, c);
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

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let vertexOffset = 0;

  geometries.forEach((geometry) => {
    const position = geometry.getAttribute('position');
    const normal = geometry.getAttribute('normal');
    const uv = geometry.getAttribute('uv');
    const index = geometry.getIndex();

    for (let i = 0; i < position.count; i += 1) {
      positions.push(position.getX(i), position.getY(i), position.getZ(i));
      if (normal) normals.push(normal.getX(i), normal.getY(i), normal.getZ(i));
      if (uv) uvs.push(uv.getX(i), uv.getY(i));
    }

    if (index) {
      for (let i = 0; i < index.count; i += 1) {
        indices.push(index.getX(i) + vertexOffset);
      }
    } else {
      for (let i = 0; i < position.count; i += 1) {
        indices.push(i + vertexOffset);
      }
    }

    vertexOffset += position.count;
  });

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length === positions.length) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  }
  if (uvs.length > 0) {
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  }
  merged.setIndex(indices);
  if (normals.length !== positions.length) merged.computeVertexNormals();
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  return merged;
}

export function createProceduralMannequinGroup(bodyProfile: BodyProfile): THREE.Group {
  const landmarks = resolveBodyLandmarks(bodyProfile);
  const kind = resolveBodyKind(bodyProfile);
  const group = new THREE.Group();
  group.name = 'procedural-mannequin';

  const neck = toVector3(landmarks.neck);
  const chest = toVector3(landmarks.chest);
  const waist = toVector3(landmarks.waist);
  const hip = toVector3(landmarks.hip);
  const leftShoulder = toVector3(landmarks.leftShoulder);
  const rightShoulder = toVector3(landmarks.rightShoulder);
  const leftElbow = toVector3(landmarks.leftElbow);
  const rightElbow = toVector3(landmarks.rightElbow);
  const leftWrist = toVector3(landmarks.leftWrist);
  const rightWrist = toVector3(landmarks.rightWrist);
  const leftThigh = toVector3(landmarks.leftThigh);
  const rightThigh = toVector3(landmarks.rightThigh);
  const leftKnee = toVector3(landmarks.leftKnee);
  const rightKnee = toVector3(landmarks.rightKnee);
  const leftAnkle = toVector3(landmarks.leftAnkle);
  const rightAnkle = toVector3(landmarks.rightAnkle);
  const leftFoot = toVector3(landmarks.leftFoot);
  const rightFoot = toVector3(landmarks.rightFoot);
  const centerX = neck.x;
  const centerZ = (landmarks.frontDepth.z + landmarks.backDepth.z) / 2;
  const shoulderWidth = distance(leftShoulder, rightShoulder);
  const depth = Math.abs(landmarks.frontDepth.z - landmarks.backDepth.z);
  const isPlus = bodyProfile.bodyTemplateId.includes('plus');
  const athletic = bodyProfile.bodyTemplateId.includes('athletic');
  const chestWidthFactor = kind === 'male' ? 0.82 : 0.74;
  const hipWidthFactor = kind === 'female' ? 0.58 : 0.48;
  const plusFactor = isPlus ? 1.08 : 1;
  const athleticShoulders = athletic ? 1.05 : 1;
  const childFactor = kind === 'child' ? 0.86 : 1;

  group.add(createNamedMesh('body-torso', createTorsoGeometry({
    centerX,
    centerZ,
    chestY: chest.y,
    chestWidth: shoulderWidth * chestWidthFactor * plusFactor,
    depth: depth * (kind === 'male' ? 1.06 : 0.98) * plusFactor,
    hipY: hip.y,
    hipWidth: shoulderWidth * hipWidthFactor * plusFactor,
    neckY: neck.y,
    shoulderY: (leftShoulder.y + rightShoulder.y) / 2,
    shoulderWidth: shoulderWidth * athleticShoulders,
    waistY: waist.y,
    waistWidth: shoulderWidth * (isPlus ? 0.54 : 0.42),
  })));

  const headCenter = new THREE.Vector3(centerX, neck.y + shoulderWidth * 0.24 * childFactor, centerZ + depth * 0.02);
  group.add(createEllipsoidMesh(
    'body-head',
    headCenter,
    new THREE.Vector3(shoulderWidth * 0.115, shoulderWidth * 0.145, shoulderWidth * 0.105),
  ));
  group.add(createCapsuleBetween(
    'body-neck',
    new THREE.Vector3(centerX, neck.y - shoulderWidth * 0.03, centerZ),
    new THREE.Vector3(centerX, neck.y + shoulderWidth * 0.085, centerZ),
    { start: shoulderWidth * 0.06, end: shoulderWidth * 0.055 },
    18,
  ));

  const armTop = shoulderWidth * (kind === 'male' ? 0.075 : 0.062) * (athletic ? 1.08 : 1);
  const armLow = armTop * 0.74;
  const wristRadius = armTop * 0.54;
  group.add(createCapsuleBetween('body-left-upper-arm', leftShoulder, leftElbow, { start: armTop, end: armLow }));
  group.add(createCapsuleBetween('body-left-lower-arm', leftElbow, leftWrist, { start: armLow, end: wristRadius }));
  group.add(createCapsuleBetween('body-right-upper-arm', rightShoulder, rightElbow, { start: armTop, end: armLow }));
  group.add(createCapsuleBetween('body-right-lower-arm', rightElbow, rightWrist, { start: armLow, end: wristRadius }));
  group.add(createEllipsoidMesh('body-left-hand', leftWrist.clone().add(new THREE.Vector3(-armTop * 0.55, 0, depth * 0.12)), new THREE.Vector3(armTop * 0.75, armTop * 0.28, armTop * 0.42)));
  group.add(createEllipsoidMesh('body-right-hand', rightWrist.clone().add(new THREE.Vector3(armTop * 0.55, 0, depth * 0.12)), new THREE.Vector3(armTop * 0.75, armTop * 0.28, armTop * 0.42)));

  const legTop = shoulderWidth * (kind === 'male' ? 0.09 : 0.082) * plusFactor;
  const kneeRadius = legTop * 0.72;
  const ankleRadius = legTop * 0.48;
  group.add(createCapsuleBetween('body-left-upper-leg', leftThigh, leftKnee, { start: legTop, end: kneeRadius }));
  group.add(createCapsuleBetween('body-left-lower-leg', leftKnee, leftAnkle, { start: kneeRadius, end: ankleRadius }));
  group.add(createCapsuleBetween('body-right-upper-leg', rightThigh, rightKnee, { start: legTop, end: kneeRadius }));
  group.add(createCapsuleBetween('body-right-lower-leg', rightKnee, rightAnkle, { start: kneeRadius, end: ankleRadius }));
  group.add(createEllipsoidMesh('body-left-foot', midpoint(leftAnkle, leftFoot), new THREE.Vector3(ankleRadius * 0.85, ankleRadius * 0.34, ankleRadius * 1.85)));
  group.add(createEllipsoidMesh('body-right-foot', midpoint(rightAnkle, rightFoot), new THREE.Vector3(ankleRadius * 0.85, ankleRadius * 0.34, ankleRadius * 1.85)));

  group.userData = {
    bodyTemplateId: bodyProfile.bodyTemplateId,
    isProceduralMannequin: true,
  };
  return group;
}
