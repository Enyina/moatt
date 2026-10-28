import {describe,it,expect} from 'vitest';
import {FABRIC_PROFILES,fabricHeight,makeFabricTile} from '../lib/fabric-material';

describe('procedural apparel fabric appearance',()=>{
 it('produces deterministic grayscale, opaque tiles with no downloaded assets',()=>{
  for(const kind of ['cotton','denim','satin'] as const){
   const a=makeFabricTile(kind,64),b=makeFabricTile(kind,64);
   expect(a).toEqual(b);
   expect(a).toHaveLength(64*64*4);
   expect(Array.from({length:64*64},(_,i)=>a[i*4+3]).every(x=>x===255)).toBe(true);
   expect(a.some((x,i)=>i%4===0&&x!==a[0])).toBe(true);
  }
 });
 it('makes cotton denim satin measurably different instead of only changing roughness',()=>{
  const tiles=(['cotton','denim','satin'] as const).map(kind=>makeFabricTile(kind,64));
  const signatures=tiles.map(data=>Array.from({length:64*64},(_,i)=>data[i*4]).reduce((sum,n,i)=>sum+(i%7+1)*n,0));
  expect(new Set(signatures).size).toBe(3);
  expect(FABRIC_PROFILES.denim.bumpScale).toBeGreaterThan(FABRIC_PROFILES.cotton.bumpScale);
  expect(FABRIC_PROFILES.satin.roughness).toBeLessThan(FABRIC_PROFILES.cotton.roughness);
  expect(FABRIC_PROFILES.satin.anisotropy).toBeGreaterThan(FABRIC_PROFILES.denim.anisotropy);
 });
 it('keeps sample heights bounded and repeats a deterministic tile period',()=>{
  for(const kind of ['cotton','denim','satin'] as const){
   for(let i=0;i<64;i++){
    expect(fabricHeight(kind,i,19,64)).toBe(fabricHeight(kind,i+64,83,64));
    expect(fabricHeight(kind,i,19,64)).toBeGreaterThanOrEqual(0);
    expect(fabricHeight(kind,i,19,64)).toBeLessThanOrEqual(255);
   }
  }
 });
 it('rejects unsafe tile sizes rather than allocating unbounded canvas memory',()=>{
  expect(()=>makeFabricTile('cotton',8)).toThrow();
  expect(()=>fabricHeight('cotton',1,2,10000)).toThrow();
 });
});
