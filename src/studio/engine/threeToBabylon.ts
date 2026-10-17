import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import type * as THREE from 'three';

export interface ThreeMeshGeometryData {
  indices: number[];
  name: string;
  normals: number[];
  positions: number[];
  userData: Record<string, unknown>;
  uvs: number[];
}

export type BabylonMaterialResolver = (
  source: ThreeMeshGeometryData,
) => StandardMaterial | undefined;

function readBufferAttribute(attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined, itemSize: number): number[] {
  if (!attribute) return [];

  const values: number[] = [];
  for (let i = 0; i < attribute.count; i += 1) {
    for (let item = 0; item < itemSize; item += 1) {
      values.push(attribute.getComponent(i, item));
    }
  }
  return values;
}

function readIndices(geometry: THREE.BufferGeometry, vertexCount: number): number[] {
  const index = geometry.getIndex();
  if (!index) {
    return Array.from({ length: vertexCount }, (_unused, indexValue) => indexValue);
  }

  const indices: number[] = [];
  for (let i = 0; i < index.count; i += 1) {
    indices.push(index.getX(i));
  }
  return indices;
}

export function extractThreeMeshGeometryData(sourceMesh: THREE.Mesh): ThreeMeshGeometryData {
  const geometry = sourceMesh.geometry;
  const position = geometry.getAttribute('position');
  const positions = readBufferAttribute(position, 3);

  return {
    name: sourceMesh.name || sourceMesh.uuid,
    positions,
    normals: readBufferAttribute(geometry.getAttribute('normal'), 3),
    uvs: readBufferAttribute(geometry.getAttribute('uv'), 2),
    indices: readIndices(geometry, position?.count ?? 0),
    userData: { ...sourceMesh.userData },
  };
}

export function createBabylonMeshesFromThreeGroup(
  scene: Scene,
  group: THREE.Group,
  materialResolver: BabylonMaterialResolver = () => undefined,
): Mesh[] {
  const meshes: Mesh[] = [];

  group.traverse((child) => {
    const sourceMesh = child as THREE.Mesh;
    if (!sourceMesh.isMesh) return;

    const geometryData = extractThreeMeshGeometryData(sourceMesh);
    if (geometryData.positions.length === 0) return;

    const mesh = new Mesh(geometryData.name, scene);
    const vertexData = new VertexData();
    vertexData.positions = geometryData.positions;
    vertexData.indices = geometryData.indices;
    if (geometryData.normals.length === geometryData.positions.length) {
      vertexData.normals = geometryData.normals;
    }
    if (geometryData.uvs.length > 0) {
      vertexData.uvs = geometryData.uvs;
    }
    vertexData.applyToMesh(mesh);
    mesh.metadata = {
      source: 'three-procedural',
      sourceName: geometryData.name,
      userData: geometryData.userData,
    };
    const material = materialResolver(geometryData);
    if (material) mesh.material = material;
    meshes.push(mesh);
  });

  return meshes;
}
