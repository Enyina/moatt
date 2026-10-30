import type {Layer,FontFamily,FontWeight,TextAlignment} from './studio-document';

/**
 * Browser-native, local font presets: no external font downloads or licenses.
 * This is an independently implemented typography workflow. Every derived
 * artwork view must call renderArtwork, so font choices cannot drift.
 */
export const FONT_FAMILIES:Readonly<Record<FontFamily,string>>={
 sans:'Arial, Helvetica, sans-serif',
 serif:'Georgia, "Times New Roman", serif',
 display:'Impact, "Arial Narrow", sans-serif',
 mono:'"Courier New", Courier, monospace'
};
export type TextStyle={family:FontFamily;weight:FontWeight;align:TextAlignment;spacing:number;leading:number};
const choices=<T extends string>(candidate:unknown,allowed:readonly T[],fallback:T):T=>
 typeof candidate==='string'&&allowed.includes(candidate as T)?candidate as T:fallback;
export function textStyle(layer:Layer):TextStyle{
 return {
  family:choices(layer.fontFamily,['sans','serif','display','mono'],'sans'),
  weight:choices(layer.fontWeight,['bold','regular'],'bold'),
  align:choices(layer.textAlign,['left','center','right'],'center'),
  spacing:Number.isFinite(layer.letterSpacing)?Math.min(20,Math.max(-3,layer.letterSpacing!)):0,
  leading:Number.isFinite(layer.lineHeight)?Math.min(2,Math.max(.8,layer.lineHeight!)):1.1
 };
}
type Measurer=Pick<CanvasRenderingContext2D,'font'|'measureText'>;
export type FittedText={lines:string[];size:number;overflow:boolean;style:TextStyle};
const chars=(value:string)=>Array.from(value);
function width(ctx:Measurer,s:string,spacing:number):number{
 const glyphs=chars(s);
 if(!glyphs.length)return 0;
 if(spacing===0)return ctx.measureText(s).width;
 return glyphs.reduce((sum,ch)=>sum+ctx.measureText(ch).width,0)+(glyphs.length-1)*spacing;
}
function lineWrap(ctx:Measurer,source:string,maxWidth:number,spacing:number):string[]{
 const out:string[]=[];
 for(const paragraph of source.replace(/\r\n?/g,'\n').split('\n')){
  if(!paragraph){out.push('');continue;}
  let line='';
  for(const word of paragraph.trim().split(/\s+/)){
   if(!word)continue;
   const proposed=line?line+' '+word:word;
   if(width(ctx,proposed,spacing)<=maxWidth){line=proposed;continue;}
   if(line){out.push(line);line='';}
   // Long words also wrap instead of silently shrinking horizontally.
   for(const ch of chars(word)){
    if(line&&width(ctx,line+ch,spacing)>maxWidth){out.push(line);line='';}
    line+=ch;
   }
  }
  out.push(line);
 }
 return out;
}
export function fitText(ctx:Measurer,layer:Layer):FittedText{
 const style=textStyle(layer);
 const maxSize=Math.min(320,Math.max(12,layer.fontSize??96));
 const maxWidth=Math.max(1,layer.width-12);
 const maxHeight=Math.max(1,layer.height-10);
 const renderAt=(size:number)=>{
  ctx.font=(style.weight==='bold'?'700':'400')+' '+size+'px '+FONT_FAMILIES[style.family];
  const lines=lineWrap(ctx,layer.value,maxWidth,style.spacing);
  const height=lines.length*size*style.leading;
  const overWide=lines.some(line=>width(ctx,line,style.spacing)>maxWidth+.1);
  return {lines,size,overflow:height>maxHeight||overWide};
 };
 const initial=renderAt(maxSize);
 if(!initial.overflow)return {...initial,style};
 let lo=12,hi=maxSize,best=renderAt(lo);
 if(best.overflow)return {...best,style};
 for(let i=0;i<10;i++){
  const mid=(lo+hi)/2,candidate=renderAt(mid);
  if(candidate.overflow)hi=mid;
  else{lo=mid;best=candidate;}
 }
 return {...best,style};
}
export function drawFittedText(ctx:CanvasRenderingContext2D,layer:Layer):FittedText{
 const fit=fitText(ctx,layer),{style,lines,size}=fit;
 ctx.save();
 ctx.beginPath();ctx.rect(0,0,layer.width,layer.height);ctx.clip();
 ctx.font=(style.weight==='bold'?'700':'400')+' '+size+'px '+FONT_FAMILIES[style.family];
 ctx.fillStyle=layer.color;ctx.textBaseline='middle';
 const lineHeight=size*style.leading;
 for(let i=0;i<lines.length;i++){
  const line=lines[i];
  const y=layer.height/2+(i-(lines.length-1)/2)*lineHeight;
  const x=style.align==='left'?6:style.align==='right'?layer.width-6:layer.width/2;
  if(!style.spacing){
   ctx.textAlign=style.align;
   ctx.fillText(line,x,y,layer.width-12);
   continue;
  }
  // Per-character placement is stable across browsers without Canvas
  // letterSpacing support, including the mobile fallback.
  ctx.textAlign='left';
  const total=width(ctx,line,style.spacing);
  let pen=style.align==='left'?6:style.align==='right'?layer.width-6-total:layer.width/2-total/2;
  for(const c of chars(line)){ctx.fillText(c,pen,y);pen+=ctx.measureText(c).width+style.spacing;}
 }
 ctx.restore();
 return fit;
}
