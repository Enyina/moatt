'use client';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Design, Side, STORAGE_KEY, newDesign, parseDesign } from '../lib/design';

const COLORS=['#e9dfc9','#232f42','#983d40','#588270','#dddde5','#a47fbb'];
function makeArtwork(text:string,background:string){
 const c=document.createElement('canvas');c.width=1024;c.height=1024;
 const ctx=c.getContext('2d')!;ctx.fillStyle=background;ctx.fillRect(0,0,1024,1024);
 ctx.fillStyle=background==='#232f42'?'#ffffff':'#26242a';
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 100px sans-serif';
 const words=text.slice(0,50).split(' ');let rows:string[]=[];let line='';
 for(const word of words){if(ctx.measureText(line+' '+word).width>780&&line){rows.push(line);line=word}else{line+=(line?' ':'')+word}}if(line)rows.push(line);
 rows=rows.slice(0,5);rows.forEach((s,i)=>ctx.fillText(s,512,450+(i-(rows.length-1)/2)*120,800));
 return c;
}
function useArtworkTexture(text:string,color:string){
 const texture=useMemo(()=>{if(typeof document==='undefined')return null;const t=new THREE.CanvasTexture(makeArtwork(text,color));t.colorSpace=THREE.SRGBColorSpace;t.needsUpdate=true;return t},[text,color]);
 useEffect(()=>()=>texture?.dispose(),[texture]);return texture;
}
function Mannequin({design,side}:{design:Design;side:Side}){
 const front=useArtworkTexture(design.artwork.front,design.baseColor);
 const back=useArtworkTexture(design.artwork.back,design.baseColor);
 const skin='#aa8a73';const wide=design.fit==='oversized'?1.16:1;
 const printGeo=useMemo(()=>new THREE.PlaneGeometry(1.45*wide,1.48),[wide]);
 const printMat=useMemo(()=>new THREE.MeshStandardMaterial({map:front,transparent:false,side:THREE.DoubleSide,roughness:.95}),[front]);
 const backMat=useMemo(()=>new THREE.MeshStandardMaterial({map:back,transparent:false,side:THREE.DoubleSide,roughness:.95}),[back]);
 useEffect(()=>()=>{printGeo.dispose();printMat.dispose();backMat.dispose()},[printGeo,printMat,backMat]);
 return <group>
   <mesh position={[0,2.98,0]}><sphereGeometry args={[.25,24,24]}/><meshStandardMaterial color={skin}/></mesh>
   <mesh position={[0,2.49,0]}><cylinderGeometry args={[.12,.13,.4,20]}/><meshStandardMaterial color={skin}/></mesh>
   <mesh position={[0,1.62,0]} scale={[wide,1,1]}><cylinderGeometry args={[.94,.84,1.75,4,1]}/><meshStandardMaterial color={design.baseColor} roughness={.92} side={THREE.DoubleSide}/></mesh>
   {[-1,1].map(sign=><group key={sign}>
      <mesh position={[sign*1.04*wide,2.1,0]} rotation={[0,0,sign*.55]}><cylinderGeometry args={[.39,.33,.81,20]}/><meshStandardMaterial color={design.baseColor} roughness={.95}/></mesh>
      <mesh position={[sign*1.33*wide,1.54,0]} rotation={[0,0,sign*.12]}><cylinderGeometry args={[.14,.15,.56,18]}/><meshStandardMaterial color={skin}/></mesh>
      <mesh position={[sign*.35,.0,0]}><cylinderGeometry args={[.30,.20,1.35,20]}/><meshStandardMaterial color="#46444a"/></mesh>
   </group>)}
   {front&&<mesh position={[0,1.62,.845]} geometry={printGeo} material={printMat}/>}
   {back&&<mesh position={[0,1.62,-.845]} rotation={[0,Math.PI,0]} geometry={printGeo} material={backMat}/>}
 </group>;
}
function CameraSide({side}:{side:Side}){const {camera}=useThree();useEffect(()=>{camera.position.set(0,1.6,side==='front'?6:-6);camera.lookAt(0,1.3,0);camera.updateProjectionMatrix()},[camera,side]);return null}
export default function Studio(){
 const [design,setDesign]=useState<Design>(newDesign);const [side,setSide]=useState<Side>('front');const [hydrated,setHydrated]=useState(false);
 useEffect(()=>{const restored=parseDesign(localStorage.getItem(STORAGE_KEY));if(restored)setDesign(restored);setHydrated(true)},[]);
 useEffect(()=>{if(hydrated)localStorage.setItem(STORAGE_KEY,JSON.stringify(design))},[design,hydrated]);
 const change=(patch:Partial<Design>)=>setDesign(d=>({...d,...patch,updatedAt:new Date().toISOString()}));
 const artwork=(value:string)=>setDesign(d=>({...d,artwork:{...d.artwork,[side]:value},updatedAt:new Date().toISOString()}));
 const download=(name:string,blob:Blob)=>{const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 const exportPng=()=>{const c=makeArtwork(design.artwork[side],design.baseColor);c.toBlob(b=>{if(b)download('moatt-'+side+'.png',b)},'image/png')};
 return <main className="app">
  <header className="header"><div className="brand">MOATT <span style={{fontSize:11,fontWeight:400,letterSpacing:'.08em'}}>STUDIO</span></div><div className="row"><button className="button" onClick={()=>download('moatt-design.json',new Blob([JSON.stringify(design,null,2)],{type:'application/json'}))}>Export project</button><button className="button primary" onClick={exportPng}>Export {side} PNG</button></div></header>
  <aside className="panel">
   <div className="section"><h3>Garment</h3><div className="choice selected">T-shirt — starter template</div><p className="hint">More patterns and garment types are scheduled after editor validation.</p></div>
   <div className="section"><h3>Silhouette</h3><div className="row">{(['regular','oversized'] as const).map(f=><button className={'button '+(design.fit===f?'selected':'')} key={f} onClick={()=>change({fit:f})}>{f}</button>)}</div></div>
   <div className="section"><h3>Fabric color</h3><div className="row">{COLORS.map(c=><button key={c} className="swatch" title={'Set '+c} style={{background:c,outline:design.baseColor===c?'2px solid #f3d48d':undefined}} onClick={()=>change({baseColor:c})}/>)}</div><label className="hint">Custom color <input aria-label="Custom fabric color" type="color" value={design.baseColor} onChange={e=>change({baseColor:e.target.value})}/></label></div>
   <div className="section"><h3>Design tools</h3><p className="hint">Text artwork is applied separately to each garment side. Brush painting and layered graphics are next.</p></div>
  </aside>
  <section className="canvas" aria-label="3D garment preview"><div className="viewtools"><button className={'button '+(side==='front'?'selected':'')} onClick={()=>setSide('front')}>Front</button><button className={'button '+(side==='back'?'selected':'')} onClick={()=>setSide('back')}>Back</button></div>
  <Canvas camera={{position:[0,1.6,6],fov:42}} gl={{preserveDrawingBuffer:false}}><color attach="background" args={['#20242d']}/><ambientLight intensity={1.5}/><directionalLight position={[5,8,7]} intensity={2.3}/><directionalLight position={[-3,2,-4]} intensity={1}/><Mannequin design={design} side={side}/><CameraSide side={side}/><OrbitControls target={[0,1.3,0]} enablePan={false} minDistance={3} maxDistance={10}/><gridHelper args={[10,10,'#555b66','#343a43']} position={[0,-.7,0]}/></Canvas>
  <div className="notice">Drag to rotate · Scroll to zoom · This is a stylized 3D preview, not simulated cloth.</div></section>
  <aside className="panel right"><div className="section"><h3>Design project</h3><input className="field" aria-label="Project name" value={design.name} onChange={e=>change({name:e.target.value})}/><p className="hint">{hydrated?'Saved automatically in this browser':'Loading design…'}</p></div>
   <div className="section"><h3>{side} artwork</h3><div className="control"><label htmlFor="artwork">Text print</label><input className="field" id="artwork" placeholder="Add a slogan or logo text" value={design.artwork[side]} maxLength={50} onChange={e=>artwork(e.target.value)}/><p className="hint">Switch sides to create separate back artwork. Export PNG is a flat print preview, not print-ready UV artwork.</p></div></div>
   <div className="section"><h3>Manage</h3><button className="button" onClick={()=>{if(window.confirm('Reset your saved design?')){setDesign(newDesign());setSide('front')}}}>Reset design</button></div>
  </aside>
 </main>;
}
