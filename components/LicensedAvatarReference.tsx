'use client';
import {useEffect,useMemo,useState} from 'react';
import {useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type {StudioDocument} from '../lib/studio-document';
import {DEFAULT_AVATAR,avatarCapabilities,applyAvatarMorphs,applyAvatarPose,applyAvatarPlacement,captureRestPose,decodeAvatar} from '../lib/avatar-customization';
import type {AvatarCapabilities} from '../lib/avatar-customization';

type LoadedAvatar={
 scene:THREE.Group;body:THREE.Object3D;clothing:THREE.Object3D;
 rest:Map<THREE.Bone,THREE.Quaternion>;origin:THREE.Vector3;capabilities:AvatarCapabilities
};

/**
 * CC0 MakeHuman-generated GLBs. Body/clothes are separate files; both are
 * adjusted using THEIR OWN matching morph targets and similarly named bones.
 * This is a customizable adult concept reference, not physical fit validation.
 */
export default function LicensedAvatarReference({doc}:{doc:StudioDocument}){
 const [model,setModel]=useState<LoadedAvatar|null>(null);
 const [failed,setFailed]=useState(false);
 const {gl,invalidate}=useThree();
 const settings=useMemo(()=>decodeAvatar(doc.avatar??DEFAULT_AVATAR),[doc.avatar]);
 useEffect(()=>{
  let active=true;
  setModel(null);setFailed(false);
  let current:LoadedAvatar|null=null;
  const prefix=(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/models/realistic/';
  const loader=new GLTFLoader();
  Promise.all([loader.loadAsync(prefix+'base_body.glb'),loader.loadAsync(prefix+'clothing_'+doc.garment+'.glb')])
   .then(([body,clothes])=>{
    const group=new THREE.Group();
    group.add(body.scene,clothes.scene);
    if(!active)return;
    const bbox=new THREE.Box3().setFromObject(body.scene);
    const height=bbox.max.y-bbox.min.y;
    if(!Number.isFinite(height)||height<=.01)throw Error('Invalid body model bounds');
    const scalar=3.25/height;
    group.scale.setScalar(scalar);
    const origin=new THREE.Vector3(-(bbox.min.x+bbox.max.x)*.5*scalar,-bbox.min.y*scalar-.26,-(bbox.min.z+bbox.max.z)*.5*scalar);
    group.position.copy(origin);
    group.traverse(child=>{
     if(!(child instanceof THREE.Mesh))return;
     child.castShadow=false;child.frustumCulled=false;
    });
    const capabilities=avatarCapabilities(body.scene,clothes.scene);
    current={scene:group,body:body.scene,clothing:clothes.scene,rest:captureRestPose(group),origin,capabilities};
    setModel(current);invalidate();
   })
   .catch(()=>{if(active){setFailed(true);invalidate();}});
  return()=>{
   active=false;
   if(current){
    current.scene.traverse(o=>{
     if(!(o instanceof THREE.Mesh))return;
     o.geometry?.dispose();
     const materials=Array.isArray(o.material)?o.material:[o.material];
     for(const mat of materials)mat?.dispose();
    });
   }
  };
 },[doc.garment,invalidate]);
 useEffect(()=>{
  if(!model)return;
  const {scene,body,clothing,rest,origin,capabilities}=model;
  applyAvatarMorphs(body,settings);
  applyAvatarMorphs(clothing,settings);
  applyAvatarPose(rest,settings);
  applyAvatarPlacement(scene,origin,settings);
  gl.domElement.dataset.avatarMorphs=capabilities.morphs&&capabilities.clothingMorphs?'supported':'unverified';
  gl.domElement.dataset.avatarRig=capabilities.rig&&capabilities.clothingRig?'supported':'unverified';
  gl.domElement.dataset.avatarPose=settings.pose;
  gl.domElement.dataset.avatarAge=String(settings.age);
  gl.domElement.dataset.avatarPresentation=settings.presentation;
  gl.domElement.dataset.avatarSize=settings.size;
  gl.domElement.dataset.avatarTurn=String(settings.turn);
  invalidate();
 },[
  model,gl,invalidate,settings
 ]);
 useEffect(()=>{
  gl.domElement.dataset.referenceStatus=failed?'unavailable':model?'loaded':'loading';
  invalidate();
 },[model,failed,gl,invalidate]);
 if(!model)return <Html center><div role={failed?'alert':'status'} style={{background:'#20252ddf',color:'#fff',padding:'12px 16px',borderRadius:9,whiteSpace:'nowrap'}}>{failed?'Human avatar unavailable. Continue editing in Garment only.':'Loading licensed adult human avatar…'}</div></Html>;
 return <primitive object={model.scene}/>;
}
