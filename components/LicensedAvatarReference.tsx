'use client';
import {useEffect,useMemo,useState} from 'react';
import {useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import type {StudioDocument} from '../lib/studio-document';
import {renderArtwork} from '../lib/render-design';
import {createRealisticPrintSurface,createUvCalibrationArtwork,updateRealisticFrontAtlas} from '../lib/realistic-garment-atlas';
import type {RealisticPrintSurface} from '../lib/realistic-garment-atlas';
import {DEFAULT_AVATAR,avatarCapabilities,applyAvatarMorphs,applyAvatarPose,applyAvatarPlacement,captureRestPose,captureBoneRestPositions,rebaseAvatarSkeleton,validJointMorphData,decodeAvatar} from '../lib/avatar-customization';
import type {AvatarCapabilities,JointMorphData} from '../lib/avatar-customization';

type LoadedAvatar={
 scene:THREE.Group;body:THREE.Object3D;clothing:THREE.Object3D;
 rest:Map<THREE.Bone,THREE.Quaternion>;restPositions:Map<THREE.Bone,THREE.Vector3>;jointData:JointMorphData;origin:THREE.Vector3;capabilities:AvatarCapabilities;printSurface:RealisticPrintSurface|null
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
 const [printError,setPrintError]=useState(false);
 useEffect(()=>{
  let active=true;
  setModel(null);setFailed(false);
  let current:LoadedAvatar|null=null;
  const prefix=(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/models/realistic/';
  const loader=new GLTFLoader();
  Promise.all([
   loader.loadAsync(prefix+'base_body.glb'),
   loader.loadAsync(prefix+'clothing_'+doc.garment+'.glb'),
   fetch(prefix+'base_body.joints.json').then(async response=>{
    if(!response.ok)throw Error('Human joint calibration unavailable');
    const result:unknown=await response.json();
    if(!validJointMorphData(result))throw Error('Invalid joint calibration data');
    return result;
   })
  ]).then(([body,clothes,jointData])=>{
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
    // The T-shirt GLB has a native UV atlas. Keep this experiment scoped to
    // its single Cloth_tshirt primitive: other garment assets are unchanged.
    let printSurface:RealisticPrintSurface|null=null;
    if(doc.garment==='tshirt')clothes.scene.traverse(object=>{
     if(printSurface || !(object instanceof THREE.Mesh) || !object.name.includes('Cloth_tshirt'))return;
     printSurface=createRealisticPrintSurface(object);
    });
    current={scene:group,body:body.scene,clothing:clothes.scene,rest:captureRestPose(group),restPositions:captureBoneRestPositions(group),jointData,origin,capabilities,printSurface};
    setModel(current);invalidate();
   })
   .catch(()=>{if(active){setFailed(true);invalidate();}});
  return()=>{
   active=false;
   if(current){
    current.printSurface?.atlas.dispose();
    current.printSurface?.originalMaterial.dispose();
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
  const {scene,body,clothing,rest,restPositions,jointData,origin,capabilities}=model;
  // Return bones to their original rotations before recalculating the bind
  // skeleton for a different adult body shape.
  applyAvatarPose(rest,DEFAULT_AVATAR);
  applyAvatarMorphs(body,settings);
  applyAvatarMorphs(clothing,settings);
  const jointsUpdated=rebaseAvatarSkeleton(scene,restPositions,jointData,settings);
  applyAvatarPose(rest,settings);
  gl.domElement.dataset.avatarAlignedJoints=String(jointsUpdated);
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
  if(!model)return;
  const surface=model.printSurface;
  if(!surface){
   gl.domElement.dataset.realisticPrintStatus='unsupported-garment';
   delete gl.domElement.dataset.realisticPrintTriangles;
   return;
  }
  let active=true;
  setPrintError(false);
  gl.domElement.dataset.realisticPrintStatus='loading';
  const debug=typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('moattUvDebug')==='1';
  const artwork=debug?Promise.resolve(createUvCalibrationArtwork()):renderArtwork(doc,'front',true);
  artwork.then(canvas=>{
   if(!active)return;
   const triangles=updateRealisticFrontAtlas(surface,doc.baseColor,canvas);
   gl.domElement.dataset.realisticPrintTriangles=String(triangles);
   gl.domElement.dataset.realisticPrintStatus=triangles>0?'mapped':'no-front-triangles';
   gl.domElement.dataset.realisticPrintDebug=String(debug);
   invalidate();
  }).catch(()=>{
   if(active){setPrintError(true);gl.domElement.dataset.realisticPrintStatus='failed';invalidate();}
  });
  return()=>{active=false;};
 },[model,doc.layers.front,doc.baseColor,doc.material,gl,invalidate]);
 useEffect(()=>{
  gl.domElement.dataset.referenceStatus=failed?'unavailable':model?'loaded':'loading';
  invalidate();
 },[model,failed,gl,invalidate]);
 if(!model)return <Html center><div role={failed?'alert':'status'} style={{background:'#20252ddf',color:'#fff',padding:'12px 16px',borderRadius:9,whiteSpace:'nowrap'}}>{failed?'Human avatar unavailable. Continue editing in Garment only.':'Loading licensed adult human avatar…'}</div></Html>;
 return <>
  {printError&&<Html center><div role="alert" style={{background:'#20252ddf',color:'#fff',padding:12}}>Unable to render the T-shirt print. Your 2D artwork is unchanged.</div></Html>}
  <primitive object={model.scene}/>
 </>;
}
