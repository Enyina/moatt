export type Side='front'|'back';
export type Fit='regular'|'oversized';
export type Design={version:1;id:string;name:string;garment:'tshirt';fit:Fit;baseColor:string;artwork:Record<Side,string>;updatedAt:string};
export const STORAGE_KEY='moatt:design:v1';
export const newDesign=():Design=>({version:1,id:'local-first-design',name:'Untitled T-shirt',garment:'tshirt',fit:'regular',baseColor:'#e9dfc9',artwork:{front:'',back:''},updatedAt:new Date().toISOString()});
export function parseDesign(raw:string|null):Design|null {if(!raw)return null;try{const v:unknown=JSON.parse(raw);if(!v||typeof v!=='object')return null;const d=v as Partial<Design>;if(d.version!==1||d.garment!=='tshirt'||!['regular','oversized'].includes(d.fit||'')||typeof d.baseColor!=='string'||typeof d.artwork?.front!=='string'||typeof d.artwork?.back!=='string')return null;return {...newDesign(),...d} as Design}catch{return null}}
