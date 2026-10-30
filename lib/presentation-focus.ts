import type {Side,StudioDocument} from './studio-document';

/**
 * Choose a faithful, square crop of the ORIGINAL editable artwork. The crop is
 * only an inspection magnifier; it never changes saved placement or print size.
 * Rotation-aware rectangle envelopes prevent cutting off tilted labels.
 */
export type ArtworkFocus={x:number;y:number;size:number};
export function findArtworkFocus(doc:StudioDocument,side:Side):ArtworkFocus|null{
 const layers=doc.layers[side].filter(layer=>!layer.hidden&&
  (layer.kind!=='text'||Boolean(layer.value.trim()))&&
  layer.width>0&&layer.height>0);
 if(!layers.length)return null;
 let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
 for(const layer of layers){
  const theta=layer.rotation*Math.PI/180;
  const hw=(Math.abs(Math.cos(theta))*layer.width+Math.abs(Math.sin(theta))*layer.height)/2;
  const hh=(Math.abs(Math.sin(theta))*layer.width+Math.abs(Math.cos(theta))*layer.height)/2;
  const cx=layer.x+layer.width/2,cy=layer.y+layer.height/2;
  left=Math.min(left,cx-hw);right=Math.max(right,cx+hw);
  top=Math.min(top,cy-hh);bottom=Math.max(bottom,cy+hh);
 }
 if(![left,right,top,bottom].every(Number.isFinite))return null;
 const span=Math.max(right-left,bottom-top);
 const size=Math.min(1024,Math.max(280,span*1.25));
 const x=Math.max(0,Math.min(1024-size,(left+right-size)/2));
 const y=Math.max(0,Math.min(1024-size,(top+bottom-size)/2));
 return {x,y,size};
}
