import * as THREE from 'three';
import { CrossSection, createCrossSectionRing } from './crossSection';

export interface LoftOptions {
  closeEnds?: boolean;
  flipNormals?: boolean;
}

export function loftSections(sections: CrossSection[], options: LoftOptions = {}): THREE.BufferGeometry {
  if (sections.length < 2) {
    throw new Error('loftSections requires at least two cross sections.');
  }

  const segmentCount = Math.max(...sections.map((section) => section.segments));
  const rings = sections.map((section) => createCrossSectionRing({ ...section, segments: segmentCount }));
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  rings.forEach((ring, row) => {
    const v = row / Math.max(rings.length - 1, 1);
    ring.forEach((point, column) => {
      positions.push(point.x, point.y, point.z);
      uvs.push(column / segmentCount, v);
    });
  });

  for (let row = 0; row < rings.length - 1; row += 1) {
    for (let column = 0; column < segmentCount; column += 1) {
      const nextColumn = (column + 1) % segmentCount;
      const a = row * segmentCount + column;
      const b = row * segmentCount + nextColumn;
      const c = (row + 1) * segmentCount + column;
      const d = (row + 1) * segmentCount + nextColumn;

      if (options.flipNormals) {
        indices.push(a, c, b, b, c, d);
      } else {
        indices.push(a, b, c, b, d, c);
      }
    }
  }

  if (options.closeEnds) {
    const firstCenter = sections[0].center;
    const lastCenter = sections[sections.length - 1].center;
    const firstCenterIndex = positions.length / 3;
    positions.push(firstCenter.x, firstCenter.y, firstCenter.z);
    uvs.push(0.5, 0);
    const lastCenterIndex = firstCenterIndex + 1;
    positions.push(lastCenter.x, lastCenter.y, lastCenter.z);
    uvs.push(0.5, 1);

    for (let column = 0; column < segmentCount; column += 1) {
      const nextColumn = (column + 1) % segmentCount;
      indices.push(firstCenterIndex, nextColumn, column);
      const base = (rings.length - 1) * segmentCount;
      indices.push(lastCenterIndex, base + column, base + nextColumn);
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
