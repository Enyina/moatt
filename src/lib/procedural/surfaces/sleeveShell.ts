import * as THREE from 'three';

export interface SleeveShellInput {
  boundaryRing: THREE.Vector3[];
  cuffRadius: number;
  direction: THREE.Vector3;
  length: number;
}

export function createSleeveShellGeometry(input: SleeveShellInput): THREE.BufferGeometry {
  const direction = input.direction.clone().normalize();
  const segments = input.boundaryRing.length;

  const center = new THREE.Vector3();
  for (const v of input.boundaryRing) {
    center.add(v);
  }
  center.divideScalar(segments);

  const rings: THREE.Vector3[][] = [];
  rings.push(input.boundaryRing.map((point) => point.clone()));

  let avgRadius = 0;
  for (const v of input.boundaryRing) {
    avgRadius += v.distanceTo(center);
  }
  avgRadius = Math.max(avgRadius / segments, 0.001);
  const cuffScale = input.cuffRadius / avgRadius;

  const sectionSettings = [
    { distance: 0.14, scale: 0.86 },
    { distance: 0.38, scale: 0.68 },
    { distance: 0.7, scale: THREE.MathUtils.lerp(0.68, cuffScale, 0.62) },
    { distance: 1, scale: cuffScale },
  ];

  for (const section of sectionSettings) {
    const sectionCenter = center.clone().addScaledVector(direction, input.length * section.distance);
    const ring: THREE.Vector3[] = [];

    for (const v of input.boundaryRing) {
      const offset = v.clone().sub(center);
      ring.push(sectionCenter.clone().addScaledVector(offset, section.scale));
    }
    rings.push(ring);
  }

  const cuffCenter = center.clone()
    .addScaledVector(direction, input.length);

  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r < rings.length; r++) {
    const vCoord = r / (rings.length - 1);
    for (let c = 0; c < segments; c++) {
      const pt = rings[r][c];
      positions.push(pt.x, pt.y, pt.z);
      uvs.push(c / segments, vCoord);
    }
  }

  for (let r = 0; r < rings.length - 1; r++) {
    for (let c = 0; c < segments; c++) {
      const nextC = (c + 1) % segments;
      const a = r * segments + c;
      const b = r * segments + nextC;
      const d = (r + 1) * segments + c;
      const e = (r + 1) * segments + nextC;
      
      indices.push(a, d, b, b, d, e);
    }
  }

  const cuffCenterIndex = positions.length / 3;
  positions.push(cuffCenter.x, cuffCenter.y, cuffCenter.z);
  uvs.push(0.5, 1);
  const lastR = rings.length - 1;
  for (let c = 0; c < segments; c++) {
    const nextC = (c + 1) % segments;
    indices.push(cuffCenterIndex, lastR * segments + c, lastR * segments + nextC);
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
