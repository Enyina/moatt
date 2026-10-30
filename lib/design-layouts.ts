import type {Layer,Side,StudioDocument} from './studio-document';
import {clamp,modify,uid} from './studio-document';
import {legibleInk} from './artwork-contrast';
import {SAFE_REGION} from './print-guides';

/**
 * Original Moatt layout operations, informed by public Printful/Printify/Kittl
 * workflows. Coordinates represent the illustrative 1024px artboard, NOT a
 * printer-specific size or a manufacturer-approved printable region.
 */
export type LayoutPreset='chest-mark'|'center-statement'|'brand-set';
export type LayerPlacement='center'|'top'|'bottom'|'fit';
const centerX=(SAFE_REGION.left+SAFE_REGION.right)/2;
const centerY=(SAFE_REGION.top+SAFE_REGION.bottom)/2;
const safeWidth=SAFE_REGION.right-SAFE_REGION.left;
const safeHeight=SAFE_REGION.bottom-SAFE_REGION.top;
const MAX_LAYERS=150;

function textLayer(value:string,x:number,y:number,width:number,height:number,fontSize:number,color:string):Layer{
 return {id:uid(),kind:'text',x,y,width,height,rotation:0,color,fontSize,value};
}

/** Non-destructive: add editable templates without removing any existing design. */
export function applyLayoutPreset(source:StudioDocument,preset:LayoutPreset):{
 document:StudioDocument;selectedSide:Side;selectedId:string
}{
 if(!['chest-mark','center-statement','brand-set'].includes(preset))throw Error('Unknown layout preset');
 const ink=legibleInk(source.baseColor);
 let selectedSide:Side='front',selectedId='';
 const next=modify(source,doc=>{
  const push=(side:Side,layer:Layer)=>{
   if(doc.layers[side].length>=MAX_LAYERS)throw Error('This garment side has too many layers');
   doc.layers[side].push(layer);
   selectedSide=side;selectedId=layer.id;
  };
  if(preset==='chest-mark'){
   push('front',textLayer('YOUR BRAND',centerX-205,254,410,108,66,ink));
  }else if(preset==='center-statement'){
   push('front',textLayer('MAKE IT YOURS',centerX-310,365,620,166,104,ink));
  }else{
   if(doc.layers.front.length>=MAX_LAYERS||doc.layers.back.length>=MAX_LAYERS)
    throw Error('A garment side has too many layers');
   push('front',textLayer('YOUR BRAND',centerX-208,263,416,104,65,ink));
   push('back',textLayer('YOUR MESSAGE',centerX-310,375,620,180,96,ink));
  }
 });
 return {document:next,selectedSide,selectedId};
}

/** Never mutate a locked layer, and never let a placed layer cross the guide. */
export function placeLayer(layer:Layer,placement:LayerPlacement):Layer{
 if(layer.locked)throw Error('Unlock the layer before moving it');
 if(layer.kind==='stroke')throw Error('Use the drawing tool to reposition brush strokes');
 if(!['center','top','bottom','fit'].includes(placement))throw Error('Unknown placement');
 if(!Number.isFinite(layer.width)||!Number.isFinite(layer.height)||layer.width<=0||layer.height<=0)
  throw Error('Invalid layer dimensions');
 let width=layer.width,height=layer.height;
 let fontSize=layer.fontSize;
 if(placement==='fit'){
  const factor=Math.min(1,safeWidth/width,safeHeight/height);
  width=width*factor;height=height*factor;
  if(layer.kind==='text'&&fontSize!==undefined)fontSize=clamp(fontSize*factor,12,320);
 }
 const x=clamp(centerX-width/2,SAFE_REGION.left,SAFE_REGION.right-width);
 const y=placement==='top'?SAFE_REGION.top:
  placement==='bottom'?SAFE_REGION.bottom-height:
  clamp(centerY-height/2,SAFE_REGION.top,SAFE_REGION.bottom-height);
 // In the non-fit cases, clamp leaves an oversized layer crossing the guide.
 // Refuse instead of misleading users with a "safe" placement.
 if(width>safeWidth||height>safeHeight)
  throw Error('Layer is larger than the suggested region. Choose Fit first.');
 return {...layer,x,y,width,height,fontSize};
}

/** Duplicate only the selected layer; opposite-side artwork remains independent. */
export function copyLayerToOtherSide(doc:StudioDocument,from:Side,id:string):{
 document:StudioDocument;selectedSide:Side;selectedId:string
}{
 const source=doc.layers[from].find(layer=>layer.id===id);
 if(!source)throw Error('Selected layer no longer exists');
 const selectedSide:Side=from==='front'?'back':'front';
 if(doc.layers[selectedSide].length>=MAX_LAYERS)throw Error('Target side has too many layers');
 const layer:Layer={...source,id:uid(),locked:false,points:source.points?.slice()};
 const document=modify(doc,d=>d.layers[selectedSide].push(layer));
 return {document,selectedSide,selectedId:layer.id};
}
