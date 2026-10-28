'use client';
import {Component,useEffect,useMemo,useState} from 'react';
import type {ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {Side,StudioDocument} from '../lib/studio-document';
import {renderArtwork} from '../lib/render-design';
import {createGarmentMesh,disposeGarmentMesh} from '../lib/garment-mesh';
import {makeFabricTile,FABRIC_PROFILES} from '../lib/fabric-material';
import StudioMannequin from './StudioMannequin';

function useSideTexture(doc:StudioDocument,side:Side){
 const invalidate=useThree(state=>state.invalidate);
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
   if(ctx){ctx.clearRect(0,0,target.width,target.height);ctx.drawImage(result,0,0);texture.needsUpdate=true;invalidate();}
  }).catch(()=>{});
  return()=>{live=false};
 },[doc.layers[side],doc.baseColor,doc.material,side,texture,invalidate]);
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
function Garment({doc}:{doc:StudioDocument}){
 const {gl}=useThree();
 const front=useSideTexture(doc,'front'),back=useSideTexture(doc,'back'),bump=useFabricBump(doc.material);
 useEffect(()=>{
  gl.domElement.dataset.garmentTopology='volume-torso-sleeves-v1';
  gl.domElement.dataset.garmentKind=doc.garment;
 },[gl,doc.garment]);
 const geo=useMemo(()=>createGarmentMesh({garment:doc.garment,fit:doc.fit,sleeve:doc.sleeve,hem:doc.hem,neck:doc.neck}),[doc.fit,doc.garment,doc.sleeve,doc.hem,doc.neck]);
 useEffect(()=>()=>disposeGarmentMesh(geo),[geo]);
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
 return <group position={[0,1.54,0]} scale={[.68,.94,1]}>
  {/* Rounded front/back torso surfaces, sharing side seams. */}
  <mesh geometry={geo.front} material={frontMat} receiveShadow/>
  <mesh geometry={geo.back} material={backMat} receiveShadow/>
  {geo.sleeves.map((g,i)=><mesh key={'sleeve'+i} geometry={g} material={clothMat} receiveShadow/>)}
  <mesh geometry={geo.neckBand} material={seamMat}/>
  <mesh geometry={geo.hemBand} material={clothMat}/>
  {geo.cuffBands.map((g,i)=><mesh key={'cuff'+i} geometry={g} material={seamMat}/>)}
  {doc.pocket==='chest'&&<mesh position={[.36,.37,.425]} material={clothMat}>
   <boxGeometry args={[.31,.28,.035]}/>
  </mesh>}
  {doc.garment==='hoodie'&&<>
   <mesh position={[0,.99,-.52]} material={clothMat}>
    <sphereGeometry args={[.345,28,20,0,Math.PI*2,0,Math.PI*.59]}/>
   </mesh>
   {([-1,1] as const).map(sign=><mesh key={'drawstring'+sign} position={[sign*.18,.52,.47]} material={seamMat}>
    <cylinderGeometry args={[.012,.012,.43,8]}/>
   </mesh>)}
   {doc.pocket==='kangaroo'&&<mesh position={[0,-.24,.405]} material={clothMat}>
    <boxGeometry args={[.86,.33,.04]}/>
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
 useFrame(()=>{tick.count++;const canvas=gl.domElement;canvas.dataset.renderFrames=String(tick.count);canvas.dataset.gpuGeometries=String(gl.info.memory.geometries);canvas.dataset.gpuTextures=String(gl.info.memory.textures);});
 return null;
}
function CameraPosition({side}:{side:Side}){const {camera,invalidate}=useThree();useEffect(()=>{camera.position.set(0,1.65,side==='front'?5.7:-5.7);camera.lookAt(0,1.55,0);invalidate()},[camera,side,invalidate]);return null}
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
 return <PreviewBoundary><Canvas frameloop="demand" camera={{position:[0,1.65,5.7],fov:41}} gl={{preserveDrawingBuffer:true,antialias:true}} dpr={[1,1.5]}>
 <color attach="background" args={['#292f39']}/>
 <ambientLight intensity={.85}/><hemisphereLight args={['#e6ebff','#30303c',1.2]}/>
 <directionalLight position={[3,6,7]} intensity={2.1} color="#fff2e4"/>
 <directionalLight position={[-4,2,3]} intensity={.9} color="#d4e1ff"/>
 <directionalLight position={[1,5,-4]} intensity={1.6} color="#ffffff"/>
 <Mannequin doc={doc} style={modelStyle}/><CameraPosition side={side}/><RenderingDiagnostics/>
 <OrbitControls target={[0,1.4,0]} minDistance={3} maxDistance={10} enablePan={false}/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.40,0]} receiveShadow>
  <circleGeometry args={[4.7,64]}/>
  <meshStandardMaterial color="#343a44" roughness={.96}/>
 </mesh>
 </Canvas></PreviewBoundary>;
}
