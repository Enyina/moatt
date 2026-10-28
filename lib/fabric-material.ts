/** Deterministic preview-scale fabric microstructure. This is a visual approximation, not a scanned PBR material. */
export type FabricKind='cotton'|'denim'|'satin';
export type FabricProfile={roughness:number;metalness:number;sheen:number;sheenRoughness:number;anisotropy:number;bumpScale:number;tileRepeat:number};
export const FABRIC_PROFILES:Record<FabricKind,FabricProfile>={
 cotton:{roughness:.88,metalness:0,sheen:.24,sheenRoughness:.83,anisotropy:0,bumpScale:.012,tileRepeat:13},
 denim:{roughness:.94,metalness:0,sheen:.12,sheenRoughness:.92,anisotropy:.12,bumpScale:.025,tileRepeat:11},
 satin:{roughness:.29,metalness:0,sheen:.9,sheenRoughness:.24,anisotropy:.76,bumpScale:.003,tileRepeat:14}
};
const fract=(x:number)=>x-Math.floor(x);
const wave=(phase:number)=>Math.sin(phase*Math.PI*2);
const hash=(x:number,y:number)=>fract(wave(x*127.1+y*311.7)*43758.5453123);
/** [0..255] material height for grayscale bump tile: deterministic, tileable and independently testable. */
export function fabricHeight(material:FabricKind,x:number,y:number,size=128):number{
 if(!Number.isInteger(size)||size<16||size>1024)throw Error('Invalid fabric tile size');
 const a=((x%size)+size)%size,b=((y%size)+size)%size;
 const rnd=hash(a%size,b%size);
 if(material==='denim'){
  const diagonal=(a+b*2)%13;
  const twill=diagonal<4?-.8:diagonal<8?.48:-.28;
  return Math.round(Math.min(250,Math.max(15,147+35*twill+20*wave(a/5)+14*(rnd-.5))));
 }
 if(material==='satin'){
  const silk=wave(a/7)*.44+wave(b/27)*.12+(.5-rnd)*.08;
  return Math.round(Math.min(245,Math.max(20,188+29*silk)));
 }
 const warp=wave(a/4),weft=wave(b/4);
 return Math.round(Math.min(245,Math.max(20,175+13*(warp+weft)+18*(rnd-.5))));
}
export function makeFabricTile(material:FabricKind,size=128):Uint8ClampedArray{
 const rgba=new Uint8ClampedArray(size*size*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const height=fabricHeight(material,x,y,size);
  const i=(y*size+x)*4;
  rgba[i]=height;rgba[i+1]=height;rgba[i+2]=height;rgba[i+3]=255;
 }
 return rgba;
}
