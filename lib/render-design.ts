import type {Side,StudioDocument,Layer} from './studio-document';
export const SIZE=1024;
export function drawLayer(ctx:CanvasRenderingContext2D,l:Layer){
 if(l.hidden)return;
 ctx.save();ctx.translate(l.x+l.width/2,l.y+l.height/2);ctx.rotate(l.rotation*Math.PI/180);ctx.translate(-l.width/2,-l.height/2);
 if(l.kind==='text'){ctx.fillStyle=l.color;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold '+Math.max(12,Math.min(l.fontSize||96,320))+'px sans-serif';const lines=l.value.split('\n').slice(0,8);lines.forEach((line,i)=>ctx.fillText(line,l.width/2,l.height/2+(i-(lines.length-1)/2)*(l.fontSize||96)*1.1,l.width));}
 if(l.kind==='stroke'&&l.points?.length){ctx.strokeStyle=l.color;ctx.lineWidth=14;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();for(let i=0;i<l.points.length;i+=2){if(i===0)ctx.moveTo(l.points[i],l.points[i+1]);else ctx.lineTo(l.points[i],l.points[i+1]);}if(l.points.length===2)ctx.lineTo(l.points[0]+.01,l.points[1]);ctx.stroke();}
 ctx.restore();
}
export async function renderArtwork(doc:StudioDocument,side:Side):Promise<HTMLCanvasElement>{
 const canvas=document.createElement('canvas');canvas.width=SIZE;canvas.height=SIZE;const ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas unavailable');
 ctx.fillStyle=doc.baseColor;ctx.fillRect(0,0,SIZE,SIZE);
 for(const l of doc.layers[side]){if(l.hidden)continue;if(l.kind!=='image'){drawLayer(ctx,l);continue}
 const image=new Image();image.src=l.value;try{await image.decode()}catch{continue}ctx.save();ctx.translate(l.x+l.width/2,l.y+l.height/2);ctx.rotate(l.rotation*Math.PI/180);ctx.drawImage(image,-l.width/2,-l.height/2,l.width,l.height);ctx.restore();
 }
 return canvas;
}
export function downloadBlob(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
export async function savePng(canvas:HTMLCanvasElement,name:string){const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG encoding failed');downloadBlob(blob,name);}
