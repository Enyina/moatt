import {describe,it,expect} from 'vitest';
import {initialDocument} from '../lib/studio-document';
import {findArtworkFocus} from '../lib/presentation-focus';

describe('review zoom uses the original document without moving artwork',()=>{
 it('keeps empty and hidden sides empty',()=>{
  const doc=initialDocument();expect(findArtworkFocus(doc,'front')).toBeNull();
  doc.layers.back.push({id:'hidden',kind:'text',x:200,y:300,width:300,height:100,rotation:0,value:'NOT SHOWN',color:'#000000',hidden:true});
  expect(findArtworkFocus(doc,'back')).toBeNull();
 });
 it('provides a crop around a small chest logo without inventing new positions',()=>{
  const doc=initialDocument();
  doc.layers.front.push({id:'chest',kind:'text',x:340,y:300,width:300,height:90,rotation:0,value:'MOATT',color:'#111111'});
  const before=JSON.stringify(doc);
  const focus=findArtworkFocus(doc,'front')!;
  expect(focus.size).toBeGreaterThanOrEqual(300);
  expect(focus.x).toBeLessThanOrEqual(340);
  expect(focus.x+focus.size).toBeGreaterThanOrEqual(640);
  expect(focus.y).toBeLessThanOrEqual(300);
  expect(focus.y+focus.size).toBeGreaterThanOrEqual(390);
  expect(JSON.stringify(doc)).toBe(before);
 });
 it('encloses rotations and the rest of the visible layers without escaping the canvas',()=>{
  const doc=initialDocument();
  doc.layers.back=[
   {id:'rotated',kind:'text',x:240,y:260,width:320,height:130,rotation:40,value:'ROTATED',color:'#111111'},
   {id:'bottom',kind:'text',x:290,y:670,width:400,height:110,rotation:0,value:'BOTTOM',color:'#111111'}
  ];
  const focus=findArtworkFocus(doc,'back')!;
  expect(focus.x).toBeGreaterThanOrEqual(0);
  expect(focus.y).toBeGreaterThanOrEqual(0);
  expect(focus.x+focus.size).toBeLessThanOrEqual(1024);
  expect(focus.y+focus.size).toBeLessThanOrEqual(1024);
  expect(focus.x+focus.size).toBeGreaterThan(690);
  expect(focus.y+focus.size).toBeGreaterThan(780);
 });
});
