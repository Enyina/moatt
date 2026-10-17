import {describe,it,expect} from 'vitest';
import {decodeDocument,initialDocument,modify} from '../lib/studio-document';
describe('Studio document',()=>{
 it('accepts fresh schema with independent sides',()=>{const d=initialDocument();expect(decodeDocument(JSON.stringify(d)).layers).toEqual({front:[],back:[]})});
 it('migrates version one text designs',()=>{const x=decodeDocument(JSON.stringify({version:1,garment:'tshirt',fit:'oversized',name:'Legacy',baseColor:'#000000',artwork:{front:'HELLO',back:'WORLD'}}));expect(x.version).toBe(2);expect(x.layers.front[0].value).toBe('HELLO');expect(x.layers.back[0].value).toBe('WORLD')});
 it('does not mutate prior document',()=>{const a=initialDocument(),b=modify(a,d=>{d.name='Changed';d.layers.front.push({id:'one',kind:'text',x:1,y:1,width:100,height:90,rotation:0,color:'#000000',value:'Hi'})});expect(a.name).not.toBe(b.name);expect(a.layers.front).toHaveLength(0);expect(b.layers.front).toHaveLength(1)});
 it('rejects untrusted HTML image URLs',()=>{const d=initialDocument();d.layers.front.push({id:'bad',kind:'image',x:10,y:10,width:100,height:100,rotation:0,color:'#000000',value:'javascript:alert(1)'});expect(()=>decodeDocument(JSON.stringify(d))).toThrow('Unsupported image')});
 it('rejects invalid artwork coordinates',()=>{const d=initialDocument();d.layers.back.push({id:'bad',kind:'text',x:Infinity,y:0,width:100,height:100,rotation:0,color:'#000000',value:'X'});expect(()=>decodeDocument(JSON.stringify(d))).toThrow()});
});

describe('Garment construction options',()=>{
 it('round trips garment construction choices',()=>{const d=initialDocument();d.sleeve='long';d.neck='wide';d.hem='cropped';const saved=decodeDocument(JSON.stringify(d));expect([saved.sleeve,saved.neck,saved.hem]).toEqual(['long','wide','cropped'])});
 it('defaults missing construction choices in older v2 documents',()=>{const d=initialDocument();const legacy=JSON.parse(JSON.stringify(d));delete legacy.sleeve;delete legacy.neck;delete legacy.hem;const restored=decodeDocument(JSON.stringify(legacy));expect([restored.sleeve,restored.neck,restored.hem]).toEqual(['short','crew','standard'])});
});

describe('Material appearance preset',()=>{
 it('preserves fabric choice',()=>{const d=initialDocument();d.material='satin';expect(decodeDocument(JSON.stringify(d)).material).toBe('satin')});
 it('defaults older saved designs to cotton',()=>{const d=JSON.parse(JSON.stringify(initialDocument()));delete d.material;expect(decodeDocument(JSON.stringify(d)).material).toBe('cotton')});
});
