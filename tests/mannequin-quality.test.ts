import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {mannequinHead,mannequinTorso,mannequinArm,mannequinLeg,mannequinExposedArm,makeSmoothLimb} from '../lib/mannequin-mesh';

function validate(geometry:THREE.BufferGeometry){
 const p=geometry.getAttribute('position'),n=geometry.getAttribute('normal'),uv=geometry.getAttribute('uv');
 expect(p.count).toBeGreaterThan(50);
 expect(n.count).toBe(p.count);expect(uv.count).toBe(p.count);
 for(let i=0;i<p.count;i++)expect([p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)].every(Number.isFinite)).toBe(true);
 expect(geometry.boundingBox).toBeTruthy();
}

describe('new mannequin display surface',()=>{
 it('uses human-like head-to-body proportions without becoming an anatomical measurement claim',()=>{
  const head=mannequinHead(),legs=[mannequinLeg(-1),mannequinLeg(1)],torso=mannequinTorso();
  for(const mesh of [head,torso,...legs])validate(mesh);
  const ratio=(head.boundingBox!.max.y-legs[0].boundingBox!.min.y)/(head.boundingBox!.max.y-head.boundingBox!.min.y);
  expect(ratio).toBeGreaterThan(6.8);
  expect(ratio).toBeLessThan(8.5);
  expect(head.boundingBox!.max.x).toBeLessThan(torso.boundingBox!.max.x*.5);
  for(const mesh of [head,torso,...legs])mesh.dispose();
 });
 it('has smooth matching normals across every duplicated UV seam',()=>{
  const geo=mannequinHead(),normal=geo.getAttribute('normal'),radial=40,segments=36;
  for(let row=0;row<=segments;row++){
   const a=row*(radial+1),b=a+radial;
   for(const comp of ['getX','getY','getZ'] as const)
    expect(normal[comp](a)).toBeCloseTo(normal[comp](b),5);
  }
  const index=geo.getIndex()!;
  expect(index.count).toBeGreaterThan(segments*radial*6);
  validate(geo);geo.dispose();
 });
 it('caps body openings and keeps left/right limb extents mirrored',()=>{
  const left=mannequinArm(-1),right=mannequinArm(1);
  validate(left);validate(right);
  expect(Math.abs(left.boundingBox!.min.x)).toBeCloseTo(right.boundingBox!.max.x,2);
  expect(left.boundingBox!.min.y).toBeCloseTo(right.boundingBox!.min.y,2);
  expect(right.boundingBox!.min.y).toBeLessThan(1.01);
  left.dispose();right.dispose();
  const cap=makeSmoothLimb([{x:0,y:1,z:0,radius:.2},{x:0,y:0,z:0,radius:.1}],12,12);
  expect(cap.getAttribute('position').count).toBe((12+1)*(12+1)+2);
  expect(cap.getIndex()!.count).toBe(12*12*6+12*6);
  cap.dispose();
 });
 it('keeps matte forearms clear of sleeves for both clothing lengths',()=>{
  for(const sign of [-1,1] as const){
   const short=mannequinExposedArm(sign,'short');
   const long=mannequinExposedArm(sign,'long');
   expect(short.boundingBox!.max.y).toBeLessThan(1.96);
   expect(long.boundingBox!.max.y).toBeLessThan(1.37);
   expect(short.boundingBox!.min.y).toBeLessThan(1.00);
   validate(short);validate(long);
   short.dispose();long.dispose();
  }
 });
});
