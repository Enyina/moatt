import * as THREE from 'three';

/** Values describe an adult fashion-avatar preview, never real fit/measurements. */
export type AvatarPresentation='masculine'|'feminine';
export type AvatarSize='XS'|'S'|'M'|'L'|'XL'|'XXL';
export type AvatarPose='neutral'|'arms-up'|'walking'|'hands-on-hips';
export type AvatarSettings={
 presentation:AvatarPresentation;age:number;heightCm:number;size:AvatarSize;
 pose:AvatarPose;leftArm:number;rightArm:number;turn:number;
 positionX:number;positionY:number;positionZ:number;
};
export const DEFAULT_AVATAR:AvatarSettings={
 presentation:'masculine',age:25,heightCm:175,size:'M',
 pose:'neutral',leftArm:0,rightArm:0,turn:0,
 positionX:0,positionY:0,positionZ:0
};
const sizes:AvatarSize[]=['XS','S','M','L','XL','XXL'];
const poses:AvatarPose[]=['neutral','arms-up','walking','hands-on-hips'];
const presentation:AvatarPresentation[]=['masculine','feminine'];
const number=(input:unknown,fallback:number,min:number,max:number)=>
 typeof input==='number'&&Number.isFinite(input)?Math.min(max,Math.max(min,input)):fallback;
export function decodeAvatar(input:unknown):AvatarSettings{
 const o=(input&&typeof input==='object'&&!Array.isArray(input)?input:{}) as Record<string,unknown>;
 return {
  presentation:presentation.includes(o.presentation as AvatarPresentation)?o.presentation as AvatarPresentation:DEFAULT_AVATAR.presentation,
  age:number(o.age,25,18,80),heightCm:number(o.heightCm,175,150,205),
  size:sizes.includes(o.size as AvatarSize)?o.size as AvatarSize:'M',
  pose:poses.includes(o.pose as AvatarPose)?o.pose as AvatarPose:'neutral',
  leftArm:number(o.leftArm,0,-30,110),rightArm:number(o.rightArm,0,-30,110),
  turn:number(o.turn,0,-180,180),
  positionX:number(o.positionX,0,-1.5,1.5),
  positionY:number(o.positionY,0,-.4,.8),
  positionZ:number(o.positionZ,0,-1.5,1.5)
 };
}
/** Independent interpretation of documented public CC0 generated morph names. */
export function avatarMorphWeights(input:AvatarSettings):Record<string,number>{
 const s=decodeAvatar(input);
 const sizeIndex=sizes.indexOf(s.size);
 const weight=(sizeIndex-2)/3; // XS: light body, XXL: larger body, preview only
 const height=(s.heightCm-175)/30;
 const age=s.age>25?Math.min(.85,(s.age-25)/55*.85):-Math.min(.12,(25-s.age)/7*.12);
 const out:Record<string,number>={
  gender_male:s.presentation==='masculine'?1:0,
  gender_female:s.presentation==='feminine'?1:0,
  age_child:Math.max(0,-age),age_old:Math.max(0,age),
  height_short:Math.max(0,-height),height_tall:Math.max(0,height)*.45,
  weight_min:Math.max(0,-weight),weight_max:Math.max(0,weight)
 };
 for(const a of ['gender_male','gender_female'])for(const b of ['age_child','age_old','weight_min','weight_max'])
  out['corr_'+a+'__'+b]=(out[a]||0)*(out[b]||0);
 return out;
}
export type AvatarCapabilities={morphs:boolean;rig:boolean;clothingMorphs:boolean;clothingRig:boolean};
/** Inspect the actual imported asset; never infer capability from the UI settings. */
export function avatarCapabilities(body:THREE.Object3D,clothing:THREE.Object3D):AvatarCapabilities{
 const check=(root:THREE.Object3D)=>{
  let morphs=false,rig=false;
  root.traverse(object=>{
   if((object as THREE.SkinnedMesh).isSkinnedMesh)rig=true;
   const m=object as THREE.Mesh;
   if(m.morphTargetDictionary && ('gender_male' in m.morphTargetDictionary || 'gender_female' in m.morphTargetDictionary))morphs=true;
  });
  return {morphs,rig};
 };
 const a=check(body),b=check(clothing);
 return {morphs:a.morphs,rig:a.rig,clothingMorphs:b.morphs,clothingRig:b.rig};
}
export function captureRestPose(root:THREE.Object3D):Map<THREE.Bone,THREE.Quaternion>{
 const rest=new Map<THREE.Bone,THREE.Quaternion>();
 root.traverse(o=>{if((o as THREE.Bone).isBone)rest.set(o as THREE.Bone,(o as THREE.Bone).quaternion.clone());});
 return rest;
}
export function applyAvatarMorphs(root:THREE.Object3D,settings:AvatarSettings):number{
 const weights=avatarMorphWeights(settings);
 let changed=0;
 root.traverse(object=>{
  const mesh=object as THREE.Mesh;
  if(!mesh.morphTargetDictionary||!mesh.morphTargetInfluences)return;
  for(const [name,weight] of Object.entries(weights)){
   const idx=mesh.morphTargetDictionary[name];
   if(idx!==undefined){mesh.morphTargetInfluences[idx]=weight;changed++;}
  }
 });
 return changed;
}
function poseAngles(settings:AvatarSettings):Record<string,THREE.Euler>{
 const s=decodeAvatar(settings);
 const d=Math.PI/180;
 const left=s.leftArm+(s.pose==='arms-up'?80:s.pose==='hands-on-hips'?28:0);
 const right=s.rightArm+(s.pose==='arms-up'?80:s.pose==='hands-on-hips'?28:0);
 const e=(x=0,y=0,z=0)=>new THREE.Euler(x*d,y*d,z*d,'XYZ');
 return {
  upperarm_l:e(0,0,left), upperarm_r:e(0,0,-right),
  lowerarm_l:e(s.pose==='hands-on-hips'?-48:0),lowerarm_r:e(s.pose==='hands-on-hips'?-48:0),
  spine_01:e(0,s.pose==='walking'?8:0),
  thigh_l:e(s.pose==='walking'?24:0),thigh_r:e(s.pose==='walking'?-21:0),
  calf_l:e(s.pose==='walking'?-18:0),calf_r:e(s.pose==='walking'?16:0)
 };
}
/** Animate BODY AND CLOTHING bones by name, always relative to their bind pose. */
export function applyAvatarPose(rest:Map<THREE.Bone,THREE.Quaternion>,settings:AvatarSettings):number{
 const pose=poseAngles(settings);
 let touched=0;
 for(const [bone,base] of rest){
  const offset=pose[bone.name]||new THREE.Euler();
  bone.quaternion.copy(base).multiply(new THREE.Quaternion().setFromEuler(offset));
  bone.updateMatrix();touched++;
 }
 return touched;
}
/** Symmetric placement for the body and matched garment as one scene. */
export function applyAvatarPlacement(scene:THREE.Group,original:THREE.Vector3,settings:AvatarSettings){
 const s=decodeAvatar(settings);
 scene.position.copy(original).add(new THREE.Vector3(s.positionX,s.positionY,s.positionZ));
 scene.rotation.y=s.turn*Math.PI/180;
}

