import type {Side,StudioDocument} from './studio-document';

/** WCAG relative luminance over opaque RGB colors; never used as proof of print calibration. */
export function relativeLuminance(hex:string):number{
 if(!/^#[0-9a-fA-F]{6}$/.test(hex))throw Error('Invalid artwork color');
 const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);
 const linear=c.map(value=>value<=0.04045?value/12.92:Math.pow((value+0.055)/1.055,2.4));
 return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
}
export function contrastRatio(foreground:string,background:string):number{
 const [a,b]=[relativeLuminance(foreground),relativeLuminance(background)];
 return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}
export function legibleInk(background:string):string{
 return contrastRatio('#191a1c',background)>=contrastRatio('#faf8f2',background)?'#191a1c':'#faf8f2';
}
export type ArtworkVisibilityWarning={
 side:Side;layerId:string;ratio:number;recommended:string;message:string;
};
/** Deliberate creative color choices are reported, not silently replaced. */
export function analyzeArtworkVisibility(doc:StudioDocument,minContrast=4.5):ArtworkVisibilityWarning[]{
 const warnings:ArtworkVisibilityWarning[]=[];
 for(const side of ['front','back'] as const){
  for(const layer of doc.layers[side]){
   if(layer.kind!=='text'||layer.hidden||!layer.value.trim())continue;
   const ratio=contrastRatio(layer.color,doc.baseColor);
   if(ratio>=minContrast)continue;
   warnings.push({side,layerId:layer.id,ratio,recommended:legibleInk(doc.baseColor),
    message:'Text has low contrast against the garment. Choose a brighter/darker ink or use Fix text visibility.'});
  }
 }
 return warnings;
}
/** Explicit repair; keeps all positions, images, strokes, and locked colors unchanged. */
export function fixArtworkVisibility(doc:StudioDocument):{document:StudioDocument;changed:number}{
 const next:StudioDocument={...doc,layers:{front:doc.layers.front.map(layer=>({...layer,points:layer.points?.slice()})),back:doc.layers.back.map(layer=>({...layer,points:layer.points?.slice()}))},brief:{...doc.brief}};
 let changed=0;
 for(const warning of analyzeArtworkVisibility(next)){
  const layer=next.layers[warning.side].find(l=>l.id===warning.layerId);
  if(!layer||layer.locked)continue;
  layer.color=warning.recommended;
  changed++;
 }
 return {document:next,changed};
}
