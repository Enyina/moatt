import {describe,it,expect} from 'vitest';
import {fitText,textStyle,FONT_FAMILIES} from '../lib/typography';
import {decodeDocument,initialDocument} from '../lib/studio-document';
import type {Layer} from '../lib/studio-document';

const makeLayer=(value:string):Layer=>({id:'label',kind:'text',x:180,y:180,width:480,height:150,rotation:0,value,color:'#171717',fontSize:94});
function measure(){
 let font='700 94px Arial, sans-serif';
 const ctx={
  get font(){return font;},set font(value:string){font=value;},
  measureText:(value:string)=>({width: value.length*(Number(font.match(/(\d+(?:\.\d+)?)px/)?.[1]||94))*.58})
 };
 return ctx;
}
describe('creative apparel typography',()=>{
 it('preserves legacy bold centered text without external fonts',()=>{
  const style=textStyle(makeLayer('HELLO'));
  expect(style).toMatchObject({family:'sans',weight:'bold',align:'center',spacing:0,leading:1.1});
  expect(Object.keys(FONT_FAMILIES).sort()).toEqual(['display','mono','sans','serif']);
  for(const family of Object.values(FONT_FAMILIES))expect(family).not.toMatch(/https?:\/\//);
 });
 it('wraps long slogans across lines and shrinks the font rather than truncating the wording',()=>{
  const layer=makeLayer('NIGHT SHIFT IS NOT JUST A LABEL IT IS A FULL BRAND STATEMENT');
  layer.width=220;layer.height=140;
  const result=fitText(measure(),layer);
  expect(result.size).toBeLessThan(94);
  expect(result.overflow).toBe(false);
  expect(result.lines.join(' ')).toBe(layer.value);
 });
 it('reports genuinely impossible tiny boxes rather than claiming all text fits',()=>{
  const l=makeLayer('OVERFLOW');
  l.width=1;l.height=1;
  expect(fitText(measure(),l).overflow).toBe(true);
 });
 it('round-trips typography and normalizes untrusted or older document values',()=>{
  const doc=initialDocument();
  const layer=makeLayer('FRONT EDITORIAL');
  Object.assign(layer,{fontFamily:'serif',fontWeight:'regular',textAlign:'right',letterSpacing:6,lineHeight:1.45});
  doc.layers.front.push(layer);
  const next=decodeDocument(JSON.stringify(doc)).layers.front[0];
  expect(next).toMatchObject({fontFamily:'serif',fontWeight:'regular',textAlign:'right',letterSpacing:6,lineHeight:1.45});
  const older=JSON.parse(JSON.stringify(doc));
  for(const field of ['fontFamily','fontWeight','textAlign','letterSpacing','lineHeight'])delete older.layers.front[0][field];
  expect(decodeDocument(JSON.stringify(older)).layers.front[0]).toMatchObject({
   fontFamily:'sans',fontWeight:'bold',textAlign:'center',letterSpacing:0,lineHeight:1.1
  });
  older.layers.front[0].fontFamily='url(https://evil.test/a.woff)';
  older.layers.front[0].fontWeight='900';
  older.layers.front[0].letterSpacing=999;
  older.layers.front[0].lineHeight=-99;
  expect(decodeDocument(JSON.stringify(older)).layers.front[0]).toMatchObject({
   fontFamily:'sans',fontWeight:'bold',letterSpacing:20,lineHeight:.8
  });
 });
});
