import * as THREE from 'three';

export function applyUvRegionByAngle(
  geometry: THREE.BufferGeometry,
  region: { h: number; w: number; x: number; y: number },
): void {
  const position = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  if (!uv) return;

  geometry.computeBoundingBox();
  const bbox = geometry.boundingBox;
  if (!bbox) return;
  const height = Math.max(bbox.max.y - bbox.min.y, 0.001);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    const z = position.getZ(index);
    const angle = Math.atan2(z, x);
    const normalizedAngle = (angle + Math.PI) / (Math.PI * 2);
    const vertical = (y - bbox.min.y) / height;

    uv.setXY(
      index,
      region.x + normalizedAngle * region.w,
      region.y + vertical * region.h,
    );
  }

  uv.needsUpdate = true;
}
