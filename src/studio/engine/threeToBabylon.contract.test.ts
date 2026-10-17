import { NullEngine } from '@babylonjs/core/Engines/nullEngine';
import { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import * as THREE from 'three';
import {
  createBabylonMeshesFromThreeGroup,
  extractThreeMeshGeometryData,
} from './threeToBabylon';

const expectType = <T>(value: T): void => {
  void value;
};

const engine = new NullEngine();
const scene = new Scene(engine);
const material = new StandardMaterial('contract-material', scene);
const geometry = new THREE.BoxGeometry(1, 1, 1);
const sourceMesh = new THREE.Mesh(geometry);
sourceMesh.name = 'contract-three-mesh';
sourceMesh.userData = {
  garmentId: 'contract-garment',
  part: 'front',
};
const group = new THREE.Group();
group.add(sourceMesh);

const extracted = extractThreeMeshGeometryData(sourceMesh);
expectType<string>(extracted.name);
expectType<number[]>(extracted.positions);
expectType<Record<string, unknown>>(extracted.userData);

const converted = createBabylonMeshesFromThreeGroup(scene, group, () => material);
expectType<string>(converted[0].name);
expectType<Record<string, unknown>>(converted[0].metadata);
