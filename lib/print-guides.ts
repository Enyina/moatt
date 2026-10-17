import type {Layer,StudioDocument,Side} from './studio-document';
export type PrintIssue={side:Side;layerId:string;severity:'warning'|'error';message:string};
export const ARTBOARD_SIZE=1024;
export const SAFE_REGION={left:180,top:170,right:844,bottom:850};
export function analyzePrintPlacement(doc:StudioDocument):PrintIssue[]{
 const issues:PrintIssue[]=[];
 for(const side of ['front','back'] as Side[]){
  for(const layer of doc.layers[side]){
   if(layer.hidden)continue;
   if(layer.x<0||layer.y<0||layer.x+layer.width>ARTBOARD_SIZE||layer.y+layer.height>ARTBOARD_SIZE){
    issues.push({side,layerId:layer.id,severity:'error',message:'Artwork extends outside the design canvas'});continue;
   }
   if(layer.kind!=='stroke'&&(layer.x<SAFE_REGION.left||layer.y<SAFE_REGION.top||layer.x+layer.width>SAFE_REGION.right||layer.y+layer.height>SAFE_REGION.bottom))
    issues.push({side,layerId:layer.id,severity:'warning',message:'Layer crosses the suggested artwork region'});
   if(layer.kind==='image'&&layer.value.length>2_700_000)issues.push({side,layerId:layer.id,severity:'warning',message:'Large embedded image may exhaust browser storage'});
  }
 }
 return issues;
}
export function isSafeLayer(layer:Layer):boolean{
 return ['text','image','stroke'].includes(layer.kind)&&[layer.x,layer.y,layer.width,layer.height,layer.rotation].every(Number.isFinite)&&layer.width>0&&layer.height>0;
}
