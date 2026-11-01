import {describe,expect,it} from 'vitest';
import {createFoldedHoodGeometry} from '../lib/folded-hood-mesh';

describe('attached hood construction',()=>{
 it('joins the upper-back region to the neckline without floating behind the head',()=>{
  const geo=createFoldedHoodGeometry();
  const b=geo.boundingBox!;
  expect(b.min.y).toBeGreaterThanOrEqual(.60);
  expect(b.max.y).toBeLessThan(.96);
  expect(b.min.z).toBeGreaterThan(-.55);
  expect(b.max.z).toBeLessThan(-.22);
  expect(b.max.x-b.min.x).toBeGreaterThan(.9);
  expect(geo.getIndex()!.count).toBe(4*28*6);
  const p=geo.getAttribute('position'),n=geo.getAttribute('normal');
  expect(p.count).toBe(5*29);
  expect(n.count).toBe(p.count);
  for(let i=0;i<p.count;i++)expect([p.getX(i),p.getY(i),p.getZ(i),n.getX(i),n.getY(i),n.getZ(i)].every(Number.isFinite)).toBe(true);
  geo.dispose();
 });
});
