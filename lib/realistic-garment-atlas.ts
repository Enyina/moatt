import * as THREE from 'three';

/**
 * Experimental artwork adapter for the pinned CC0 MakeHuman T-shirt GLB.
 *
 * The physical-space print rectangle is deliberately explicit: it must be
 * visually calibrated before it can be considered a production print region.
 * No claim of true garment sizing, print dimensions or cloth simulation.
 */
export const FRONT_PRINT_REGION = Object.freeze({
  left: -0.175,
  right: 0.175,
  bottom: 1.125,
  top: 1.365,
  minNormalZ: 0.55,
  minCentroidZ: 0.015,
});
export const GARMENT_ATLAS_SIZE = 1024;

export type RealisticPrintSurface = {
  geometry: THREE.BufferGeometry;
  originalMaterial: THREE.MeshStandardMaterial;
  material: THREE.MeshStandardMaterial;
  atlas: THREE.CanvasTexture;
  canvas: HTMLCanvasElement;
};

type Point = readonly [number, number];

function transformForTriangle(
  src: readonly [Point, Point, Point],
  dst: readonly [Point, Point, Point],
): [number, number, number, number, number, number] | null {
  const sx1 = src[1][0] - src[0][0];
  const sy1 = src[1][1] - src[0][1];
  const sx2 = src[2][0] - src[0][0];
  const sy2 = src[2][1] - src[0][1];
  const dx1 = dst[1][0] - dst[0][0];
  const dy1 = dst[1][1] - dst[0][1];
  const dx2 = dst[2][0] - dst[0][0];
  const dy2 = dst[2][1] - dst[0][1];
  const det = sx1 * sy2 - sx2 * sy1;
  if (Math.abs(det) < 1e-5) return null;
  const a = (dx1 * sy2 - dx2 * sy1) / det;
  const b = (dy1 * sy2 - dy2 * sy1) / det;
  const c = (dx2 * sx1 - dx1 * sx2) / det;
  const d = (dy2 * sx1 - dy1 * sx2) / det;
  const e = dst[0][0] - a * src[0][0] - c * src[0][1];
  const f = dst[0][1] - b * src[0][0] - d * src[0][1];
  return [a, b, c, d, e, f];
}

export function createRealisticPrintSurface(mesh: THREE.Mesh): RealisticPrintSurface | null {
  const base = mesh.material;
  if (Array.isArray(base) || !(base instanceof THREE.MeshStandardMaterial)) return null;
  if (!mesh.geometry?.getAttribute('position') || !mesh.geometry.getAttribute('uv')) return null;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = GARMENT_ATLAS_SIZE;
  const atlas = new THREE.CanvasTexture(canvas);
  // GLTFLoader uses flipY=false. Respect the source texture's UV convention.
  atlas.flipY = base.map?.flipY ?? false;
  atlas.colorSpace = base.map?.colorSpace ?? THREE.SRGBColorSpace;
  atlas.anisotropy = base.map?.anisotropy ?? 1;
  const material = base.clone();
  material.map = atlas;
  // The base garment tint is baked into the atlas, while the artwork retains
  // its exact RGB values rather than being multiplied by a material tint.
  material.color.set('#ffffff');
  mesh.material = material;
  return { geometry: mesh.geometry, originalMaterial: base, material, atlas, canvas };
}

/** Create a high-contrast developer fixture for ?moattUvDebug=1. */
export function createUvCalibrationArtwork(size = GARMENT_ATLAS_SIZE): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  const cell = size / 8;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
    ctx.fillStyle = (x + y) % 2 === 0 ? '#eaff0a' : '#02f4ed';
    ctx.fillRect(x * cell, y * cell, cell, cell);
    ctx.fillStyle = '#171717';
    ctx.font = 'bold 33px sans-serif';
    ctx.fillText(`${x}:${y}`, x * cell + 12, y * cell + 43);
  }
  ctx.fillStyle = '#ff1166';
  ctx.fillRect(0, 0, size * 0.1, size * 0.1);
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText('TOP', size * 0.37, 52);
  ctx.fillText('LEFT', 8, size * 0.51);
  return canvas;
}

/**
 * Rasterize front-facing chest triangles into their native GLB UV atlas.
 * A source-space transform, rather than a guessed rectangular UV bounding box,
 * keeps the print upright as it follows the garment's native UV triangles.
 * All rendering is done in the original rest pose; skinning/morphing subsequently
 * changes geometry without moving its UV coordinates.
 */
export function updateRealisticFrontAtlas(
  surface: RealisticPrintSurface,
  baseColor: string,
  artwork: HTMLCanvasElement,
): number {
  const {canvas, geometry, originalMaterial, atlas} = surface;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D unavailable');
  const {width, height} = canvas;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'source-over';
  ctx.clearRect(0, 0, width, height);
  const sourceMapImage = originalMaterial.map?.image as CanvasImageSource | undefined;
  if (sourceMapImage) ctx.drawImage(sourceMapImage, 0, 0, width, height);
  else {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);
  ctx.globalCompositeOperation = 'source-over';

  const pos = geometry.getAttribute('position');
  const normal = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  const index = geometry.getIndex();
  if (!pos || !uv || !normal) return 0;
  const region = FRONT_PRINT_REGION;
  const getVertex = (i: number): Point => [
    (pos.getX(i) - region.left) / (region.right - region.left) * artwork.width,
    (region.top - pos.getY(i)) / (region.top - region.bottom) * artwork.height,
  ];
  const getUv = (i: number): Point => [
    uv.getX(i) * width,
    (atlas.flipY ? 1 - uv.getY(i) : uv.getY(i)) * height,
  ];
  let applied = 0;
  const total = index?.count ?? pos.count;
  for (let j = 0; j + 2 < total; j += 3) {
    const ids = [index ? index.getX(j) : j, index ? index.getX(j + 1) : j + 1, index ? index.getX(j + 2) : j + 2] as const;
    const centroidX = ids.reduce((sum, i) => sum + pos.getX(i), 0) / 3;
    const centroidY = ids.reduce((sum, i) => sum + pos.getY(i), 0) / 3;
    const centroidZ = ids.reduce((sum, i) => sum + pos.getZ(i), 0) / 3;
    const normalZ = ids.reduce((sum, i) => sum + normal.getZ(i), 0) / 3;
    if (normalZ < region.minNormalZ || centroidZ < region.minCentroidZ) continue;
    if (centroidX < region.left || centroidX > region.right ||
        centroidY < region.bottom || centroidY > region.top) continue;

    const src = ids.map(getVertex) as unknown as [Point, Point, Point];
    const dst = ids.map(getUv) as unknown as [Point, Point, Point];
    const t = transformForTriangle(src, dst);
    if (!t) continue;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(dst[0][0], dst[0][1]);
    ctx.lineTo(dst[1][0], dst[1][1]);
    ctx.lineTo(dst[2][0], dst[2][1]);
    ctx.closePath();
    ctx.clip();
    ctx.setTransform(...t);
    ctx.drawImage(artwork, 0, 0);
    ctx.restore();
    applied++;
  }
  atlas.needsUpdate = true;
  return applied;
}
