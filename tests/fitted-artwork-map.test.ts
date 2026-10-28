import {describe,it,expect} from 'vitest';
import {sourceUvToArtwork,FITTED_PRINT_REGIONS,fittedArtworkShader} from '../lib/fitted-artwork-map';
describe('licensed garment printing uses continuous native UV islands',()=>{
 it('maps sampled source front mesh chest vertices inside one coherent artboard',()=>{
  const sampled=[ [.6129999757,.2802580595],[.5805000067,.277987063],[.6078000069,.1859096885],[.6097000241,.225341916],[.5770000219,.1847742199] ];
  for(const [u,v] of sampled){const map=sourceUvToArtwork('hoodie','front',u,v);expect(map).not.toBeNull();expect(map![0]).toBeGreaterThan(0);expect(map![0]).toBeLessThan(1);expect(map![1]).toBeGreaterThan(0);expect(map![1]).toBeLessThan(1);}
 });
 it('maps sampled reverse chest points to a distinct back island',()=>{
  const sampled=[ [.1305000037,.2701418996],[.0887999982,.1644387245],[.1281999946,.2062451839],[.123800002,.1161290407] ];
  for(const [u,v] of sampled)expect(sourceUvToArtwork('hoodie','back',u,v)).not.toBeNull();
  expect(sourceUvToArtwork('hoodie','front',.13,.22)).toBeNull();
  expect(sourceUvToArtwork('hoodie','back',.60,.22)).toBeNull();
 });
 it('rejects coordinates outside the relevant print panel rather than painting seams',()=>{
  for(const side of ['front','back'] as const){
   const r=FITTED_PRINT_REGIONS.hoodie[side];
   expect(sourceUvToArtwork('hoodie',side,r.left,r.bottom)).toBeNull();
   expect(sourceUvToArtwork('hoodie',side,NaN,.2)).toBeNull();
   expect(sourceUvToArtwork('hoodie',side,Infinity,.2)).toBeNull();
  }
 });
 it('generates separate front and back sampling with alpha and clip checks',()=>{
  for(const garment of ['hoodie','tshirt'] as const){
   const shader=fittedArtworkShader(garment);
   expect(shader).toContain('vMoattGarmentUv');
   expect(shader).toContain('moattFrontInk');
   expect(shader).toContain('moattBackInk');
   expect(shader).toContain('coord.x>0.0');
   expect(shader).toContain('ink.a');
  }
 });
});
