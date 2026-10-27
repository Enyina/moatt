import {describe,it,expect} from 'vitest';
import {initialDocument} from '../lib/studio-document';
import {draftFromIdea} from '../lib/design-starter';
import {createSupplierReviewHtml} from '../lib/supplier-review';

describe('idea to editable garment',()=>{
 it('recognizes garment, fit, fabric, color and independent back text',()=>{
  const base=initialDocument();
  const result=draftFromIdea('Oversized black satin hoodie with "AFTER HOURS" on the back',base);
  expect(result.document.garment).toBe('hoodie');
  expect(result.document.fit).toBe('oversized');
  expect(result.document.material).toBe('satin');
  expect(result.document.baseColor).toBe('#23262a');
  expect(result.document.layers.back[0].value).toBe('AFTER HOURS');
  expect(result.document.layers.front).toHaveLength(0);
  expect(base.layers.back).toHaveLength(0);
 });
 it('does not erase existing artwork and rejects unusable prompts',()=>{
  const base=initialDocument();
  base.layers.front.push({id:'original',kind:'text',value:'KEEP',x:10,y:10,width:100,height:50,rotation:0,color:'#000000'});
  const result=draftFromIdea('A red hoodie with "NEW" on the front',base);
  expect(result.document.layers.front.map(l=>l.value)).toEqual(['KEEP','NEW']);
  expect(()=>draftFromIdea('hood',base)).toThrow();
 });
 it('marks unrecognized construction details for review',()=>{
  const draft=draftFromIdea('An olive hoodie with embroidery and pockets',initialDocument());
  expect(draft.needsReview.some(w=>w.includes('manually'))).toBe(true);
 });
});
describe('supplier review',()=>{
 const png='data:image/png;base64,iVBORw0KGgo=';
 it('escapes project text and labels output as not manufacturing-ready',()=>{
  const doc=initialDocument();doc.name='<script>alert("bad")</script>';
  const html=createSupplierReviewHtml(doc,png,png);
  expect(html).not.toContain('<script>');
  expect(html).toContain('Not a manufacturing tech pack');
  expect(html).toContain('Supplier and designer must confirm');
 });
 it('rejects unexpected image contents',()=>{
  expect(()=>createSupplierReviewHtml(initialDocument(),'javascript:alert(1)',png)).toThrow();
 });
});
