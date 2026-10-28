'use client';
import {useEffect,useMemo} from 'react';
import * as THREE from 'three';
import {mannequinArm,mannequinLeg,mannequinTorso,mannequinHead} from '../lib/mannequin-mesh';

/** Continuous matte display form, intended to display clothing without claiming measured human fit. */
export default function StudioMannequin(){
 const matte=useMemo(()=>new THREE.MeshStandardMaterial({color:'#80838a',metalness:0,roughness:.9,side:THREE.DoubleSide}),[]);
 const sculpt=useMemo(()=>({
  head:mannequinHead(),torso:mannequinTorso(),
  leftArm:mannequinArm(-1),rightArm:mannequinArm(1),
  leftLeg:mannequinLeg(-1),rightLeg:mannequinLeg(1)
 }),[]);
 useEffect(()=>()=>{matte.dispose();Object.values(sculpt).forEach(mesh=>mesh.dispose())},[matte,sculpt]);
 return <group>
  <mesh geometry={sculpt.head} material={matte}/>
  <mesh position={[0,2.52,.015]} scale={[.145,.17,.15]} material={matte}><sphereGeometry args={[1,24,20]}/></mesh>
  <mesh geometry={sculpt.torso} material={matte}/>
  <mesh geometry={sculpt.leftArm} material={matte}/>
  <mesh geometry={sculpt.rightArm} material={matte}/>
  <mesh geometry={sculpt.leftLeg} material={matte}/>
  <mesh geometry={sculpt.rightLeg} material={matte}/>
  {([-1,1] as const).map(sign=><mesh key={'foot'+sign} position={[sign*.29,-.25,.21]} scale={[.16,.105,.27]} material={matte}>
   <sphereGeometry args={[1,24,16]}/>
  </mesh>)}
 </group>;
}
