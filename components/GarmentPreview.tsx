'use client';
import {Component,useEffect,useMemo,useState} from 'react';
import type {ReactNode} from 'react';
import {Canvas,useFrame,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import type {Side,StudioDocument} from '../lib/studio-document';
import {renderArtwork} from '../lib/render-design';

function useSideTexture(doc:StudioDocument,side:Side){
 const [texture,setTexture]=useState<THREE.CanvasTexture|null>(null);
 useEffect(()=>{let live=true;let next:THREE.CanvasTexture|null=null;renderArtwork(doc,side).then(canvas=>{if(!live)return;next=new THREE.CanvasTexture(canvas);next.colorSpace=THREE.SRGBColorSpace;next.needsUpdate=true;setTexture(next)}).catch(()=>{});return()=>{live=false;next?.dispose()}},[doc.layers[side],doc.baseColor,side]);
 return texture;
}
function garmentGeometry(hoodie:boolean,oversized:boolean,sleeve:'short'|'long',hemStyle:'standard'|'cropped',neck:'crew'|'wide'){
 const w=oversized?1.16:1, sleeveY=sleeve==='long'?-.60:(hoodie?-.22:.60),hem=hemStyle==='cropped'?-.38:(hoodie?-.72:-.85),neckWidth=neck==='wide'?.43:.30;
 // The 2D artboard maps to this entire custom front/back silhouette.
 const points=[
 [-.63*w,1.02],[-.91*w,.95],[-1.47*w,sleeveY],[-1.23*w,.17],
 [-.96*w,.33],[-.87*w,hem],[.87*w,hem],[.96*w,.33],
 [1.23*w,.17],[1.47*w,sleeveY],[.91*w,.95],[.63*w,1.02],
 [neckWidth*w,.95],[neckWidth*.70*w,.77],[-neckWidth*.70*w,.77],[-neckWidth*w,.95]
 ];
 const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);for(const [x,y] of points.slice(1))shape.lineTo(x,y);shape.closePath();
 const geo=new THREE.ShapeGeometry(shape);
 const pos=geo.getAttribute('position'),uv=geo.getAttribute('uv');
 // Map artwork coordinates within the preview silhouette's full bounding box.
 const left=-1.5*w,right=1.5*w,bottom=hem,top=1.04;
 for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i);uv.setXY(i,(x-left)/(right-left),(y-bottom)/(top-bottom));}
 uv.needsUpdate=true;geo.computeVertexNormals();const shell=new THREE.ExtrudeGeometry(shape,{depth:.72,steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:.015,bevelThickness:.015});shell.translate(0,0,-.36);return {panel:geo,shell};
}
function Garment({doc}:{doc:StudioDocument}){
 const front=useSideTexture(doc,'front'),back=useSideTexture(doc,'back');
 const geo=useMemo(()=>garmentGeometry(doc.garment==='hoodie',doc.fit==='oversized',doc.sleeve,doc.hem,doc.neck),[doc.fit,doc.garment,doc.sleeve,doc.hem,doc.neck]);
 useEffect(()=>()=>{geo.panel.dispose();geo.shell.dispose()},[geo]);
 const frontMat=useMemo(()=>new THREE.MeshStandardMaterial({color:front?'#ffffff':doc.baseColor,map:front||null,side:THREE.DoubleSide,roughness:.95}),[front,doc.baseColor]);
 const backMat=useMemo(()=>new THREE.MeshStandardMaterial({color:back?'#ffffff':doc.baseColor,map:back||null,side:THREE.DoubleSide,roughness:.95}),[back,doc.baseColor]);
 useEffect(()=>()=>{frontMat.dispose();backMat.dispose()},[frontMat,backMat]);
 return <group position={[0,1.54,0]}>
 <mesh geometry={geo.panel} position={[0,0,.39]} material={frontMat}/>
 <mesh geometry={geo.panel} rotation={[0,Math.PI,0]} position={[0,0,-.39]} material={backMat}/>
 <mesh geometry={geo.shell}><meshStandardMaterial color={doc.baseColor} roughness={.96}/></mesh>
 {doc.garment==='hoodie'&&<>
 <mesh position={[0,1.0,-.19]}><sphereGeometry args={[.49,24,18,0,Math.PI*2,0,Math.PI*.57]}/><meshStandardMaterial color={doc.baseColor} side={THREE.DoubleSide} roughness={.97}/></mesh>
 <mesh position={[0,-.19,.215]}><boxGeometry args={[.78,.33,.06]}/><meshStandardMaterial color={doc.baseColor}/></mesh>
 </>}
 </group>;
}
function Mannequin({doc}:{doc:StudioDocument}){
 const [asset,setAsset]=useState<THREE.Group|null>(null);
 useEffect(()=>{let live=true;new GLTFLoader().load((process.env.NEXT_PUBLIC_BASE_PATH||'')+'/models/mannequin.glb',gltf=>{if(live)setAsset(gltf.scene)},undefined,()=>{if(live)setAsset(null)});return()=>{live=false}},[]);
 const height=doc.body==='tall'?1.09:1;
 return <group scale={[1,height,1]}>
 {asset?<primitive object={asset} scale={.56} rotation={[0,-Math.PI/2,0]} position={[0,1.43,0]}/>:<>
 <mesh position={[0,3.05,0]}><sphereGeometry args={[.25,28,22]}/><meshStandardMaterial color="#af8f77" roughness={.92}/></mesh>
 <mesh position={[0,2.74,0]}><cylinderGeometry args={[.12,.14,.37,20]}/><meshStandardMaterial color="#af8f77"/></mesh>
 <mesh position={[0,.78,0]}><cylinderGeometry args={[.49,.43,.5,24]}/><meshStandardMaterial color="#383b43"/></mesh>
 {[-1,1].map(n=><group key={n}>
 <mesh position={[n*1.34,1.60,0]} rotation={[0,0,n*.12]}><cylinderGeometry args={[.135,.12,.68,20]}/><meshStandardMaterial color="#af8f77"/></mesh>
 <mesh position={[n*.32,.02,0]}><cylinderGeometry args={[.25,.19,1.45,24]}/><meshStandardMaterial color="#393e48"/></mesh>
 </group>)}</>}
 <Garment doc={doc}/>
 </group>;
}
function RenderingDiagnostics(){
 const {gl}=useThree();
 const tick=useMemo(()=>({count:0}),[]);
 useFrame(()=>{tick.count++;if(tick.count%45===0){const canvas=gl.domElement;canvas.dataset.gpuGeometries=String(gl.info.memory.geometries);canvas.dataset.gpuTextures=String(gl.info.memory.textures);}});
 return null;
}
function CameraPosition({side}:{side:Side}){const {camera}=useThree();useEffect(()=>{camera.position.set(0,1.5,side==='front'?6:-6);camera.lookAt(0,1.4,0)},[camera,side]);return null}
class PreviewBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<div role="alert" className="empty3d">3D rendering is unavailable. Your artwork is still editable and exportable in 2D.</div>:this.props.children;}
}
export default function GarmentPreview({doc,side}:{doc:StudioDocument;side:Side}){
 return <PreviewBoundary><Canvas camera={{position:[0,1.5,6],fov:42}} gl={{preserveDrawingBuffer:true}} dpr={[1,2]}>
 <color attach="background" args={['#252b35']}/><ambientLight intensity={2.1}/><directionalLight position={[4,8,6]} intensity={1.5}/>
 <Mannequin doc={doc}/><CameraPosition side={side}/><RenderingDiagnostics/>
 <OrbitControls target={[0,1.4,0]} minDistance={3} maxDistance={10} enablePan={false}/>
 <gridHelper args={[10,10,'#646e78','#38404c']} position={[0,-.75,0]}/>
 </Canvas></PreviewBoundary>;
}
