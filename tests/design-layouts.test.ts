import {describe,it,expect} from 'vitest';
import {initialDocument} from '../lib/studio-document';
import {applyLayoutPreset,copyLayerToOtherSide,placeLayer} from '../lib/design-layouts';
import {SAFE_REGION,analyzePrintPlacement} from '../lib/print-guides';
import {contrastRatio} from '../lib/artwork-contrast';

describe('independent, editable clothing layout tools',()=>{
 it('generates three distinctly placed editable layouts inside the suggested zone',()=>{
  for(const type of ['chest-mark','center-statement','brand-set'] as const){
   const d=initialDocument();d.baseColor='#191919';
   const result=applyLayoutPreset(d,type);
   const selected=result.document.layers[result.selectedSide].find(l=>l.id===result.selectedId)!;
   expect(selected.kind).toBe('text');
   expect(selected.x).toBeGreaterThanOrEqual(SAFE_REGION.left);
   expect(selected.x+selected.width).toBeLessThanOrEqual(SAFE_REGION.right);
   expect(analyzePrintPlacement(result.document)).toHaveLength(0);
   expect(contrastRatio(selected.color,d.baseColor)).toBeGreaterThan(4.5);
   expect(d.layers.front).toHaveLength(0);expect(d.layers.back).toHaveLength(0);
  }
 });
 it('keeps existing artwork and makes coordinated front/back designs independent',()=>{
  const d=initialDocument();
  const first=applyLayoutPreset(d,'center-statement');
  const second=applyLayoutPreset(first.document,'brand-set');
  expect(second.document.layers.front).toHaveLength(2);
  expect(second.document.layers.back).toHaveLength(1);
  expect(new Set(second.document.layers.front.concat(second.document.layers.back).map(l=>l.id)).size).toBe(3);
  expect(second.document.layers.front[0].value).toBe('MAKE IT YOURS');
  second.document.layers.back[0].value='CHANGED BACK';
  expect(second.document.layers.front[0].value).toBe('MAKE IT YOURS');
 });
 it('places layers without escaping margins and fits oversized graphics proportionally',()=>{
  const img={id:'art',kind:'image' as const,value:'data:image/png;base64,AAA',x:0,y:0,width:950,height:760,rotation:0,color:'#222222'};
  expect(()=>placeLayer(img,'center')).toThrow(/Fit first/);
  const fit=placeLayer(img,'fit');
  expect(fit.width/fit.height).toBeCloseTo(950/760,7);
  expect(fit.x).toBeGreaterThanOrEqual(SAFE_REGION.left);
  expect(fit.x+fit.width).toBeLessThanOrEqual(SAFE_REGION.right);
  expect(fit.y+fit.height).toBeLessThanOrEqual(SAFE_REGION.bottom);
  for(const method of ['top','center','bottom'] as const){
   const placed=placeLayer({...img,width:100,height:100},method);
   expect(placed.x).toBeCloseTo((SAFE_REGION.left+SAFE_REGION.right)/2-50);
   expect(placed.y).toBeGreaterThanOrEqual(SAFE_REGION.top);
   expect(placed.y+placed.height).toBeLessThanOrEqual(SAFE_REGION.bottom);
  }
 });
 it('preserves opposite-side design and refuses locked or missing layers',()=>{
  const d=applyLayoutPreset(initialDocument(),'chest-mark').document;
  const first=d.layers.front[0];
  const cloned=copyLayerToOtherSide(d,'front',first.id);
  expect(cloned.document.layers.front[0].id).toBe(first.id);
  expect(cloned.document.layers.back[0].id).not.toBe(first.id);
  expect(cloned.document.layers.back[0].value).toBe(first.value);
  cloned.document.layers.back[0].value='New label';
  expect(cloned.document.layers.front[0].value).toBe(first.value);
  expect(()=>copyLayerToOtherSide(d,'front','missing')).toThrow();
  expect(()=>placeLayer({...first,locked:true},'fit')).toThrow(/Unlock/);
  expect(()=>applyLayoutPreset(d,'unknown' as any)).toThrow();
 });
 it('refuses overflowing layers before losing content',()=>{
  const d=initialDocument();
  d.layers.front=Array.from({length:150},(_,i)=>({id:'l'+i,kind:'text' as const,x:200,y:300,width:200,height:100,rotation:0,value:'T',color:'#222222'}));
  expect(()=>applyLayoutPreset(d,'brand-set')).toThrow(/too many layers/);
  expect(d.layers.front).toHaveLength(150);
 });
});
