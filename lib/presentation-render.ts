import type {Side,StudioDocument} from './studio-document';
import {renderArtwork} from './render-design';
import {makeFabricTile} from './fabric-material';
import {findArtworkFocus} from './presentation-focus';

export const PRESENTATION_WIDTH=2400;
export const PRESENTATION_HEIGHT=1500;
export type PresentationLayout={front:{x:number;y:number;width:number;height:number};back:{x:number;y:number;width:number;height:number}};
export const PRESENTATION_LAYOUT:PresentationLayout={
 front:{x:90,y:280,width:1050,height:1045},
 back:{x:1260,y:280,width:1050,height:1045}
};

type RGB={r:number;g:number;b:number};
function rgb(hex:string):RGB{
 if(!/^#[0-9a-fA-F]{6}$/.test(hex))throw Error('Invalid garment color');
 return {r:parseInt(hex.slice(1,3),16),g:parseInt(hex.slice(3,5),16),b:parseInt(hex.slice(5,7),16)};
}
function blend(c:RGB,f:number):string{
 const mix=(v:number)=>Math.max(0,Math.min(255,Math.round(f>=0?v+(255-v)*f:v*(1+f))));
 return 'rgb('+[mix(c.r),mix(c.g),mix(c.b)].join(',')+')';
}
function label(value:string,max=66){return value.replace(/[\x00-\x1F\x7F]/g,' ').trim().slice(0,max);}
function garmentOutline(doc:StudioDocument):Path2D{
 const path=new Path2D(),isHoodie=doc.garment==='hoodie',oversize=doc.fit==='oversized',long=doc.sleeve==='long';
 const center=350,hem=doc.hem==='cropped'?635:isHoodie?744:711;
 const shoulder=oversize?151:170,bodyLeft=oversize?178:195,bodyRight=700-bodyLeft;
 const leftCuffX=long?55:81,rightCuffX=700-leftCuffX,cuffY=long?574:374;
 const neckLeft=doc.neck==='wide'?275:298,neckRight=700-neckLeft;
 path.moveTo(neckLeft,179);
 path.bezierCurveTo(248,177,shoulder,194,shoulder-30,221);
 path.bezierCurveTo(shoulder-62,257,leftCuffX+20,cuffY-52,leftCuffX,cuffY-19);
 path.quadraticCurveTo(leftCuffX-4,cuffY,leftCuffX+21,cuffY+17);
 path.lineTo(leftCuffX+(long?63:96),cuffY+34);
 path.bezierCurveTo(leftCuffX+(long?90:120),cuffY+27,bodyLeft-28,335,bodyLeft,340);
 path.bezierCurveTo(bodyLeft-12,448,bodyLeft-8,585,bodyLeft-3,hem-27);
 path.quadraticCurveTo(bodyLeft,hem+1,bodyLeft+28,hem+4);
 path.quadraticCurveTo(center,hem+20,bodyRight-28,hem+4);
 path.quadraticCurveTo(bodyRight,hem+1,bodyRight+3,hem-27);
 path.bezierCurveTo(bodyRight+8,585,bodyRight+12,448,bodyRight,340);
 path.bezierCurveTo(bodyRight+28,335,rightCuffX-(long?90:120),cuffY+27,rightCuffX-(long?63:96),cuffY+34);
 path.lineTo(rightCuffX-21,cuffY+17);
 path.quadraticCurveTo(rightCuffX+4,cuffY,rightCuffX,cuffY-19);
 path.bezierCurveTo(rightCuffX-20,cuffY-52,700-shoulder+62,257,700-shoulder+30,221);
 path.bezierCurveTo(700-shoulder,194,452,177,neckRight,179);
 path.bezierCurveTo(neckRight-15,202,center+20,211,center,213);
 path.bezierCurveTo(center-20,211,neckLeft+15,202,neckLeft,179);
 path.closePath();
 return path;
}
function fabricPattern(material:StudioDocument['material']):HTMLCanvasElement{
 const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Fabric canvas unavailable');
 const data=ctx.createImageData(128,128);data.data.set(makeFabricTile(material,128));ctx.putImageData(data,0,0);
 return canvas;
}
function fabricPaint(ctx:CanvasRenderingContext2D,doc:StudioDocument,art:HTMLCanvasElement,side:Side){
 const base=rgb(doc.baseColor),path=garmentOutline(doc);
 ctx.save();
 ctx.shadowColor='rgba(25,26,32,.29)';ctx.shadowBlur=38;ctx.shadowOffsetY=27;
 ctx.fillStyle=blend(base,-.04);ctx.fill(path);ctx.restore();
 ctx.save();ctx.clip(path);
 const light=ctx.createLinearGradient(70,290,640,370);
 light.addColorStop(0,blend(base,-.30));
 light.addColorStop(.15,blend(base,.055));
 light.addColorStop(.34,blend(base,.16));
 light.addColorStop(.54,blend(base,.045));
 light.addColorStop(.74,blend(base,-.04));
 light.addColorStop(.92,blend(base,.025));
 light.addColorStop(1,blend(base,-.29));
 ctx.fillStyle=light;ctx.fillRect(30,160,670,620);
 const fade=ctx.createLinearGradient(0,210,0,785);
 fade.addColorStop(0,'rgba(0,0,0,.15)');fade.addColorStop(.30,'rgba(0,0,0,0)');
 fade.addColorStop(.72,'rgba(0,0,0,.01)');fade.addColorStop(1,'rgba(0,0,0,.18)');
 ctx.fillStyle=fade;ctx.fillRect(0,175,700,630);
 const weave=ctx.createPattern(fabricPattern(doc.material),'repeat');
 if(weave){
  ctx.globalAlpha=doc.material==='denim'?.17:doc.material==='cotton'?.105:.075;
  ctx.globalCompositeOperation='multiply';ctx.fillStyle=weave;ctx.fillRect(0,175,700,630);
  ctx.globalCompositeOperation='source-over';ctx.globalAlpha=1;
 }
 // Narrow, asymmetrical drape lines. Lighting, rather than stripes, should describe the fabric.
 ctx.lineCap='round';
 for(const [x,bend,strength] of [[210,22,.21],[258,-16,.12],[462,18,.11],[504,-17,.17]] as const){
  const shade=ctx.createLinearGradient(x-24,0,x+24,0);
  shade.addColorStop(0,'rgba(0,0,0,0)');shade.addColorStop(.5,'rgba(17,20,27,'+strength+')');shade.addColorStop(1,'rgba(0,0,0,0)');
  ctx.strokeStyle=shade;ctx.lineWidth=26;
  ctx.beginPath();ctx.moveTo(x,310);ctx.bezierCurveTo(x+bend,420,x-16,580,x+bend,723);ctx.stroke();
 }
 // Artwork is intentionally confined to the upper/lower central torso, not stretched over sleeves.
 ctx.save();
 const body=doc.fit==='oversized'?{x:162,y:240,w:376,h:393}:{x:179,y:248,w:342,h:374};
 ctx.beginPath();ctx.rect(body.x,body.y,body.w,body.h);ctx.clip();
 ctx.drawImage(art,body.x,body.y,body.w,body.h);
 ctx.restore();
 // Pocket/collar must sit over the artwork and match the intended garment details.
 ctx.restore();
 ctx.save();
 ctx.strokeStyle=blend(base,-.24);ctx.lineWidth=2.4;ctx.lineCap='round';
 ctx.beginPath();ctx.moveTo(179,342);ctx.bezierCurveTo(142,299,142,241,178,208);ctx.stroke();
 ctx.beginPath();ctx.moveTo(521,342);ctx.bezierCurveTo(558,299,558,241,522,208);ctx.stroke();
 const rib=(y:number,w:number)=>{
  const g=ctx.createLinearGradient(0,y,0,y+24);
  g.addColorStop(0,blend(base,-.12));g.addColorStop(.5,blend(base,.13));g.addColorStop(1,blend(base,-.20));
  ctx.fillStyle=g;ctx.fillRect(350-w/2,y,w,22);
  ctx.strokeStyle=blend(base,-.22);ctx.lineWidth=1;
  for(let x=350-w/2+5;x<350+w/2;x+=7){ctx.beginPath();ctx.moveTo(x,y+4);ctx.lineTo(x,y+19);ctx.stroke();}
 };
 const hem=doc.hem==='cropped'?635:doc.garment==='hoodie'?744:711;
 ctx.save();ctx.beginPath();ctx.rect(170,hem-9,360,37);ctx.clip();rib(hem-9,366);ctx.restore();
 if(doc.garment==='hoodie'){
  ctx.beginPath();ctx.moveTo(253,548);ctx.quadraticCurveTo(350,565,447,548);ctx.lineTo(426,654);
  ctx.quadraticCurveTo(350,670,274,654);ctx.closePath();
  ctx.fillStyle=blend(base,-.065);ctx.fill();ctx.strokeStyle=blend(base,-.28);ctx.lineWidth=3;ctx.stroke();
  ctx.strokeStyle=blend(base,.19);ctx.beginPath();ctx.moveTo(283,558);ctx.lineTo(276,639);ctx.stroke();
  ctx.beginPath();ctx.moveTo(417,558);ctx.lineTo(425,639);ctx.stroke();
 }
 if(doc.pocket==='chest'){
  const px=side==='front'?414:202;
  ctx.fillStyle=blend(base,-.05);ctx.beginPath();ctx.moveTo(px,353);ctx.lineTo(px+66,353);ctx.lineTo(px+60,430);ctx.quadraticCurveTo(px+33,445,px+6,430);ctx.closePath();ctx.fill();
  ctx.strokeStyle=blend(base,-.27);ctx.lineWidth=2;ctx.stroke();
 }
 ctx.restore();
}
function drawHood(ctx:CanvasRenderingContext2D,doc:StudioDocument,side:Side){
 if(doc.garment!=='hoodie')return;
 const c=rgb(doc.baseColor);
 ctx.save();
 ctx.shadowColor='rgba(0,0,0,.18)';ctx.shadowBlur=22;ctx.shadowOffsetY=11;
 ctx.beginPath();
 if(side==='back'){
  ctx.moveTo(245,184);ctx.bezierCurveTo(238,80,284,59,348,56);
  ctx.bezierCurveTo(423,57,463,100,454,184);
  ctx.bezierCurveTo(436,219,398,247,350,253);
  ctx.bezierCurveTo(295,245,262,219,245,184);
 }else{
  ctx.moveTo(270,181);ctx.bezierCurveTo(259,83,293,56,350,47);
  ctx.bezierCurveTo(405,54,443,90,429,181);
  ctx.bezierCurveTo(412,199,386,230,350,237);
  ctx.bezierCurveTo(316,224,291,200,270,181);
 }
 ctx.closePath();
 const gradient=ctx.createLinearGradient(265,78,435,225);
 gradient.addColorStop(0,blend(c,-.24));gradient.addColorStop(.45,blend(c,.1));gradient.addColorStop(1,blend(c,-.26));
 ctx.fillStyle=gradient;ctx.fill();ctx.restore();
 if(side==='front'){
  ctx.strokeStyle=blend(c,-.33);ctx.lineWidth=17;
  ctx.beginPath();ctx.moveTo(287,174);ctx.bezierCurveTo(307,196,393,196,414,174);ctx.stroke();
  ctx.strokeStyle=blend(c,.2);ctx.lineWidth=4;
  for(const x of [325,375]){ctx.beginPath();ctx.moveTo(x,205);ctx.lineTo(x-6,275);ctx.stroke();}
 }else{
  ctx.strokeStyle=blend(c,-.12);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(350,61);ctx.bezierCurveTo(361,107,360,176,350,240);ctx.stroke();
 }
}
function drawMockup(ctx:CanvasRenderingContext2D,doc:StudioDocument,side:Side,art:HTMLCanvasElement,rect:{x:number;y:number;width:number;height:number}){
 ctx.save();ctx.translate(rect.x,rect.y);
 const panel=ctx.createLinearGradient(0,0,rect.width,rect.height);
 panel.addColorStop(0,'#fbfaf7');panel.addColorStop(.5,'#f3f1eb');panel.addColorStop(1,'#e7e5df');
 ctx.fillStyle=panel;ctx.fillRect(0,0,rect.width,rect.height);
 ctx.fillStyle='#aca9a2';ctx.font='500 21px system-ui,sans-serif';
 ctx.fillText(side==='front'?'01 / FRONT VIEW':'02 / BACK VIEW',38,52);
 ctx.save();ctx.translate((rect.width-700)/2,105);
 const shadow=ctx.createRadialGradient(350,800,30,350,800,280);
 shadow.addColorStop(0,'rgba(30,30,40,.14)');shadow.addColorStop(1,'rgba(30,30,40,0)');
 ctx.fillStyle=shadow;ctx.fillRect(60,730,580,170);
 drawHood(ctx,doc,side);fabricPaint(ctx,doc,art,side);
 ctx.restore();
 ctx.strokeStyle='rgba(28,29,33,.12)';ctx.strokeRect(.5,.5,rect.width-1,rect.height-1);
 ctx.restore();
}
export async function renderPresentation(doc:StudioDocument):Promise<HTMLCanvasElement>{
 const [front,back]=await Promise.all([renderArtwork(doc,'front',true),renderArtwork(doc,'back',true)]);
 const canvas=document.createElement('canvas');canvas.width=PRESENTATION_WIDTH;canvas.height=PRESENTATION_HEIGHT;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Presentation canvas unavailable');
 ctx.fillStyle='#e9e6e0';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#222329';ctx.font='bold 66px system-ui,sans-serif';ctx.fillText('MOATT',90,124);
 ctx.font='24px system-ui,sans-serif';ctx.fillStyle='#55575e';ctx.fillText('CLOTHING DESIGN STUDIO',90,169);
 ctx.textAlign='right';ctx.fillStyle='#1c1c20';ctx.font='600 37px system-ui,sans-serif';
 ctx.fillText(label(doc.name,52)||'Untitled design',2310,121);
 ctx.fillStyle='#73737a';ctx.font='24px system-ui,sans-serif';
 ctx.fillText('DESIGN CONCEPT  /  '+doc.garment.toUpperCase()+'  /  '+doc.fit.toUpperCase(),2310,165);
 ctx.textAlign='left';
 drawMockup(ctx,doc,'front',front,PRESENTATION_LAYOUT.front);
 drawMockup(ctx,doc,'back',back,PRESENTATION_LAYOUT.back);
 ctx.fillStyle='#27292f';ctx.font='600 28px system-ui,sans-serif';
 ctx.fillText('COLOR STUDY',90,1402);
 ctx.fillStyle=doc.baseColor;ctx.beginPath();ctx.roundRect(300,1371,64,38,7);ctx.fill();
 ctx.fillStyle='#4d4e54';ctx.font='24px system-ui,sans-serif';
 ctx.fillText(doc.baseColor.toUpperCase()+'   /   '+doc.material.toUpperCase()+' APPEARANCE',389,1400);
 ctx.textAlign='right';ctx.fillStyle='#72747a';ctx.font='22px system-ui,sans-serif';
 ctx.fillText('VISUAL CONCEPT · NOT A MANUFACTURING PATTERN',2310,1400);
 ctx.textAlign='left';
 return canvas;
}

/**
 * An honest review board: garment placement at the original derived scale
 * (left), and a magnified crop of the exact same artwork file (right).
 * This is NOT a factory artwork-size or print-safe guarantee.
 */
export async function renderPresentationDetail(doc:StudioDocument,side:Side):Promise<HTMLCanvasElement>{
 const art=await renderArtwork(doc,side,true);
 const canvas=document.createElement('canvas');
 canvas.width=PRESENTATION_WIDTH;canvas.height=PRESENTATION_HEIGHT;
 const ctx=canvas.getContext('2d');if(!ctx)throw Error('Detail canvas unavailable');
 ctx.fillStyle='#e9e6e0';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.fillStyle='#222329';ctx.font='bold 66px system-ui,sans-serif';ctx.fillText('MOATT',90,124);
 ctx.font='24px system-ui,sans-serif';ctx.fillStyle='#55575e';ctx.fillText('DESIGN REVIEW  /  '+side.toUpperCase(),90,169);
 ctx.textAlign='right';ctx.fillStyle='#1c1c20';ctx.font='600 37px system-ui,sans-serif';
 ctx.fillText(label(doc.name,52)||'Untitled design',2310,121);
 ctx.font='24px system-ui,sans-serif';ctx.fillStyle='#73737a';
 ctx.fillText(doc.garment.toUpperCase()+'  /  '+doc.fit.toUpperCase()+'  /  '+doc.baseColor.toUpperCase(),2310,165);
 ctx.textAlign='left';
 drawMockup(ctx,doc,side,art,{x:90,y:280,width:1050,height:1045});
 const px=1260,py=280,pw=1050,ph=1045;
 ctx.fillStyle='#f9f8f4';ctx.fillRect(px,py,pw,ph);
 ctx.fillStyle='#67696e';ctx.font='500 26px system-ui,sans-serif';
 ctx.fillText('02 / MAGNIFIED ARTWORK  ·  '+side.toUpperCase(),px+40,py+62);
 const tileX=px+98,tileY=py+128,tileSize=854;
 ctx.fillStyle=doc.baseColor;ctx.fillRect(tileX,tileY,tileSize,tileSize);
 const focus=findArtworkFocus(doc,side);
 if(focus){
  ctx.save();
  ctx.beginPath();ctx.rect(tileX,tileY,tileSize,tileSize);ctx.clip();
  ctx.drawImage(art,focus.x,focus.y,focus.size,focus.size,tileX,tileY,tileSize,tileSize);
  ctx.restore();
 }else{
  ctx.fillStyle='#55565e';ctx.font='500 31px system-ui,sans-serif';ctx.textAlign='center';
  ctx.fillText('No artwork on this side',tileX+tileSize/2,tileY+tileSize/2);
  ctx.textAlign='left';
 }
 ctx.strokeStyle='rgba(28,29,33,.17)';ctx.strokeRect(tileX+.5,tileY+.5,tileSize-1,tileSize-1);
 ctx.strokeStyle='rgba(28,29,33,.12)';ctx.strokeRect(px+.5,py+.5,pw-1,ph-1);
 ctx.fillStyle='#34353b';ctx.font='600 27px system-ui,sans-serif';
 ctx.fillText('GARMENT PLACEMENT',90,1401);
 ctx.fillText('ARTWORK INSPECTION ONLY',1260,1401);
 ctx.fillStyle='#68696e';ctx.font='21px system-ui,sans-serif';
 ctx.fillText('Image detail is magnified for review, not actual print scale',90,1440);
 ctx.textAlign='right';
 ctx.fillText('MOCKUP · PRINT DIMENSIONS NOT CALIBRATED',2310,1440);
 ctx.textAlign='left';
 return canvas;
}