export type JointMorphData={
 version:number;rig:string;
 bones:Record<string,[number,number,number]>;
 morphs:Record<string,Record<string,[number,number,number]>>
};
export function validJointMorphData(value:unknown):value is JointMorphData{
 if(!value||typeof value!=='object')return false;
 const v=value as Partial<JointMorphData>;
 return v.version===1&&v.rig==='game_engine'&&typeof v.bones==='object'&&!!v.bones&&
  typeof v.morphs==='object'&&!!v.morphs&&Object.keys(v.bones).length>=40;
}
export function captureBoneRestPositions(root:THREE.Object3D):Map<THREE.Bone,THREE.Vector3>{
 const rest=new Map<THREE.Bone,THREE.Vector3>();
 root.traverse(o=>{if((o as THREE.Bone).isBone)rest.set(o as THREE.Bone,(o as THREE.Bone).position.clone());});
 return rest;
}
/**
 * Independently align the CC0 generated skeleton's bind joints with CC0 morph
 * displacements. The joint sidecar is *data*, not upstream GPL runtime code.
 * Recalculate skin inverse bind matrices at the MORPHED REST pose, then apply
 * controlled pose offsets. Body and clothing skeletons are each rebound.
 */
export function rebaseAvatarSkeleton(
 root:THREE.Object3D,restPositions:Map<THREE.Bone,THREE.Vector3>,
 data:JointMorphData,settings:AvatarSettings
):number{
 const weights=avatarMorphWeights(settings);
 const delta=(name:string)=>{
  const d=new THREE.Vector3();
  for(const [m,w] of Object.entries(weights)){
   const v=data.morphs[m]?.[name];
   if(v&&w>0)d.addScaledVector(new THREE.Vector3(v[0],v[1],v[2]),w);
  }
  return d;
 };
 let count=0;
 root.updateWorldMatrix(true,true);
 for(const [bone,baseline] of restPositions){
  bone.position.copy(baseline);
  if(!data.bones[bone.name])continue;
  const parent=(bone.parent as THREE.Bone|null);
  const offset=delta(bone.name);
  if(parent?.isBone)offset.sub(delta(parent.name));
  if(parent){
   const q=new THREE.Quaternion();
   parent.getWorldQuaternion(q);
   offset.applyQuaternion(q.invert());
  }
  bone.position.add(offset);
  count++;
 }
 root.updateWorldMatrix(true,true);
 const skeletons=new Set<THREE.Skeleton>();
 root.traverse(o=>{const mesh=o as THREE.SkinnedMesh;if(mesh.isSkinnedMesh)skeletons.add(mesh.skeleton);});
 for(const skeleton of skeletons)skeleton.calculateInverses();
 return count;
}
