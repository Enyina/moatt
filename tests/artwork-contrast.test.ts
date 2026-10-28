import {describe,expect,it} from 'vitest';
import {initialDocument,modify} from '../lib/studio-document';
import {relativeLuminance,contrastRatio,legibleInk,analyzeArtworkVisibility,fixArtworkVisibility} from '../lib/artwork-contrast';

describe('apparel artwork visibility is a functional requirement',()=>{
 it('calculates real relative contrast, not a hard-coded black-only color case',()=>{
  expect(contrastRatio('#000000','#ffffff')).toBeCloseTo(21,3);
  expect(contrastRatio('#ffffff','#ffffff')).toBeCloseTo(1,3);
  expect(relativeLuminance('#23262a')).toBeLessThan(.03);
  expect(()=>relativeLuminance('rgb(0,0,0)')).toThrow();
 });
 it.each(['#23262a','#25476c','#6a4e88','#3e624a','#be3340','#e9dfc9','#f5f1e9','#efc857','#c66a37'])
 ('chooses minimum 4.5:1 contrast for %s',hex=>{
  expect(contrastRatio(legibleInk(hex),hex)).toBeGreaterThanOrEqual(4.5);
 });
 it('detects weak foreground on real dark textile and suggests a usable light ink',()=>{
  const doc=modify(initialDocument(),d=>{
   d.baseColor='#283650';
   d.layers.front.push({id:'dark',kind:'text',value:'NIGHT SHIFT',color:'#202329',x:200,y:350,width:600,height:150,rotation:0,fontSize:130});
  });
  const issues=analyzeArtworkVisibility(doc);
  expect(issues).toHaveLength(1);
  expect(issues[0].ratio).toBeLessThan(2);
  expect(contrastRatio(issues[0].recommended,doc.baseColor)).toBeGreaterThan(4.5);
 });
 it('fixes editable text on both sides without moving graphics, changing locked inks, or mutating original',()=>{
  const original=modify(initialDocument(),d=>{
   d.baseColor='#283650';
   d.layers.front.push({id:'edit',kind:'text',value:'BRAND',color:'#202329',x:200,y:350,width:600,height:150,rotation:0});
   d.layers.front.push({id:'image',kind:'image',value:'data:image/png;base64,aGVsbG8=',color:'#202329',x:100,y:100,width:20,height:20,rotation:0});
   d.layers.back.push({id:'locked',kind:'text',value:'Keep intentional ink',locked:true,color:'#202329',x:100,y:100,width:80,height:20,rotation:0});
   d.layers.back.push({id:'back',kind:'text',value:'BACK',color:'#202329',x:100,y:100,width:80,height:20,rotation:0});
  });
  const {document,changed}=fixArtworkVisibility(original);
  expect(changed).toBe(2);
  expect(contrastRatio(document.layers.front[0].color,document.baseColor)).toBeGreaterThan(4.5);
  expect(document.layers.front[0].x).toBe(original.layers.front[0].x);
  expect(document.layers.front[1]).toEqual(original.layers.front[1]);
  expect(document.layers.back[0].color).toBe('#202329');
  expect(document.layers.back[1].color).not.toBe('#202329');
  expect(original.layers.front[0].color).toBe('#202329');
 });
 it('does not flag hidden text or artwork images and strokes as text ink problems',()=>{
  const doc=modify(initialDocument(),d=>{
   d.baseColor='#23262a';
   d.layers.front.push({id:'hidden',kind:'text',hidden:true,value:'text',color:'#23262a',x:1,y:1,width:5,height:5,rotation:0});
   d.layers.back.push({id:'stroke',kind:'stroke',value:'',color:'#23262a',x:1,y:1,width:5,height:5,rotation:0,points:[1,1]});
  });
  expect(analyzeArtworkVisibility(doc)).toHaveLength(0);
 });
});
