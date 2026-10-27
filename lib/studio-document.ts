/* eslint-disable @typescript-eslint/no-explicit-any -- Boundary parser validates external JSON values before use. */
export type Side = 'front'|'back';
export type Garment = 'tshirt'|'hoodie';
export type Tool = 'select'|'draw'|'erase';
export type Layer = {id:string;kind:'text'|'image'|'stroke';x:number;y:number;width:number;height:number;rotation:number;value:string;color:string;fontSize?:number;points?:number[];hidden?:boolean;locked?:boolean};
export type GarmentBrief={brand:string;targetCustomer:string;fabricComposition:string;fabricWeight:string;sizingNotes:string;constructionNotes:string;productionNotes:string};
export const EMPTY_BRIEF:GarmentBrief={brand:'',targetCustomer:'',fabricComposition:'',fabricWeight:'',sizingNotes:'',constructionNotes:'',productionNotes:''};
export type StudioDocument = {brief:GarmentBrief;pocket:'none'|'chest'|'kangaroo';version:2;material:'cotton'|'denim'|'satin';sleeve:'short'|'long';hem:'standard'|'cropped';neck:'crew'|'wide';id:string;name:string;garment:Garment;fit:'regular'|'oversized';body:'standard'|'tall';baseColor:string;layers:Record<Side,Layer[]>;updatedAt:string};
export const STORAGE_KEY='moatt:studio:v2';
export const uid=()=>typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():Math.random().toString(36).slice(2);
export const initialDocument=():StudioDocument=>({version:2,id:uid(),name:'My clothing design',garment:'tshirt',material:'cotton',sleeve:'short',hem:'standard',neck:'crew',pocket:'none',fit:'regular',body:'standard',baseColor:'#e9dfc9',brief:{...EMPTY_BRIEF},layers:{front:[],back:[]},updatedAt:new Date().toISOString()});
export function decodeDocument(input:string):StudioDocument{
 const raw:unknown=JSON.parse(input);if(!raw||typeof raw!=='object')throw Error('Invalid project');
 const d=raw as Record<string,any>;
 if(d.version===1&&d.garment==='tshirt'){const old=initialDocument();old.name=String(d.name||old.name);old.baseColor=/^#[0-9a-fA-F]{6}$/.test(d.baseColor)?d.baseColor:old.baseColor;old.fit=d.fit==='oversized'?'oversized':'regular';for(const side of ['front','back'] as Side[]){const value=String(d.artwork?.[side]||'');if(value)old.layers[side]=[{id:uid(),kind:'text',x:170,y:360,width:684,height:155,rotation:0,value,color:'#252525',fontSize:92}]}return old;}
 if(d.version!==2||!['tshirt','hoodie'].includes(d.garment)||!['regular','oversized'].includes(d.fit)||!['standard','tall'].includes(d.body)||!/^#[0-9a-fA-F]{6}$/.test(d.baseColor)||typeof d.layers!=='object')throw Error('Unsupported project format');
 const layers={} as Record<Side,Layer[]>;
 const brief={} as GarmentBrief;
 for(const key of Object.keys(EMPTY_BRIEF) as (keyof GarmentBrief)[]){
  const value=d.brief?.[key];
  brief[key]=typeof value==='string'?value.slice(0,2000):'';
 }
 for(const side of ['front','back'] as Side[]){if(!Array.isArray(d.layers[side])||d.layers[side].length>150)throw Error('Invalid layer collection');layers[side]=d.layers[side].map((item:any)=>{if(!item||!['text','image','stroke'].includes(item.kind)||typeof item.value!=='string'||item.value.length>3_000_000||!['x','y','width','height','rotation'].every(k=>Number.isFinite(item[k])&&Math.abs(item[k])<20000))throw Error('Invalid artwork layer');if(item.kind==='image'&&!/^data:image\/(png|jpeg|webp);base64,/.test(item.value))throw Error('Unsupported image');return {id:String(item.id).slice(0,100),kind:item.kind,x:item.x,y:item.y,width:item.width,height:item.height,rotation:item.rotation,value:item.value,color:/^#[0-9a-fA-F]{6}$/.test(item.color)?item.color:'#222222',fontSize:Number.isFinite(item.fontSize)?item.fontSize:90,points:Array.isArray(item.points)?item.points.filter((n:unknown)=>typeof n==='number'&&Number.isFinite(n)).slice(0,15000):undefined,hidden:Boolean(item.hidden),locked:Boolean(item.locked)}})}
 return {version:2,material:['cotton','denim','satin'].includes(d.material)?d.material:'cotton',sleeve:d.sleeve==='long'?'long':'short',hem:d.hem==='cropped'?'cropped':'standard',neck:d.neck==='wide'?'wide':'crew',pocket:['none','chest','kangaroo'].includes(d.pocket)?d.pocket:'none',id:String(d.id||uid()).slice(0,100),name:String(d.name||'Untitled').slice(0,120),garment:d.garment,fit:d.fit,body:d.body,baseColor:d.baseColor,brief,layers,updatedAt:new Date().toISOString()};
}
export function modify(doc:StudioDocument,fn:(copy:StudioDocument)=>void):StudioDocument{const next:StudioDocument={...doc,brief:{...doc.brief},layers:{front:doc.layers.front.map(x=>({...x,points:x.points?.slice()})),back:doc.layers.back.map(x=>({...x,points:x.points?.slice()}))},updatedAt:new Date().toISOString()};fn(next);return next}
export const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
