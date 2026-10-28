import {describe,expect,it} from 'vitest';
import * as THREE from 'three';
import {createGarmentMesh,disposeGarmentMesh,garmentDimensions,torsoProfile} from '../lib/garment-mesh';
import {makeSmoothLimb,mannequinArm,mannequinHead,mannequinLeg,mannequinTorso} from '../lib/mannequin-mesh';
const tshirt={garment:'tshirt' as const,fit:'regular' as const,sleeve:'short' as const,hem:'standard' as const,neck:'crew' as const};
function xyz(geo:THREE.BufferGeometry){
 const p=geo.getAttribute('position') as THREE.BufferAttribute;
 const x:number[]=[],y:number[]=[],z:number[]=[];
 for(let i=0;i<p.count;i++){x.push(p.getX(i));y.push(p.getY(i));z.push(p.getZ(i));}
 return {x,y,z};
}
function verify(geo:THREE.BufferGeometry){
 const p=geo.getAttribute('position') as THREE.BufferAttribute;
 const uv=geo.getAttribute('uv') as THREE.BufferAttribute;
 const normal=geo.getAttribute('normal') as THREE.BufferAttribute;
 expect(geo.getIndex()).toBeTruthy();
 expect(p.count).toBeGreaterThan(100);
 expect(uv.count).toBe(p.count);expect(normal.count).toBe(p.count);
 expect(geo.boundingBox).toBeTruthy();
 for(let i=0;i<p.count;i++){
  expect([p.getX(i),p.getY(i),p.getZ(i),uv.getX(i),uv.getY(i),normal.getX(i),normal.getY(i),normal.getZ(i)].every(Number.isFinite)).toBe(true);
 }
}
describe('volumetric garment modeling',()=>{
 it('builds continuous rounded torso, sleeves and finishing geometry',()=>{
  const garment=createGarmentMesh(tshirt);
  for(const mesh of [garment.front,garment.back,...garment.sleeves,garment.neckBand,garment.hemBand,...garment.cuffBands])verify(mesh);
  const front=xyz(garment.front),back=xyz(garment.back);
  expect(Math.max(...front.z)).toBeGreaterThan(.3);
  expect(Math.min(...back.z)).toBeLessThan(-.3);
  expect(Math.max(...front.x)-Math.min(...front.x)).toBeGreaterThan(1.5);
  disposeGarmentMesh(garment);
 });
 it('keeps back-side print horizontal direction readable when viewed from behind',()=>{
  const garment=createGarmentMesh(tshirt);
  const front=garment.front.getAttribute('uv') as THREE.BufferAttribute,back=garment.back.getAttribute('uv') as THREE.BufferAttribute;
  const f=garment.front.getAttribute('position') as THREE.BufferAttribute,b=garment.back.getAttribute('position') as THREE.BufferAttribute;
  expect(front.count).toBe(back.count);
  const row=16*25;
  expect(front.getX(row)).toBe(0);expect(back.getX(row)).toBe(0);
  expect(f.getX(row)).toBeLessThan(0);expect(b.getX(row)).toBeGreaterThan(0);
  expect(front.getX(row+24)).toBe(1);expect(back.getX(row+24)).toBe(1);
  disposeGarmentMesh(garment);
 });
 it('has outward normal directions on both front and back at centerline',()=>{
  const mesh=createGarmentMesh(tshirt);
  const center=16*25+12;
  const nf=mesh.front.getAttribute('normal'),nb=mesh.back.getAttribute('normal');
  expect(nf.getZ(center)).toBeGreaterThan(.1);
  expect(nb.getZ(center)).toBeLessThan(-.1);
  disposeGarmentMesh(mesh);
 });
 it('keeps open neck smaller than shoulders and changes shape for width/fit/hem',()=>{
  const slim=torsoProfile(tshirt);
  expect(slim[slim.length-1].rx).toBeLessThan(slim[5].rx*.6);
  const wide=torsoProfile({...tshirt,neck:'wide'});
  expect(wide[wide.length-1].rx).toBeGreaterThan(slim[slim.length-1].rx);
  const loose=torsoProfile({...tshirt,fit:'oversized'});
  expect(loose[5].rx).toBeGreaterThan(slim[5].rx);
  expect(garmentDimensions({...tshirt,hem:'cropped'}).hem).toBeGreaterThan(garmentDimensions(tshirt).hem);
 });
 it('creates longer sleeves with lower, further cuffs and no printable-artwork mutation',()=>{
  const short=createGarmentMesh(tshirt),long=createGarmentMesh({...tshirt,sleeve:'long'});
  const a=short.sleeves[0].boundingBox!,b=long.sleeves[0].boundingBox!;
  expect(b.min.y).toBeLessThan(a.min.y);
  expect(b.min.x).toBeLessThan(a.min.x);
  disposeGarmentMesh(short);disposeGarmentMesh(long);
 });
 it('stays within a predictable geometry budget for mobile previews',()=>{
  const garment=createGarmentMesh({...tshirt,garment:'hoodie',fit:'oversized',sleeve:'long'});
  const sum=[garment.front,garment.back,...garment.sleeves,...garment.cuffBands,garment.hemBand,garment.neckBand].reduce((acc,g)=>acc+g.getAttribute('position').count,0);
  expect(sum).toBeLessThan(9000);
  disposeGarmentMesh(garment);
 });
});
describe('one-piece mannequin',()=>{
 it('uses non-degenerate continuous arms, legs, head, and torso rather than joint spheres',()=>{
  const geometry=[mannequinArm(-1),mannequinArm(1),mannequinLeg(-1),mannequinLeg(1),mannequinTorso(),mannequinHead()];
  for(const mesh of geometry)verify(mesh);
  const x=xyz(geometry[0]).x,y=xyz(geometry[0]).y;
  expect(Math.min(...x)).toBeLessThan(-.8);expect(Math.max(...y)).toBeGreaterThan(2);
  geometry.forEach(m=>m.dispose());
 });
 it('rejects invalid limbs',()=>{
  expect(()=>makeSmoothLimb([])).toThrow();
  expect(()=>makeSmoothLimb([{x:0,y:1,z:0,radius:0},{x:0,y:0,z:0,radius:.1}])).toThrow();
 });
});
