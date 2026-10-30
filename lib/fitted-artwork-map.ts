import type {Side,Garment} from './studio-document';
/** Measured from the pinned GLB chest UV islands. Visual placement only, NOT factory dimensions. */
export type FittedRegion={left:number;right:number;bottom:number;top:number};
export const FITTED_PRINT_REGIONS:Record<Garment,Record<Side,FittedRegion>>={
 hoodie:{front:{left:.49,right:.69,bottom:.115,top:.325},back:{left:.085,right:.28,bottom:.115,top:.325}},
 tshirt:{front:{left:.49,right:.69,bottom:.30,top:.70},back:{left:.085,right:.28,bottom:.29,top:.70}}
};
export function sourceUvToArtwork(garment:Garment,side:Side,u:number,v:number):[number,number]|null{
 const r=FITTED_PRINT_REGIONS[garment][side];
 if(!Number.isFinite(u)||!Number.isFinite(v)||u<=r.left||u>=r.right||v<=r.bottom||v>=r.top)return null;
 return [(u-r.left)/(r.right-r.left),(r.top-v)/(r.top-r.bottom)];
}
export function fittedArtworkShader(garment:Garment):string{
 const a=FITTED_PRINT_REGIONS[garment];
 const f=(n:number)=>n.toFixed(5);
 return [
  'bool front=(vMoattClothPosition.z>0.08 && vMoattClothPosition.y>1.02 && vMoattClothPosition.y<1.38);',
  'bool back=(vMoattClothPosition.z<-.055 && vMoattClothPosition.y>1.02 && vMoattClothPosition.y<1.38);',
  'if(front || back){',
  'vec2 coord=front?vec2((vMoattGarmentUv.x-'+f(a.front.left)+')/'+f(a.front.right-a.front.left)+',('+f(a.front.top)+'-vMoattGarmentUv.y)/'+f(a.front.top-a.front.bottom)+'):',
  'vec2((vMoattGarmentUv.x-'+f(a.back.left)+')/'+f(a.back.right-a.back.left)+',('+f(a.back.top)+'-vMoattGarmentUv.y)/'+f(a.back.top-a.back.bottom)+');',
  'if(coord.x>0.0 && coord.x<1.0 && coord.y>0.0 && coord.y<1.0){',
  'vec4 ink=front?texture2D(moattFrontInk,coord):texture2D(moattBackInk,coord);',
  'diffuseColor.rgb=mix(diffuseColor.rgb,ink.rgb,ink.a);','}','}'
 ].join('\n');
}
