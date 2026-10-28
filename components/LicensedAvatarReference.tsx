'use client';
import {useEffect,useState} from 'react';
import {useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type {StudioDocument} from '../lib/studio-document';

/** Visual fit reference from pinned third-party CC0 GLB exports. No borrowed application source code. */
export default function LicensedAvatarReference({doc}:{doc:StudioDocument}){
 const [model,setModel]=useState<THREE.Group|null>(null);
 const [failed,setFailed]=useState(false);
 const {gl,invalidate}=useThree();
 useEffect(()=>{
  let active=true;
  setModel(null);setFailed(false);
  const prefix=(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/models/realistic/';
  const loader=new GLTFLoader();
  Promise.all([loader.loadAsync(prefix+'base_body.glb'),loader.loadAsync(prefix+'clothing_'+doc.garment+'.glb')])
   .then(([body,clothes])=>{
    if(!active)return;
    const scene=new THREE.Group();
    scene.add(body.scene,clothes.scene);
    const bbox=new THREE.Box3().setFromObject(body.scene);
    const height=bbox.max.y-bbox.min.y;
    if(!Number.isFinite(height)||height<=.01)throw Error('Invalid body model bounds');
    // Both generated GLBs share the upstream armature coordinate system.
    const scalar=3.25/height;
    scene.scale.setScalar(scalar);
    scene.position.set(-(bbox.min.x+bbox.max.x)*.5*scalar,-bbox.min.y*scalar-.26,-(bbox.min.z+bbox.max.z)*.5*scalar);
    scene.traverse(child=>{
     if(!(child instanceof THREE.Mesh))return;
     child.castShadow=false;child.frustumCulled=false;
    });
    setModel(scene);invalidate();
   })
   .catch(()=>{if(active){setFailed(true);invalidate();}});
  return()=>{active=false};
 },[doc.garment,invalidate]);
 useEffect(()=>{
  gl.domElement.dataset.referenceStatus=failed?'unavailable':model?'loaded':'loading';
  invalidate();
 },[model,failed,gl,invalidate]);
 if(!model)return <Html center><div role={failed?'alert':'status'} style={{background:'#20252ddf',color:'#fff',padding:'12px 16px',borderRadius:9,whiteSpace:'nowrap'}}>{failed?'Human reference unavailable. Switch to Studio mannequin.':'Loading verified human reference…'}</div></Html>;
 return <primitive object={model}/>;
}
