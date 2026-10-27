'use client';
import {useEffect,useMemo} from 'react';
import * as THREE from 'three';

/**
 * Neutral faceless display mannequin with a clean studio silhouette.
 * No anatomical measurements or clothing-fit claims are made.
 */
function Limb({from,to,upperRadius,lowerRadius,material}:{from:[number,number,number];to:[number,number,number];upperRadius:number;lowerRadius:number;material:THREE.Material}){
 const data=useMemo(()=>{
  const a=new THREE.Vector3(...from),b=new THREE.Vector3(...to);
  const direction=b.clone().sub(a);
  const rotation=new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),direction.clone().normalize());
  return {center:a.clone().add(b).multiplyScalar(.5),rotation,length:direction.length()};
 // Endpoints are values chosen inside the static mannequin definition.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[...from,...to]);
 return <mesh position={data.center} quaternion={data.rotation} material={material} castShadow>
  <cylinderGeometry args={[upperRadius,lowerRadius,data.length,30,1,true]}/>
 </mesh>;
}
export default function StudioMannequin(){
 const material=useMemo(()=>new THREE.MeshPhysicalMaterial({color:'#636872',roughness:.55,metalness:.08,clearcoat:.16,clearcoatRoughness:.44}),[]);
 const neckMat=useMemo(()=>new THREE.MeshStandardMaterial({color:'#515761',roughness:.62}),[]);
 useEffect(()=>()=>{material.dispose();neckMat.dispose()},[material,neckMat]);
 return <group>
  <mesh position={[0,2.83,0]} material={material} castShadow>
   <sphereGeometry args={[.265,48,32]}/>
  </mesh>
  <mesh position={[0,2.48,0]} material={neckMat} castShadow>
   <cylinderGeometry args={[.127,.15,.28,32]}/>
  </mesh>
  <mesh position={[0,1.79,-.02]} scale={[.56,.76,.28]} material={material} castShadow>
   <sphereGeometry args={[1,40,28]}/>
  </mesh>
  <mesh position={[0,1.06,0]} scale={[.49,.29,.28]} material={material} castShadow>
   <sphereGeometry args={[1,40,28]}/>
  </mesh>
  {([-1,1] as const).map(sign=><group key={sign}>
   <mesh position={[sign*.63,2.28,0]} scale={[.18,.17,.18]} material={material}><sphereGeometry args={[1,24,20]}/></mesh>
   <Limb from={[sign*.66,2.27,0]} to={[sign*.9,1.79,.035]} upperRadius={.16} lowerRadius={.14} material={material}/>
   <mesh position={[sign*.9,1.79,.035]} scale={[.145,.15,.14]} material={material}><sphereGeometry args={[1,24,20]}/></mesh>
   <Limb from={[sign*.9,1.79,.035]} to={[sign*1.04,1.31,.075]} upperRadius={.133} lowerRadius={.095} material={material}/>
   <mesh position={[sign*1.04,1.20,.075]} scale={[.11,.20,.062]} material={material}><sphereGeometry args={[1,24,20]}/></mesh>
   <mesh position={[sign*.23,1.08,0]} scale={[.22,.23,.235]} material={material}><sphereGeometry args={[1,24,20]}/></mesh>
   <Limb from={[sign*.23,1.09,0]} to={[sign*.25,.54,.04]} upperRadius={.214} lowerRadius={.16} material={material}/>
   <mesh position={[sign*.25,.54,.04]} scale={[.16,.18,.17]} material={material}><sphereGeometry args={[1,24,20]}/></mesh>
   <Limb from={[sign*.25,.54,.04]} to={[sign*.26,.13,.10]} upperRadius={.146} lowerRadius={.092} material={material}/>
   <mesh position={[sign*.26,.10,.16]} scale={[.16,.095,.28]} material={material}><sphereGeometry args={[1,24,20]}/></mesh>
  </group>)}
 </group>;
}
