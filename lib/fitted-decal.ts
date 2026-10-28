import * as THREE from 'three';
import type {Side} from './studio-document';

/**
 * Sample the existing garment triangles to make a chest graphic that follows actual fabric curvature.
 * All measurements are relative to the pinned visual-reference garment; none are printer dimensions.
 * Keeping the print as its own mesh avoids accidentally sampling unrelated source UV islands.
 */
export type ChestPatch={geometry:THREE.BufferGeometry;coverage:number;hitCount:number};
export type ChestRegion={centerY:number;width:number;height:number};
export const CHEST_PRINT_REGION:ChestRegion={centerY:1.215,width:.36,height:.33};

export function makeFittedChestPatch(
 source:THREE.BufferGeometry,side:Side,region:ChestRegion=CHEST_PRINT_REGION,
 cols=30,rows=26
):ChestPatch{
 if(cols<2||rows<2||cols>128||rows>128||region.width<=0||region.height<=0)throw Error('Invalid print tessellation');
 // The printed garment is displayed at rest. Sample its vertex surface directly, rather than
 // allowing the GLTF skeleton's separate bind/pose transformations to corrupt a decal ray.
 const probe=new THREE.Mesh(source,new THREE.MeshBasicMaterial());
 probe.updateMatrixWorld(true);
 const caster=new THREE.Raycaster();
 const points:number[]=[],texcoords:number[]=[],valid:boolean[]=[];
 const originZ=side==='front'?1:-1,dirZ=side==='front'?-1:1;
 let count=0;
 for(let j=0;j<=rows;j++){
  const t=j/rows,y=region.centerY+(0.5-t)*region.height;
  for(let i=0;i<=cols;i++){
   const u=i/cols,x=(u-.5)*region.width;
   caster.set(new THREE.Vector3(x,y,originZ),new THREE.Vector3(0,0,dirZ));
   caster.far=2;
   const hits=caster.intersectObject(probe,false);
   // Ignore unexpected side/back triangles. Shirt torso front has positive z, back negative.
   const hit=hits.find(h=>side==='front'?h.point.z>.04:h.point.z<-.025);
   const good=Boolean(hit);
   valid.push(good);
   if(good)count++;
   const z=hit?hit.point.z+ (side==='front'?.006:-.006):0;
   points.push(x,y,z);
   // The camera sees the back horizontally mirrored, so reverse U just once.
   texcoords.push(side==='front'?u:1-u,1-t);
  }
 }
 const indices:number[]=[];
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
  const a=j*(cols+1)+i,b=a+1,c=a+(cols+1),d=c+1;
  if(valid[a]&&valid[b]&&valid[c])indices.push(a,c,b);
  if(valid[b]&&valid[d]&&valid[c])indices.push(b,c,d);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(texcoords,2));
 geo.setIndex(indices);
 geo.computeVertexNormals();
 geo.computeBoundingBox();
 probe.material.dispose();
 return {geometry:geo,coverage:count/((cols+1)*(rows+1)),hitCount:count};
}
