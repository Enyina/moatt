import {describe,it,expect} from 'vitest';
import {initialDocument,decodeDocument,modify,uid} from '../lib/studio-document';
import {draftFromIdea} from '../lib/design-starter';
describe('construction previews and colorway integrity',()=>{
 it('persists selected pocket detail after importing',()=>{
  const doc=initialDocument();doc.garment='hoodie';doc.pocket='kangaroo';
  expect(decodeDocument(JSON.stringify(doc)).pocket).toBe('kangaroo');
 });
 it('defaults older designs with no pockets without inventing construction',()=>{
  const doc=initialDocument();const parsed=JSON.parse(JSON.stringify(doc));delete parsed.pocket;
  expect(decodeDocument(JSON.stringify(parsed)).pocket).toBe('none');
 });
 it('interprets editable pocket details from a written idea',()=>{
  const result=draftFromIdea('An oversized red hoodie with a kangaroo pocket',initialDocument());
  expect(result.document.garment).toBe('hoodie');
  expect(result.document.pocket).toBe('kangaroo');
 });
 it('copies colorways without sharing mutable artwork references',()=>{
  const initial=initialDocument();initial.brief.brand='SAMPLE';
  const copy=modify(initial,d=>{d.id=uid();d.baseColor='#ff2211';d.name='Colorway B';});
  expect(copy.id).not.toBe(initial.id);
  expect(copy.baseColor).toBe('#ff2211');
  expect(initial.baseColor).not.toBe(copy.baseColor);
  copy.brief.brand='CHANGED';
  expect(initial.brief.brand).toBe('SAMPLE');
 });
});
