'use client';
import {useEffect,useMemo,useState} from 'react';
import {Canvas,useThree} from '@react-three/fiber';
import {OrbitControls} from '@react-three/drei';
import * as THREE from 'three';
import type {Side,StudioDocument} from '../lib/studio-document';
import {renderArtwork} from '../lib/render-design';
function Surface({doc,side}:{doc:StudioDocument;side:Side}){
 const [texture,setTexture]=useState<THREE.CanvasTexture|null>(null);
 useEffect(()=>{let active=true;let current:THREE.CanvasTexture|null=null;renderArtwork(doc,side).then(c=>{if(!active)return;current=new THREE.CanvasTexture(c);current.colorSpace=THREE.SRGBColorSpace;setTexture(current)}).catch(()=>{});return()=>{active=false;current?.dispose()}},[doc,side]);
 const mat=useMemo(()=>new THREE.MeshStandardMaterial({color:doc.baseColor,roughness:.95}),[doc.baseColor]);useEffect(()=>()=>mat.dispose(),[mat]);
 const scale=doc.fit==='oversized'?1.14:1;
 return <group scale={[scale,1,1]}>
  <mesh position={[0,1.6,0]} material={mat}><boxGeometry args={[1.85,1.8,.50]}/></mesh>
  {[-1,1].map(n=><mesh key={n} position={[n*1.05,2.16,0]} rotation={[0,0,n*.4]} material={mat}><cylinderGeometry args={[.42,.35,.86,16]}/></mesh>)}
  <mesh position={[0,1.57,.263]}><planeGeometry args={[1.75,1.70]}/><meshBasicMaterial map={texture||undefined} color={texture?'white':doc.baseColor} side={THREE.DoubleSide}/></mesh>
 </group>;
}
function Model({doc}:{doc:StudioDocument}){
 const skin='#a68a77',s=doc.body==='tall'?1.1:1;
 return <group scale={[1,s,1]}>
 <mesh position={[0,3,0]}><sphereGeometry args={[.27,20,20]}/><meshStandardMaterial color={skin}/></mesh>
 <mesh position={[0,2.65,0]}><cylinderGeometry args={[.13,.14,.35,16]}/><meshStandardMaterial color={skin}/></mesh>
 <Surface doc={doc} side="front"/><group rotation={[0,Math.PI,0]}><Surface doc={doc} side="back"/></group>
 {[-1,1].map(n=><group key={n}><mesh position={[n*1.33,1.47,0]}><cylinderGeometry args={[.14,.15,.7,16]}/><meshStandardMaterial color={skin}/></mesh><mesh position={[n*.43,.02,0]}><cylinderGeometry args={[.33,.22,1.48,16]}/><meshStandardMaterial color="#434b54"/></mesh></group>)}
 {doc.garment==='hoodie'&&<mesh position={[0,2.55,-.22]}><sphereGeometry args={[.57,24,16,0,Math.PI*2,0,Math.PI*.55]}/><meshStandardMaterial color={doc.baseColor} side={THREE.DoubleSide}/></mesh>}
 </group>;
}
function Position({side}:{side:Side}){const {camera}=useThree();useEffect(()=>{camera.position.set(0,1.5,side==='front'?6:-6);camera.lookAt(0,1.35,0)},[camera,side]);return null}
export default function GarmentPreview({doc,side}:{doc:StudioDocument;side:Side}){
 return <Canvas camera={{position:[0,1.5,6],fov:42}} gl={{preserveDrawingBuffer:true}} dpr={[1,2]}><color attach="background" args={['#252b35']}/><ambientLight intensity={1.9}/><directionalLight position={[5,6,8]} intensity={1.7}/><Model doc={doc}/><Position side={side}/><OrbitControls target={[0,1.35,0]} minDistance={3.5} maxDistance={10} enablePan={false}/><gridHelper args={[10,10,'#646e78','#38404c']} position={[0,-.75,0]}/></Canvas>;
}
