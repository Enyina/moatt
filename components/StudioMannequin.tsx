'use client';
import {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {mannequinArm,mannequinExposedArm,mannequinLeg,mannequinTorso,mannequinHead,mannequinFoot,mannequinFingers} from '../lib/mannequin-mesh';

/** Continuous matte display form, intended to display clothing without claiming measured human fit. */
export default function StudioMannequin({sleeve='short',bare=false}:{sleeve?:'short'|'long';bare?:boolean}){
 const matte=useMemo(()=>new THREE.MeshPhysicalMaterial({color:'#a8a9aa',metalness:0,roughness:.83,clearcoat:.06,clearcoatRoughness:.86,side:THREE.DoubleSide}),[]);
 const sculpt=useMemo(()=>({
  head:mannequinHead(),torso:mannequinTorso(),
  leftArm:bare?mannequinArm(-1):mannequinExposedArm(-1,sleeve),rightArm:bare?mannequinArm(1):mannequinExposedArm(1,sleeve),
  leftLeg:mannequinLeg(-1),rightLeg:mannequinLeg(1),
  leftFoot:mannequinFoot(-1),rightFoot:mannequinFoot(1),
  leftFingers:mannequinFingers(-1),rightFingers:mannequinFingers(1)
 }),[sleeve,bare]);
 useEffect(()=>()=>{matte.dispose();Object.values(sculpt).forEach(mesh=>Array.isArray(mesh)?mesh.forEach(g=>g.dispose()):mesh.dispose())},[matte,sculpt]);
 return <group>
  <mesh geometry={sculpt.head} material={matte}/>
  {/* Neck is modeled continuously with torso geometry; no visible ball joint. */}
  <mesh geometry={sculpt.torso} material={matte}/>
  <mesh geometry={sculpt.leftArm} material={matte}/>
  <mesh geometry={sculpt.rightArm} material={matte}/>
  <mesh geometry={sculpt.leftLeg} material={matte}/>
  <mesh geometry={sculpt.rightLeg} material={matte}/>
  <mesh geometry={sculpt.leftFoot} material={matte}/>
  <mesh geometry={sculpt.rightFoot} material={matte}/>
  {sculpt.leftFingers.map((g,i)=><mesh key={'left-finger-'+i} geometry={g} material={matte}/>)}
  {sculpt.rightFingers.map((g,i)=><mesh key={'right-finger-'+i} geometry={g} material={matte}/>)}
 </group>;
}
