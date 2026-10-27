'use client';
import {Component,useEffect,useMemo,useState} from 'react';
import type {ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {Side,StudioDocument} from '../lib/studio-document';
import {renderArtwork} from '../lib/render-design';
import {curvedArtworkSurface} from '../lib/garment-surface';
import {makeFabricTile,FABRIC_PROFILES} from '../lib/fabric-material';
import StudioMannequin from './StudioMannequin';

function useSideTexture(doc:StudioDocument,side:Side){
 const texture=useMemo(()=>{
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;
  const ctx=canvas.getContext('2d');if(ctx){ctx.fillStyle=doc.baseColor;ctx.fillRect(0,0,1024,1024)}
  const next=new THREE.CanvasTexture(canvas);next.colorSpace=THREE.SRGBColorSpace;return next;
 // A single GPU texture per garment side; edit operations update its canvas in place.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{
  let live=true;
  renderArtwork(doc,side).then(result=>{
   if(!live||!texture)return;
   const target=texture.image as HTMLCanvasElement;
   const ctx=target.getContext('2d');
   if(ctx){ctx.clearRect(0,0,target.width,target.height);ctx.drawImage(result,0,0);texture.needsUpdate=true;}
  }).catch(()=>{});
  return()=>{live=false};
 },[doc.layers[side],doc.baseColor,doc.material,side,texture]);
 useEffect(()=>()=>texture?.dispose(),[texture]);
 return texture;
}
function useFabricBump(material:StudioDocument['material']){
 const bump=useMemo(()=>{
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  const image=ctx.createImageData(128,128);image.data.set(makeFabricTile(material));ctx.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
  const repeat=FABRIC_PROFILES[material].tileRepeat;texture.repeat.set(repeat,repeat);
  texture.colorSpace=THREE.NoColorSpace;
  texture.needsUpdate=true;
  return texture;
 },[material]);
 useEffect(()=>()=>bump?.dispose(),[bump]);
 return bump;
}
function garmentGeometry(hoodie:boolean,oversized:boolean,sleeve:'short'|'long',hemStyle:'standard'|'cropped',neck:'crew'|'wide'){
 const w=oversized?1.13:1,hem=hemStyle==='cropped'?-.22:(hoodie?-.55:-.48),n=(neck==='wide'?.43:.31)*w;
 const long=sleeve==='long',cuffY=long?-.50:(hoodie?.37:.51);
 const shape=new THREE.Shape();
 // A continuous curved silhouette, in contrast with the former pointed, flat slab.
 shape.moveTo(-n,.96);
 shape.quadraticCurveTo(-.49*w,.98,-.74*w,.91);
 shape.quadraticCurveTo(-.86*w,.88,-.96*w,.81);
 shape.quadraticCurveTo(-1.14*w,long?.59:.71,-1.32*w,cuffY);
 shape.quadraticCurveTo(-1.39*w,cuffY-.09,-1.21*w,cuffY-.13);
 shape.quadraticCurveTo(-1.05*w,cuffY-.14,-.90*w,.38);
 shape.quadraticCurveTo(-.87*w,-.12,-.84*w,hem+.13);
 shape.quadraticCurveTo(-.85*w,hem,-.72*w,hem);
 shape.quadraticCurveTo(0,hem-.045,.72*w,hem);
 shape.quadraticCurveTo(.85*w,hem,.84*w,hem+.13);
 shape.quadraticCurveTo(.87*w,-.12,.90*w,.38);
 shape.quadraticCurveTo(1.05*w,cuffY-.14,1.21*w,cuffY-.13);
 shape.quadraticCurveTo(1.39*w,cuffY-.09,1.32*w,cuffY);
 shape.quadraticCurveTo(1.14*w,long?.59:.71,.96*w,.81);
 shape.quadraticCurveTo(.86*w,.88,.74*w,.91);
 shape.quadraticCurveTo(.49*w,.98,n,.96);
 shape.quadraticCurveTo(n*.66,.77,0,.76);
 shape.quadraticCurveTo(-n*.66,.77,-n,.96);
 shape.closePath();
 const flat=new THREE.ShapeGeometry(shape,22);
 const pos=flat.getAttribute('position'),uv=flat.getAttribute('uv');
 for(let i=0;i<pos.count;i++){
  const x=pos.getX(i),y=pos.getY(i);
  uv.setXY(i,(x+1.45*w)/(2.9*w),(y-(hem-.045))/(1.08-hem));
 }
 uv.needsUpdate=true;
 const panel=curvedArtworkSurface(flat,w,hem,false,9),backPanel=curvedArtworkSurface(flat,w,hem,true,9);
 flat.dispose();
 const shell=new THREE.ExtrudeGeometry(shape,{depth:.54,steps:1,bevelEnabled:true,bevelSegments:4,bevelSize:.065,bevelThickness:.07,curveSegments:24});
 shell.translate(0,0,-.27);shell.computeVertexNormals();
 return {panel,backPanel,shell};
}
function Garment({doc}:{doc:StudioDocument}){
 const front=useSideTexture(doc,'front'),back=useSideTexture(doc,'back'),bump=useFabricBump(doc.material);
 const geo=useMemo(()=>garmentGeometry(doc.garment==='hoodie',doc.fit==='oversized',doc.sleeve,doc.hem,doc.neck),[doc.fit,doc.garment,doc.sleeve,doc.hem,doc.neck]);
 useEffect(()=>()=>{geo.panel.dispose();geo.backPanel.dispose();geo.shell.dispose()},[geo]);
 const profile=FABRIC_PROFILES[doc.material];
 const appearance={roughness:profile.roughness,metalness:profile.metalness,sheen:profile.sheen,
  sheenColor:new THREE.Color('#ffffff'),sheenRoughness:profile.sheenRoughness,
  anisotropy:profile.anisotropy,bumpMap:bump,bumpScale:profile.bumpScale};
 const frontMat=useMemo(()=>new THREE.MeshPhysicalMaterial({...appearance,color:'#ffffff',map:front,side:THREE.DoubleSide}),
 // Fabric and color are already applied to the CanvasTexture.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [front,bump,doc.material]);
 const backMat=useMemo(()=>new THREE.MeshPhysicalMaterial({...appearance,color:'#ffffff',map:back,side:THREE.DoubleSide}),
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [back,bump,doc.material]);
 const clothMat=useMemo(()=>new THREE.MeshPhysicalMaterial({...appearance,color:doc.baseColor,side:THREE.DoubleSide}),
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [bump,doc.material,doc.baseColor]);
 const seamMat=useMemo(()=>new THREE.MeshStandardMaterial({color:doc.baseColor,roughness:.95}),[doc.baseColor]);
 useEffect(()=>()=>{frontMat.dispose();backMat.dispose();clothMat.dispose();seamMat.dispose()},[frontMat,backMat,clothMat,seamMat]);
 const long=doc.sleeve==='long',hem=doc.hem==='cropped'?-.22:(doc.garment==='hoodie'?-.55:-.48);
 const cuffY=long?-.51:doc.garment==='hoodie'?.36:.50;
 return <group position={[0,1.54,0]} scale={[.65,.91,1]}>
  <mesh geometry={geo.shell} material={clothMat} castShadow receiveShadow/>
  <mesh geometry={geo.panel} position={[0,0,.37]} material={frontMat} castShadow receiveShadow/>
  <mesh geometry={geo.backPanel} rotation={[0,Math.PI,0]} position={[0,0,-.37]} material={backMat} castShadow receiveShadow/>
  {/* Soft finishing bands and seams instead of the exposed mannequin-colored sleeve cylinders. */}
  <mesh position={[0,hem+.075,.33]} material={clothMat} castShadow>
   <boxGeometry args={[1.62*(doc.fit==='oversized'?1.13:1),.12,.09]}/>
  </mesh>
  {([-1,1] as const).map(sign=><group key={sign}>
   <mesh position={[sign*1.28*(doc.fit==='oversized'?1.13:1),cuffY-.075,.05]} rotation={[0,0,sign*(long?.18:.32)]} material={clothMat} castShadow>
    <cylinderGeometry args={[long?.17:.22,long?.16:.20,.19,28]}/>
   </mesh>
  </group>)}
  {doc.pocket==='chest'&&<mesh position={[.37,.39,.53]} material={clothMat} castShadow>
   <boxGeometry args={[.31,.30,.04]}/>
  </mesh>}
  {doc.garment==='hoodie'&&<>
   <mesh position={[0,1.02,-.25]} material={clothMat} castShadow>
    <sphereGeometry args={[.47,40,24,0,Math.PI*2,0,Math.PI*.66]}/>
   </mesh>
   <mesh position={[0,.96,.34]} material={seamMat}>
    <torusGeometry args={[.32,.038,10,40,Math.PI]}/>
   </mesh>
   {([-1,1] as const).map(sign=><mesh key={sign} position={[sign*.19,.49,.56]} material={seamMat}>
    <cylinderGeometry args={[.012,.012,.39,12]}/>
   </mesh>)}
   {doc.pocket==='kangaroo'&&<mesh position={[0,-.27,.56]} material={clothMat} castShadow>
    <boxGeometry args={[.92,.36,.07]}/>
   </mesh>}
  </>}
 </group>;
}
export type ModelStyle='studio'|'classic';
function Mannequin({doc,style}:{doc:StudioDocument;style:ModelStyle}){
 const {gl}=useThree();
 const [asset,setAsset]=useState<THREE.Group|null>(null);
 useEffect(()=>{
  if(style!=='classic'){setAsset(null);return;}
  let live=true;
  new GLTFLoader().load((process.env.NEXT_PUBLIC_BASE_PATH||'')+'/models/mannequin.glb',gltf=>{if(live)setAsset(gltf.scene)},undefined,()=>{if(live)setAsset(null)});
  return()=>{live=false};
 },[style]);
 useEffect(()=>{
  gl.domElement.dataset.mannequinStatus=style==='studio'?'studio-ready':asset?'loaded':'asset-fallback';
  gl.domElement.dataset.fabricMaterial=doc.material;
 },[asset,doc.material,gl,style]);
 const height=doc.body==='tall'?1.09:1;
 return <group scale={[1,height,1]}>
  {style==='classic'&&asset
   ?<primitive object={asset} scale={.56} rotation={[0,-Math.PI/2,0]} position={[0,1.43,0]}/>
   :<StudioMannequin/>}
  <Garment doc={doc}/>
 </group>;
}
function RenderingDiagnostics(){
 const {gl}=useThree();
 const tick=useMemo(()=>({count:0}),[]);
 useFrame(()=>{tick.count++;if(tick.count===1||tick.count%12===0){const canvas=gl.domElement;canvas.dataset.gpuGeometries=String(gl.info.memory.geometries);canvas.dataset.gpuTextures=String(gl.info.memory.textures);}});
 return null;
}
function CameraPosition({side}:{side:Side}){const {camera}=useThree();useEffect(()=>{camera.position.set(0,1.5,side==='front'?6:-6);camera.lookAt(0,1.4,0)},[camera,side]);return null}
class PreviewBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div role="alert" className="empty3d">3D rendering is unavailable. Your artwork is still editable and exportable in 2D.</div>:this.props.children;}
}
export default function GarmentPreview({doc,side,modelStyle='studio'}:{doc:StudioDocument;side:Side;modelStyle?:ModelStyle}){
 const [webgl,setWebgl]=useState<'checking'|'available'|'unavailable'>('checking');
 useEffect(()=>{
  let available=false;
  try{
   const probe=document.createElement('canvas');
   const gl=probe.getContext('webgl2')||probe.getContext('webgl');
   available=Boolean(gl);
   gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }catch{available=false;}
  setWebgl(available?'available':'unavailable');
 },[]);
 if(webgl==='checking')return <div role="status" className="empty3d">Checking 3D support…</div>;
 if(webgl==='unavailable')return <div role="alert" className="empty3d">3D rendering is unavailable. Your artwork is still editable and exportable in 2D.</div>;
 return <PreviewBoundary><Canvas camera={{position:[0,1.65,5.7],fov:41}} gl={{preserveDrawingBuffer:true,antialias:true}} dpr={[1,1.5]}>
 <color attach="background" args={['#292f39']}/>
 <ambientLight intensity={.85}/><hemisphereLight args={['#e6ebff','#30303c',1.2]}/>
 <directionalLight position={[3,6,7]} intensity={2.1} color="#fff2e4"/>
 <directionalLight position={[-4,2,3]} intensity={.9} color="#d4e1ff"/>
 <directionalLight position={[1,5,-4]} intensity={1.6} color="#ffffff"/>
 <Mannequin doc={doc} style={modelStyle}/><CameraPosition side={side}/><RenderingDiagnostics/>
 <OrbitControls target={[0,1.4,0]} minDistance={3} maxDistance={10} enablePan={false}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.06,0]} receiveShadow>
  <circleGeometry args={[4.7,64]}/>
  <meshStandardMaterial color="#343a44" roughness={.96}/>
 </mesh>
 </Canvas></PreviewBoundary>;
}
