import * as THREE from 'three';

export function applyPlanarUVProjection(geometry: THREE.BufferGeometry, region: { x: number, y: number, w: number, h: number }) {
  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox!;
  const width = bbox.max.x - bbox.min.x;
  const height = bbox.max.y - bbox.min.y;

  const posAttribute = geometry.attributes.position;
  const uvAttribute = geometry.attributes.uv;
  if (!uvAttribute) return;

  for (let i = 0; i < posAttribute.count; i++) {
    const x = posAttribute.getX(i);
    const y = posAttribute.getY(i);

    // Normalize to 0-1
    let u = (x - bbox.min.x) / width;
    let v = (y - bbox.min.y) / height;

    // Apply region mapping
    u = region.x + u * region.w;
    v = region.y + v * region.h;

    uvAttribute.setXY(i, u, v);
  }
}

export function applyCylinderUVRegion(geometry: THREE.BufferGeometry, region: { x: number, y: number, w: number, h: number }) {
  const uvAttribute = geometry.attributes.uv;
  if (!uvAttribute) return;
  for (let i = 0; i < uvAttribute.count; i++) {
    let u = uvAttribute.getX(i);
    let v = uvAttribute.getY(i);

    u = region.x + u * region.w;
    v = region.y + v * region.h;

    uvAttribute.setXY(i, u, v);
  }
}
