import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {makeFittedChestPatch,CHEST_PRINT_REGION} from '../lib/fitted-decal';

describe('fitted surface decals',()=>{
 const fixture=()=>new THREE.BoxGeometry(.72,.75,.36,2,2,2).translate(0,CHEST_PRINT_REGION.centerY,0);
 it('samples real front fabric depth rather than mapping through unrelated UV islands',()=>{
  const source=fixture(),patch=makeFittedChestPatch(source,'front');
  expect(patch.coverage).toBeGreaterThan(.99);
  const positions=patch.geometry.getAttribute('position');
  const uv=patch.geometry.getAttribute('uv');
  expect(patch.geometry.index!.count).toBeGreaterThan(2000);
  for(let i=0;i<positions.count;i++){
   expect(positions.getZ(i)).toBeCloseTo(.186,3);
   expect(positions.getX(i)).toBeGreaterThanOrEqual(-.18);
   expect(positions.getX(i)).toBeLessThanOrEqual(.18);
   expect(Number.isFinite(positions.getY(i))).toBe(true);
   expect(uv.getX(i)).toBeGreaterThanOrEqual(0);
   expect(uv.getY(i)).toBeGreaterThanOrEqual(0);
  }
  patch.geometry.dispose();source.dispose();
 });
 it('treats reverse-side print as readable rather than mirrored',()=>{
  const source=fixture(),a=makeFittedChestPatch(source,'front',CHEST_PRINT_REGION,4,4),
   b=makeFittedChestPatch(source,'back',CHEST_PRINT_REGION,4,4);
  const p=b.geometry.getAttribute('position'),v=b.geometry.getAttribute('uv');
  expect(b.coverage).toBe(1);
  expect(p.getZ(0)).toBeCloseTo(-.186,3);
  expect(v.getX(0)).toBe(1);expect(v.getX(4)).toBe(0);
  expect(a.geometry.getAttribute('uv').getX(0)).toBe(0);
  a.geometry.dispose();b.geometry.dispose();source.dispose();
 });
 it('refuses incorrect dimensions, avoids painting through missing fabric triangles',()=>{
  const short=new THREE.PlaneGeometry(.15,.15).translate(0,1.2,0);
  const patch=makeFittedChestPatch(short,'front');
  expect(patch.coverage).toBeLessThan(.65);
  expect(patch.geometry.index!.count).toBe(0);
  expect(()=>makeFittedChestPatch(short,'front',{centerY:1,width:-.3,height:.2})).toThrow();
  expect(()=>makeFittedChestPatch(short,'front',CHEST_PRINT_REGION,500,30)).toThrow();
  patch.geometry.dispose();short.dispose();
 });
});
