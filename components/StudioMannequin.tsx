'use client';
import {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {mannequinArm,mannequinExposedArm,mannequinLeg,mannequinTorso,mannequinHead} from '../lib/mannequin-mesh';

/** Continuous matte display form, intended to display clothing without claiming measured human fit. */
export default function StudioMannequin({sleeve='short',bare=false}:{sleeve?:'short'|'long';bare?:boolean}){
 const matte=useMemo(()=>new THREE.MeshPhysicalMaterial({color:'#a8a9aa',metalness:0,roughness:.83,clearcoat:.06,clearcoatRoughness:.86,side:THREE.DoubleSide}),[]);
 const sculpt=useMemo(()=>({
  head:mannequinHead(),torso:mannequinTorso(),
  leftArm:bare?mannequinArm(-1):mannequinExposedArm(-1,sleeve),rightArm:bare?mannequinArm(1):mannequinExposedArm(1,sleeve),
  leftLeg:mannequinLeg(-1),rightLeg:mannequinLeg(1)
 }),[sleeve,bare]);
 useEffect(()=>()=>{matte.dispose();Object.values(sculpt).forEach(mesh=>mesh.dispose())},[matte,sculpt]);
 return <group>
  <mesh geometry={sculpt.head} material={matte}/>
  {/* Neck is modeled continuously with torso geometry; no visible ball joint. */}
  <mesh geometry={sculpt.torso} material={matte}/>
  <mesh geometry={sculpt.leftArm} material={matte}/>
  <mesh geometry={sculpt.rightArm} material={matte}/>
  <mesh geometry={sculpt.leftLeg} material={matte}/>
  <mesh geometry={sculpt.rightLeg} material={matte}/>
  {([-1,1] as const).map(sign=><mesh key={'foot'+sign} position={[sign*.285,-.255,.225]} scale={[.15,.073,.31]} material={matte}>
   <sphereGeometry args={[1,24,16]}/>
  </mesh>)}
 </group>;
}
