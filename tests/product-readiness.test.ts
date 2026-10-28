import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {initialDocument,decodeDocument,modify} from '../lib/studio-document';
import {loadLibrary,saveToLibrary,openFromLibrary,deleteFromLibrary,LIBRARY_KEY,LIBRARY_LIMIT} from '../lib/design-library';
import {curvedArtworkSurface} from '../lib/garment-surface';
import {createSupplierReviewHtml} from '../lib/supplier-review';

function storage():Storage {
 const map=new Map<string,string>();
 return {length:0,clear(){map.clear()},key(){return null},getItem(k){return map.get(k)??null},setItem(k,v){map.set(k,v)},removeItem(k){map.delete(k)}} as Storage;
}

describe('local wardrobe project library',()=>{
 it('preserves multiple independent editable designs',()=>{
  const browser=storage(),first=initialDocument(),second=initialDocument();
  first.name='First';second.name='Second';
  first.layers.front.push({id:'first-layer',kind:'text',value:'FIRST',x:10,y:20,width:100,height:40,rotation:0,color:'#000000'});
  expect(saveToLibrary(browser,first)).toHaveLength(1);
  expect(saveToLibrary(browser,second)).toHaveLength(2);
  expect(openFromLibrary(browser,first.id).layers.front[0].value).toBe('FIRST');
  expect(openFromLibrary(browser,second.id).layers.front).toHaveLength(0);
  expect(loadLibrary(browser)[0].document.version).toBe(2);
 });
 it('updates instead of duplicating a design and supports delete',()=>{
  const browser=storage(),doc=initialDocument();
  saveToLibrary(browser,doc);doc.name='Renamed';
  expect(saveToLibrary(browser,doc)).toHaveLength(1);
  expect(openFromLibrary(browser,doc.id).name).toBe('Renamed');
  expect(deleteFromLibrary(browser,doc.id)).toHaveLength(0);
  expect(()=>openFromLibrary(browser,doc.id)).toThrow();
 });
 it('does not silently break on damaged entries',()=>{
  const browser=storage();browser.setItem(LIBRARY_KEY,'{broken');
  expect(loadLibrary(browser)).toEqual([]);
  browser.setItem(LIBRARY_KEY,JSON.stringify([{id:'bad',savedAt:'2026-10-01',document:{}}]));
  expect(loadLibrary(browser)).toEqual([]);
 });
 it('keeps the design library bounded',()=>{
  const browser=storage();
  for(let i=0;i<LIBRARY_LIMIT+3;i++){const doc=initialDocument();doc.id='unique-'+i;saveToLibrary(browser,doc);}
  expect(loadLibrary(browser)).toHaveLength(LIBRARY_LIMIT);
 });
 it('propagates quota failures instead of claiming saves worked',()=>{
  const doc=initialDocument();
  expect(()=>saveToLibrary({getItem:()=>null,setItem:()=>{throw Error('Storage full')}},doc)).toThrow('Storage full');
 });
});

describe('user-provided supplier brief',()=>{
 it('migrates older v2 projects with no brief',()=>{
  const doc=initialDocument(),legacy=JSON.parse(JSON.stringify(doc));delete legacy.brief;
  expect(decodeDocument(JSON.stringify(legacy)).brief.brand).toBe('');
 });
 it('preserves notes across save/import without mutating originals',()=>{
  const original=initialDocument();
  const changed=modify(original,d=>{d.brief.brand='Own Label';d.brief.sizingNotes='Sample chest 110cm — must verify';});
  expect(original.brief.brand).toBe('');
  const restored=decodeDocument(JSON.stringify(changed));
  expect(restored.brief.sizingNotes).toContain('110cm');
  expect(createSupplierReviewHtml(restored,'data:image/png;base64,AAAA','data:image/png;base64,AAAA')).toContain('Own Label');
 });
 it('escapes supplier text, truncates unsafe-length notes, disallows script injection',()=>{
  const doc=initialDocument();doc.brief.brand='<img src=x onerror=alert(1)>';
  doc.brief.productionNotes='X'.repeat(3000);
  const restored=decodeDocument(JSON.stringify(doc));
  expect(restored.brief.productionNotes.length).toBe(2000);
  const html=createSupplierReviewHtml(restored,'data:image/png;base64,AAAA','data:image/png;base64,AAAA');
  expect(html).not.toContain('<img src=x');
  expect(html).toContain('&lt;img');
  expect(html).toContain('Not a manufacturing tech pack');
 });
});

describe('3D curved garment artwork panels',()=>{
 it('preserves matching UVs and reverses only the back U axis',()=>{
  const shape=new THREE.Shape();shape.moveTo(-1,-.8);shape.lineTo(1,-.8);shape.lineTo(1,1);shape.lineTo(-1,1);shape.closePath();
  const base=new THREE.ShapeGeometry(shape);
  const front=curvedArtworkSurface(base,1,-.8);
  const back=curvedArtworkSurface(base,1,-.8,true);
  const uf=front.getAttribute('uv'),ub=back.getAttribute('uv');
  expect(uf.count).toBeGreaterThan(20);
  expect(uf.count).toBe(ub.count);
  for(let i=0;i<uf.count;i++){
   expect(uf.getX(i)+ub.getX(i)).toBeCloseTo(1,5);
   expect(uf.getY(i)).toBeCloseTo(ub.getY(i),5);
  }
  const positions=front.getAttribute('position');
  expect(Array.from({length:positions.count},(_,i)=>positions.getZ(i)).some(z=>z>.03)).toBe(true);
  expect(front.boundingBox).not.toBeNull();
  front.dispose();back.dispose();base.dispose();
 });
 it('rejects corrupt preview geometry rather than using it',()=>{
  expect(()=>curvedArtworkSurface(new THREE.BufferGeometry(),1,-.8)).toThrow();
  expect(()=>curvedArtworkSurface(new THREE.BufferGeometry(),0,-.8)).toThrow();
 });
});
