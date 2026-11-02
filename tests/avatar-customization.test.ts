import {describe,it,expect} from 'vitest';
import * as THREE from 'three';
import {DEFAULT_AVATAR,decodeAvatar,avatarMorphWeights,avatarCapabilities,applyAvatarMorphs,captureRestPose,applyAvatarPose,applyAvatarPlacement,captureBoneRestPositions,rebaseAvatarSkeleton,validJointMorphData} from '../lib/avatar-customization';
import {initialDocument,decodeDocument,modify} from '../lib/studio-document';

describe('editable human avatar — truthful CC0 rig and body controls',()=>{
 it('clamps malicious values and rejects unsupported age/shape/pose/placement',()=>{
  const x=decodeAvatar({presentation:'alien',age:7,heightCm:999,size:'XXXXXXXX',pose:'flying',leftArm:Infinity,turn:720,positionY:-100});
  expect(x).toMatchObject({presentation:'masculine',age:18,heightCm:205,size:'M',pose:'neutral',leftArm:0,turn:180,positionY:-.4});
  expect(decodeAvatar(null)).toEqual(DEFAULT_AVATAR);
 });
 it('maps body presentation, adult age, stature and sizing to documented public morph names',()=>{
  const female=avatarMorphWeights({...DEFAULT_AVATAR,presentation:'feminine',age:75,heightCm:200,size:'XXL'});
  expect(female.gender_female).toBe(1);expect(female.gender_male).toBe(0);
  expect(female.age_old).toBeGreaterThan(.5);
  expect(female.age_child).toBe(0);
  expect(female.weight_max).toBeGreaterThan(0);
  expect(female.height_tall).toBeGreaterThan(0);
  const smaller=avatarMorphWeights({...DEFAULT_AVATAR,heightCm:155,size:'XS',age:18});
  expect(smaller.weight_min).toBeGreaterThan(0);
  expect(smaller.height_short).toBeGreaterThan(0);
  expect(smaller.age_child).toBeLessThanOrEqual(.12);
 });
 it('updates actual named morph influences and includes only available correctives',()=>{
  const body=new THREE.Group(),clothing=new THREE.Group();
  const names=['gender_male','gender_female','weight_max','age_old','corr_gender_female__age_old'];
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(),new THREE.MeshStandardMaterial());
  mesh.morphTargetDictionary=Object.fromEntries(names.map((n,i)=>[n,i]));
  mesh.morphTargetInfluences=names.map(()=>0);
  body.add(mesh);
  expect(avatarCapabilities(body,clothing)).toMatchObject({morphs:true,clothingMorphs:false,rig:false});
  const n=applyAvatarMorphs(body,{...DEFAULT_AVATAR,presentation:'feminine',age:80,size:'XXL'});
  expect(n).toBeGreaterThan(3);
  expect(mesh.morphTargetInfluences![1]).toBe(1);
  expect(mesh.morphTargetInfluences![4]).toBeGreaterThan(0);
 });
 it('applies poses relative to rest without accumulating rotation and places the entire human',()=>{
  const root=new THREE.Group();
  const arm=new THREE.Bone();arm.name='upperarm_l';
  const other=new THREE.Bone();other.name='upperarm_r';
  root.add(arm,other);
  const rest=captureRestPose(root);
  const raised={...DEFAULT_AVATAR,pose:'arms-up' as const,leftArm:20,rightArm:12,turn:45,positionX:1.2};
  expect(applyAvatarPose(rest,raised)).toBe(2);
  const angle=arm.quaternion.clone();
  expect(angle.equals(rest.get(arm)!)).toBe(false);
  applyAvatarPose(rest,raised);
  expect(arm.quaternion.angleTo(angle)).toBeCloseTo(0,5);
  applyAvatarPose(rest,DEFAULT_AVATAR);
  expect(arm.quaternion.angleTo(rest.get(arm)!)).toBeCloseTo(0,5);
  const origin=new THREE.Vector3(1,2,3);
  applyAvatarPlacement(root,origin,raised);
  expect(root.position.x).toBeCloseTo(2.2);
  expect(root.rotation.y).toBeCloseTo(Math.PI/4);
 });
 it('rebases joint offsets using pinned-style CC0 joint data without accumulating adjustments',()=>{
  const root=new THREE.Group(),pelvis=new THREE.Bone(),upperarm=new THREE.Bone();
  pelvis.name='pelvis';upperarm.name='upperarm_l';root.add(pelvis);pelvis.add(upperarm);
  pelvis.position.set(0,.9,0);upperarm.position.set(.2,.4,0);
  const positions=captureBoneRestPositions(root);
  const j={version:1,rig:'game_engine',
   bones:Object.fromEntries(Array.from({length:40},(_,i)=>['bone_'+i,[0,0,0]])) as Record<string,[number,number,number]>,
   morphs:{gender_female:{pelvis:[0,-.04,0],upperarm_l:[-.04,-.08,0]}}};
  j.bones.pelvis=[0,.9,0];j.bones.upperarm_l=[.2,1.3,0];
  expect(validJointMorphData(j)).toBe(true);
  const config={...DEFAULT_AVATAR,presentation:'feminine' as const};
  expect(rebaseAvatarSkeleton(root,positions,j,config)).toBe(2);
  expect(pelvis.position.y).toBeCloseTo(.86);
  expect(upperarm.position.x).toBeCloseTo(.16);
  expect(upperarm.position.y).toBeCloseTo(.36);
  rebaseAvatarSkeleton(root,positions,j,config);
  expect(upperarm.position.x).toBeCloseTo(.16);
  rebaseAvatarSkeleton(root,positions,j,DEFAULT_AVATAR);
  expect(upperarm.position.x).toBeCloseTo(.2);
 });
 it('saves avatar age, gender presentation, pose, movement, and coordinates without breaking older documents',()=>{
  const old=initialDocument();
  delete old.avatar;
  expect(decodeDocument(JSON.stringify(old)).avatar).toEqual(DEFAULT_AVATAR);
  const customized=modify(old,d=>{d.avatar={...DEFAULT_AVATAR,presentation:'feminine',age:64,pose:'walking',leftArm:31,positionX:1}});
  const loaded=decodeDocument(JSON.stringify(customized));
  expect(loaded.avatar).toMatchObject({presentation:'feminine',age:64,pose:'walking',leftArm:31,positionX:1});
  expect(old.avatar).toBeUndefined();
  expect(loaded.layers).toEqual(old.layers);
 });
});
