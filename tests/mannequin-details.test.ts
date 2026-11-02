import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {mannequinFoot,mannequinFingers,mannequinArm} from '../lib/mannequin-mesh';
const dims=(g:THREE.BufferGeometry)=>{g.computeBoundingBox();return g.boundingBox!};
describe('mannequin detailed hands and feet',()=>{
 it('uses a continuous tapered toe rather than a sphere at both ankles',()=>{
  const left=mannequinFoot(-1),right=mannequinFoot(1);
  const L=dims(left),R=dims(right);
  expect(L.min.z).toBeLessThan(.08);
  expect(L.max.z).toBeGreaterThan(.50);
  expect(L.min.y).toBeLessThan(-.33);
  expect(Math.abs(L.min.x)).toBeCloseTo(R.max.x,2);
  expect(L.max.y).toBeGreaterThan(-.2);
  for(const g of [left,right]){
   const pos=g.getAttribute('position'),uv=g.getAttribute('uv'),norm=g.getAttribute('normal');
   expect(g.getIndex()!.count).toBeGreaterThan(500);
   expect(pos.count).toBe(uv.count);expect(pos.count).toBe(norm.count);
   for(let i=0;i<pos.count;i++)expect([pos.getX(i),pos.getY(i),pos.getZ(i),norm.getX(i),norm.getY(i),norm.getZ(i)].every(Number.isFinite)).toBe(true);
   g.dispose();
  }
 });
 it('creates five asymmetrically tapered hand digits per hand with no invalid mesh',()=>{
  for(const sign of [-1,1] as const){
   const pieces=mannequinFingers(sign),arm=mannequinArm(sign);
   expect(pieces).toHaveLength(5);
   const bounds=pieces.map(dims);
   expect(Math.min(...bounds.map(b=>b.min.y))).toBeLessThan(.86);
   expect(Math.max(...bounds.map(b=>b.max.y))).toBeGreaterThan(.98);
   expect(bounds[0].max.z).toBeGreaterThan(bounds[1].max.z);
   const armBox=dims(arm);
   expect(bounds[2].max.y).toBeLessThan(armBox.max.y);
   for(const mesh of pieces){
    const pos=mesh.getAttribute('position'),normal=mesh.getAttribute('normal');
    expect(pos.count).toBeGreaterThan(100);
    for(let i=0;i<pos.count;i++)expect([pos.getX(i),pos.getY(i),pos.getZ(i),normal.getX(i),normal.getY(i),normal.getZ(i)].every(Number.isFinite)).toBe(true);
    mesh.dispose();
   }
   arm.dispose();
  }
 });
});
