import {describe,it,expect} from 'vitest';
import {initialDocument} from '../lib/studio-document';
import {analyzePrintPlacement,SAFE_REGION} from '../lib/print-guides';
describe('Artwork placement diagnostics',()=>{
 it('accepts an empty design',()=>expect(analyzePrintPlacement(initialDocument())).toEqual([]));
 it('reports out of canvas art as an error',()=>{const d=initialDocument();d.layers.front.push({id:'one',kind:'text',x:950,y:20,width:200,height:100,rotation:0,value:'hello',color:'#222222'});expect(analyzePrintPlacement(d)[0]).toMatchObject({side:'front',severity:'error'})});
 it('warns when artwork crosses a suggested design margin',()=>{const d=initialDocument();d.layers.back.push({id:'two',kind:'image',x:10,y:10,width:100,height:100,rotation:0,value:'data:image/png;base64,AA==',color:'#222222'});expect(analyzePrintPlacement(d)[0]).toMatchObject({side:'back',severity:'warning'})});
 it('uses documented inner margins',()=>expect(SAFE_REGION.right-SAFE_REGION.left).toBeGreaterThan(500));
});