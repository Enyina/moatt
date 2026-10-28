import {describe,it,expect} from 'vitest';
import {initialDocument} from '../lib/studio-document';
import {draftFromIdea} from '../lib/design-starter';

describe('credible conventional garment defaults',()=>{
 it('makes a plain hoodie a long-sleeve garment with a pouch and larger legible artwork',()=>{
  const draft=draftFromIdea('Oversized black hoodie with "MIDNIGHT CLUB" on the front',initialDocument());
  const d=draft.document;
  expect(d.garment).toBe('hoodie');
  expect(d.sleeve).toBe('long');
  expect(d.pocket).toBe('kangaroo');
  expect(d.fit).toBe('oversized');
  expect(d.layers.front[0].fontSize).toBeGreaterThanOrEqual(110);
  expect(d.layers.back).toHaveLength(0);
 });
 it('supports explicitly requested nontraditional short sleeve hoodie without a pocket',()=>{
  const d=draftFromIdea('A cream hoodie with short sleeves, no pocket and "DAILY" on the front',initialDocument()).document;
  expect(d.garment).toBe('hoodie');
  expect(d.sleeve).toBe('short');
  expect(d.pocket).toBe('none');
  expect(d.layers.front[0].value).toBe('DAILY');
 });
 it('resets hoodie defaults when new T-shirt concept replaces it but keeps old artwork',()=>{
  const hoodie=draftFromIdea('An oversized black hoodie with "ORIGINAL" in front',initialDocument()).document;
  const tshirt=draftFromIdea('White t-shirt with "SECOND" on the back',hoodie).document;
  expect(tshirt.garment).toBe('tshirt');
  expect(tshirt.sleeve).toBe('short');
  expect(tshirt.pocket).toBe('none');
  expect(tshirt.layers.front[0].value).toBe('ORIGINAL');
  expect(tshirt.layers.back[0].value).toBe('SECOND');
 });
});
