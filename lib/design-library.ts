import {decodeDocument} from './studio-document';
import type {StudioDocument} from './studio-document';

export const LIBRARY_KEY='moatt:design-library:v1';
export const LIBRARY_LIMIT=20;

export type LibraryEntry={id:string;name:string;savedAt:string;document:StudioDocument};
type Store=Pick<Storage,'getItem'|'setItem'>;

export function loadLibrary(store:Pick<Storage,'getItem'>):LibraryEntry[]{
 const value=store.getItem(LIBRARY_KEY);
 if(!value)return [];
 let raw:unknown;
 try{raw=JSON.parse(value)}catch{return []}
 if(!Array.isArray(raw))return [];
 const library:LibraryEntry[]=[];
 const unique=new Set<string>();
 for(const value of raw.slice(0,LIBRARY_LIMIT)){
  if(!value||typeof value!=='object')continue;
  const row=value as Record<string,unknown>;
  if(typeof row.id!=='string'||row.id.length<1||row.id.length>100||unique.has(row.id))continue;
  if(typeof row.savedAt!=='string'||!Number.isFinite(Date.parse(row.savedAt)))continue;
  try{
   const document=decodeDocument(JSON.stringify(row.document));
   library.push({id:row.id,name:document.name,savedAt:row.savedAt,document});
   unique.add(row.id);
  }catch{continue}
 }
 return library.sort((a,b)=>b.savedAt.localeCompare(a.savedAt));
}
export function saveToLibrary(store:Store,doc:StudioDocument):LibraryEntry[]{
 const saved=decodeDocument(JSON.stringify(doc));
 const row:LibraryEntry={id:saved.id,name:saved.name,savedAt:new Date().toISOString(),document:saved};
 const previous=loadLibrary(store).filter(item=>item.id!==row.id);
 const next=[row,...previous].slice(0,LIBRARY_LIMIT);
 store.setItem(LIBRARY_KEY,JSON.stringify(next));
 return next;
}
export function deleteFromLibrary(store:Store,id:string):LibraryEntry[]{
 const previous=loadLibrary(store);
 const next=previous.filter(item=>item.id!==id);
 if(next.length===previous.length)throw Error('Saved design was not found');
 store.setItem(LIBRARY_KEY,JSON.stringify(next));
 return next;
}
export function openFromLibrary(store:Pick<Storage,'getItem'>,id:string):StudioDocument{
 const found=loadLibrary(store).find(item=>item.id===id);
 if(!found)throw Error('Saved design was not found');
 return decodeDocument(JSON.stringify(found.document));
}
