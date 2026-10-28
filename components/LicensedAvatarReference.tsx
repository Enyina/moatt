'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useThree} from '@react-three/fiber';
import {Html} from '@react-three/drei';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import {renderArtwork} from '../lib/render-design';
import {fittedArtworkShader} from '../lib/fitted-artwork-map';
import type {StudioDocument} from '../lib/studio-document';

type ArtUniform={value:THREE.Texture};
/**
 * Original CC0 body-fitted garment + projective print reference.
 * Print region is approximate; no factory-calibrated fit or UV dimensions are claimed.
 */
export default function LicensedAvatarReference({doc,display='human'}:{doc:StudioDocument;display?:'human'|'ghost'}){
 const [model,setModel]=useState<THREE.Group|null>(null);
 const [garment,setGarment]=useState<THREE.Mesh|null>(null);
 const [failed,setFailed]=useState(false);
 const {gl,invalidate}=useThree();
 const uniforms=useMemo(()=>{
  const make=()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1024;
   const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
   tex.needsUpdate=true;return tex;
  };
  return {front:{value:make()} as ArtUniform,back:{value:make()} as ArtUniform};
 },[]);
 useEffect(()=>()=>{uniforms.front.value.dispose();uniforms.back.value.dispose()},[uniforms]);
 const ownMaterials=useRef<THREE.MeshStandardMaterial[]>([]);
 const garmentMaterials=useRef<THREE.MeshStandardMaterial[]>([]);
 useEffect(()=>{
  let active=true;
  setModel(null);setGarment(null);setFailed(false);
  const prefix=(process.env.NEXT_PUBLIC_BASE_PATH||'')+'/models/realistic/';
  const loader=new GLTFLoader();
  Promise.all([display==='human'?loader.loadAsync(prefix+'base_body.glb'):Promise.resolve(null),loader.loadAsync(prefix+'clothing_'+doc.garment+'.glb'),display==='human'?loader.loadAsync(prefix+'clothing_jeans.glb'):Promise.resolve(null),display==='human'?loader.loadAsync(prefix+'clothing_shoes.glb'):Promise.resolve(null)])
   .then(([body,clothes,jeans,shoes])=>{
    if(!active)return;
    const scene=new THREE.Group();
    if(body&&jeans&&shoes)scene.add(body.scene,clothes.scene,jeans.scene,shoes.scene);
    else scene.add(clothes.scene);
    const bbox=new THREE.Box3().setFromObject(body?body.scene:clothes.scene);
    const height=bbox.max.y-bbox.min.y;
    if(!Number.isFinite(height)||height<=.01)throw Error('Invalid body model bounds');
    const scalar=(display==='ghost'?2.35:3.25)/height;
    scene.scale.setScalar(scalar);
    scene.position.set(-(bbox.min.x+bbox.max.x)*.5*scalar,display==='ghost'?1.58-(bbox.min.y+bbox.max.y)*.5*scalar:-bbox.min.y*scalar-.26,-(bbox.min.z+bbox.max.z)*.5*scalar);
    const mesh=clothes.scene.getObjectByName('Cloth_'+doc.garment) as THREE.Mesh|undefined;
    if(!mesh||!(mesh instanceof THREE.Mesh))throw Error('Missing licensed fitted garment geometry');
    const surfaceUv=mesh.geometry.getAttribute('uv');
    if(!surfaceUv)throw Error('Licensed garment missing native UV layout');
    mesh.geometry.setAttribute('moattSurfaceUv',surfaceUv);
    const original=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    ownMaterials.current=original.map(material=>{
     if(!(material instanceof THREE.MeshStandardMaterial))throw Error('Incompatible garment material');
     const clone=material.clone();
     clone.map=null; // The source albedo is pre-dyed blue; remove it so the owner's garment color is authoritative.
     clone.color.set(doc.baseColor);
     clone.onBeforeCompile=(shader)=>{
      shader.uniforms.moattFrontInk=uniforms.front;
      shader.uniforms.moattBackInk=uniforms.back;
      shader.vertexShader=shader.vertexShader.replace('#include <common>',
       '#include <common>\nattribute vec2 moattSurfaceUv;\nvarying vec2 vMoattGarmentUv;\nvarying vec3 vMoattClothPosition;');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
       '#include <begin_vertex>\nvMoattClothPosition=position;\nvMoattGarmentUv=moattSurfaceUv;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',
       '#include <common>\nvarying vec3 vMoattClothPosition;\nvarying vec2 vMoattGarmentUv;\nuniform sampler2D moattFrontInk;\nuniform sampler2D moattBackInk;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
       '#include <map_fragment>\n'+fittedArtworkShader(doc.garment));
     };
     clone.customProgramCacheKey=()=> 'moatt-cc0-native-uv-print-'+doc.garment+'-v2';
     return clone;
    });
    garmentMaterials.current=[...ownMaterials.current];
    mesh.material=Array.isArray(mesh.material)?garmentMaterials.current:garmentMaterials.current[0];
    // Hide torso and upper-arm skin under the upper garment. The original CC0 meshes
    // contain individual body/garment layers; their raw neutral rest pose slightly intersects.
    body?.scene.traverse(child=>{
     if(!(child instanceof THREE.Mesh)||!child.name.toLowerCase().includes('body'))return;
     const original=Array.isArray(child.material)?child.material:[child.material];
     const hidden=original.map(mat=>{
      if(!(mat instanceof THREE.MeshStandardMaterial))return mat;
      const clone=mat.clone();
      clone.onBeforeCompile=(shader)=>{
       shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMoattBodyPosition;');
       shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMoattBodyPosition=position;');
       shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vMoattBodyPosition;');
       shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',
        '#include <map_fragment>\nif ((vMoattBodyPosition.y>0.93 && vMoattBodyPosition.y<1.50 && abs(vMoattBodyPosition.x)<0.37) || (vMoattBodyPosition.y>1.24 && vMoattBodyPosition.y<1.52 && abs(vMoattBodyPosition.x)<0.63)) discard;');
      };
      clone.customProgramCacheKey=()=> 'moatt-covered-body-surface-v1';
      ownMaterials.current.push(clone);
      return clone;
     });
     child.material=Array.isArray(child.material)?hidden:hidden[0];
    });
    scene.traverse(child=>{if(child instanceof THREE.Mesh){child.castShadow=false;child.frustumCulled=false;}});
    setModel(scene);setGarment(mesh);invalidate();
   })
   .catch(()=>{if(active){setFailed(true);invalidate();}});
  return()=>{active=false;ownMaterials.current.forEach(m=>m.dispose());ownMaterials.current=[];garmentMaterials.current=[];};
 // Shader uses external uniform objects, updated without rebuilding programs after edits.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[doc.garment,display,invalidate,uniforms]);
 useEffect(()=>{
  if(!model||!garment)return;
  let active=true;
  gl.domElement.dataset.referenceArtwork='loading';
  Promise.all([renderArtwork(doc,'front',true),renderArtwork(doc,'back',true)]).then(([front,back])=>{
   if(!active)return;
   for(const [texture,source] of [[uniforms.front.value,front],[uniforms.back.value,back]] as const){
    const canvas=texture.image as HTMLCanvasElement;
    const ctx=canvas.getContext('2d');
    if(!ctx)throw Error('Canvas unavailable for print reference');
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.drawImage(source,0,0);
    texture.needsUpdate=true;
   }
   garmentMaterials.current.forEach(m=>m.color.set(doc.baseColor));
   gl.domElement.dataset.referenceArtwork='ready';
   invalidate();
  }).catch(()=>{if(active){gl.domElement.dataset.referenceArtwork='failed';invalidate();}});
  return()=>{active=false};
 },[doc.layers.front,doc.layers.back,doc.baseColor,doc.material,model,garment,gl,invalidate,uniforms]);
 useEffect(()=>{
  gl.domElement.dataset.referenceStatus=failed?'unavailable':model?'loaded':'loading';
  invalidate();
 },[model,failed,gl,invalidate]);
 if(!model)return <Html center><div role={failed?'alert':'status'} style={{background:'#20252ddf',color:'#fff',padding:'12px 16px',borderRadius:9,whiteSpace:'nowrap'}}>{failed?'Human reference unavailable. Switch to Studio mannequin.':display==='ghost'?'Preparing garment close-up…':'Loading fitted CC0 human reference…'}</div></Html>;
 return <primitive object={model}/>;
}
