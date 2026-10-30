'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import {renderArtwork} from '../lib/render-design';
import {makeFittedChestPatch} from '../lib/fitted-decal';
import {makeFabricTile,makeFabricAlbedoTile,FABRIC_PROFILES} from '../lib/fabric-material';
import type {StudioDocument} from '../lib/studio-document';

/**
 * CC0 body-fitted clothing, with our separately-authored artwork projected on a
 * sampled fabric-surface decal. This is NOT a calibrated print or sizing model.
 */
export default function LicensedAvatarReference({doc,display='ghost'}:{doc:StudioDocument;display?:'human'|'ghost'}){
 const [model,setModel]=useState<THREE.Group|null>(null);
 const [failed,setFailed]=useState(false);
 const {gl,invalidate}=useThree();
 // Textures are reused for every keystroke. No GPU allocations during ordinary editing.
 const textures=useMemo(()=>{
  const make=()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
   const texture=new THREE.CanvasTexture(canvas);
   texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;
   return texture;
  };
  return {front:make(),back:make()};
 },[]);
 useEffect(()=>()=>{textures.front.dispose();textures.back.dispose()},[textures]);
 // Keep one bump and one color map across fabric changes. Both are updated
 // in place, including repeat UVs, so editing never accumulates GPU textures.
 const fabricMaps=useMemo(()=>{
  if(typeof document==='undefined')return null;
  const makeMap=(kind:'bump'|'albedo')=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
   const ctx=canvas.getContext('2d');if(!ctx)return null;
   const image=ctx.createImageData(128,128);
   image.data.set(kind==='bump'?makeFabricTile('cotton'):makeFabricAlbedoTile('cotton'));
   ctx.putImageData(image,0,0);
   const map=new THREE.CanvasTexture(canvas);
   map.wrapS=THREE.RepeatWrapping;map.wrapT=THREE.RepeatWrapping;
   map.colorSpace=kind==='bump'?THREE.NoColorSpace:THREE.SRGBColorSpace;
   map.repeat.set(FABRIC_PROFILES.cotton.tileRepeat,FABRIC_PROFILES.cotton.tileRepeat);
   map.needsUpdate=true;
   return map;
  };
  const bump=makeMap('bump'),albedo=makeMap('albedo');
  if(!bump||!albedo){bump?.dispose();albedo?.dispose();return null;}
  return {bump,albedo};
 },[]);
 const fabricTexture=fabricMaps?.bump??null;
 const colorTexture=fabricMaps?.albedo??null;
 useEffect(()=>{
  if(!fabricMaps)return;
  for(const [kind,map] of [['bump',fabricMaps.bump],['albedo',fabricMaps.albedo]] as const){
   const canvas=map.image as HTMLCanvasElement,ctx=canvas.getContext('2d');
   if(!ctx)continue;
   const image=ctx.createImageData(canvas.width,canvas.height);
   image.data.set(kind==='bump'?makeFabricTile(doc.material):makeFabricAlbedoTile(doc.material));
   ctx.putImageData(image,0,0);
   const repeat=FABRIC_PROFILES[doc.material].tileRepeat;
   map.repeat.set(repeat,repeat);map.needsUpdate=true;
  }
  invalidate();
 },[doc.material,fabricMaps,invalidate]);
 useEffect(()=>()=>{fabricMaps?.bump.dispose();fabricMaps?.albedo.dispose();},[fabricMaps]);
 const materials=useRef<THREE.Material[]>([]);
 const overlays=useRef<THREE.BufferGeometry[]>([]);
 const garmentMaterials=useRef<THREE.MeshStandardMaterial[]>([]);
 useEffect(()=>{
  let active=true;
  setModel(null);setFailed(false);
  gl.domElement.dataset.referenceStatus='loading';
  gl.domElement.dataset.referenceArtwork='loading';
  gl.domElement.dataset.referenceProjection='curved-surface-decal-v1';
  const prefix=(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/models/realistic/';
  const loader=new GLTFLoader();
  const load=(file:string)=>loader.loadAsync(prefix+file);
  Promise.all([
   display==='human'?load('base_body.glb'):Promise.resolve(null),
   load('clothing_'+doc.garment+'.glb'),
   display==='human'?load('clothing_jeans.glb'):Promise.resolve(null),
   display==='human'?load('clothing_shoes.glb'):Promise.resolve(null)
  ]).then(([body,clothes,jeans,shoes])=>{
   if(!active)return;
   const scene=new THREE.Group();
   if(body&&jeans&&shoes)scene.add(body.scene,clothes.scene,jeans.scene,shoes.scene);
   else scene.add(clothes.scene);
   const bounds=new THREE.Box3().setFromObject(body?body.scene:clothes.scene);
   const height=bounds.max.y-bounds.min.y;
   if(!Number.isFinite(height)||height<=.01)throw Error('Invalid fitted garment bounds');
   const scalar=(display==='ghost'?2.35:3.25)/height;
   scene.scale.setScalar(scalar);
   scene.position.set(
    -(bounds.min.x+bounds.max.x)*.5*scalar,
    display==='ghost'?1.58-(bounds.min.y+bounds.max.y)*.5*scalar:-bounds.min.y*scalar-.26,
    -(bounds.min.z+bounds.max.z)*.5*scalar
   );
   const top=clothes.scene.getObjectByName('Cloth_'+doc.garment);
   if(!(top instanceof THREE.Mesh))throw Error('Missing fitted garment geometry');
   const originals=Array.isArray(top.material)?top.material:[top.material];
   const fitted=originals.map(material=>{
    if(!(material instanceof THREE.MeshStandardMaterial))throw Error('Invalid top material');
    const profile=FABRIC_PROFILES[doc.material];
    const next=new THREE.MeshPhysicalMaterial({
     color:doc.baseColor,roughness:profile.roughness,metalness:profile.metalness,
     sheen:profile.sheen,sheenRoughness:profile.sheenRoughness,sheenColor:'#ffffff',
     anisotropy:profile.anisotropy,map:colorTexture,bumpMap:fabricTexture,bumpScale:profile.bumpScale,
     side:material.side
    });
    materials.current.push(next);
    return next;
   });
   garmentMaterials.current=fitted;
   top.material=Array.isArray(top.material)?fitted:fitted[0];

   let valid=0;
   for(const side of ['front','back'] as const){
    const patch=makeFittedChestPatch(top.geometry,side);
    overlays.current.push(patch.geometry);
    // If not enough of the chest is sampled, refuse an inaccurate partial logo.
    if(patch.coverage<.65)throw Error('Incomplete fitted garment chest projection: '+side);
    valid+=patch.coverage;
    const surface=new THREE.MeshBasicMaterial({
     map:textures[side],transparent:true,alphaTest:.015,depthWrite:false,
     // The GLB's skinned cloth surface can cover a static decal in the viewer.
     // Keep the ink legible but only from its correctly oriented fabric side.
     depthTest:false,side:THREE.FrontSide,toneMapped:false
    });
    materials.current.push(surface);
    const decal=new THREE.Mesh(patch.geometry,surface);
    decal.name='moatt-'+side+'-surface-print';
    decal.renderOrder=4;
    decal.frustumCulled=false;
    clothes.scene.add(decal);
   }
   gl.domElement.dataset.referenceCoverage=(valid/2).toFixed(3);

   // Only conceal skin where fabric covers the actual body; the full-body model
   // still has known anatomical issues and is an optional comparison, not a default.
   body?.scene.traverse(child=>{
    if(!(child instanceof THREE.Mesh)||!child.name.toLowerCase().includes('body'))return;
    const old=Array.isArray(child.material)?child.material:[child.material];
    const hidden=old.map(material=>{
     if(!(material instanceof THREE.MeshStandardMaterial))return material;
     const clone=material.clone();
     clone.onBeforeCompile=(shader)=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMoattBodyPosition;');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMoattBodyPosition=position;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vMoattBodyPosition;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
       '#include <map_fragment>\nif ((vMoattBodyPosition.y>0.93 && vMoattBodyPosition.y<1.50 && abs(vMoattBodyPosition.x)<0.37) || (vMoattBodyPosition.y>1.24 && vMoattBodyPosition.y<1.52 && abs(vMoattBodyPosition.x)<0.63)) discard;');
     };
     clone.customProgramCacheKey=()=> 'moatt-covered-body-surface-v1';
     materials.current.push(clone);
     return clone;
    });
    child.material=Array.isArray(child.material)?hidden:hidden[0];
   });
   scene.traverse(child=>{if(child instanceof THREE.Mesh){child.frustumCulled=false;child.castShadow=false;}});
   setModel(scene);invalidate();
  }).catch(()=>{
   if(active){setFailed(true);gl.domElement.dataset.referenceStatus='unavailable';invalidate();}
  });
  return()=>{
   active=false;
   materials.current.forEach(item=>item.dispose());materials.current=[];
   overlays.current.forEach(geo=>geo.dispose());overlays.current=[];
   garmentMaterials.current=[];
  };
 },[doc.garment,display,gl,invalidate,textures]);

 useEffect(()=>{
  if(!model)return;
  const profile=FABRIC_PROFILES[doc.material];
  for(const material of garmentMaterials.current){
   const m=material as THREE.MeshPhysicalMaterial;
   m.map=colorTexture;m.bumpMap=fabricTexture;m.bumpScale=profile.bumpScale;
   m.roughness=profile.roughness;m.metalness=profile.metalness;
   m.sheen=profile.sheen;m.sheenRoughness=profile.sheenRoughness;
   m.anisotropy=profile.anisotropy;m.needsUpdate=true;
  }
  gl.domElement.dataset.referenceFabric=doc.material;invalidate();
 },[model,doc.material,fabricTexture,colorTexture,gl,invalidate]);
 useEffect(()=>{
  if(!model)return;
  let active=true;
  gl.domElement.dataset.referenceArtwork='loading';
  Promise.all([renderArtwork(doc,'front',true),renderArtwork(doc,'back',true)]).then(([front,back])=>{
   if(!active)return;
   for(const [side,source] of [['front',front],['back',back]] as const){
    const texture=textures[side],canvas=texture.image as HTMLCanvasElement,ctx=canvas.getContext('2d');
    if(!ctx)throw Error('Reference artwork canvas unavailable');
    ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(source,0,0);
    texture.needsUpdate=true;
   }
   garmentMaterials.current.forEach(material=>material.color.set(doc.baseColor));
   gl.domElement.dataset.referenceArtwork='ready';invalidate();
  }).catch(()=>{if(active){gl.domElement.dataset.referenceArtwork='failed';invalidate();}});
  return()=>{active=false};
 },[model,doc.layers.front,doc.layers.back,doc.baseColor,doc.material,gl,invalidate,textures]);

 useEffect(()=>{
  gl.domElement.dataset.referenceStatus=failed?'unavailable':model?'loaded':'loading';
  invalidate();
 },[gl,failed,model,invalidate]);
 if(!model)return <Html center><div role={failed?'alert':'status'} style={{background:'#20252ddf',color:'#fff',padding:'12px 16px',borderRadius:9,whiteSpace:'nowrap'}}>{failed?'Fitted garment unavailable; use Studio mannequin.':display==='ghost'?'Preparing garment close-up…':'Loading human reference…'}</div></Html>;
 return <primitive object={model}/>;
}
