import * as THREE from 'three';

/**
 * A folded hood panel joined to the upper back and neckline of the procedural
 * garment. No floating sphere, separate hood avatar, or garment simulation.
 * Low-poly, continuous surface intended only for visual concept mockups.
 */
export function createFoldedHoodGeometry():THREE.BufferGeometry{
 const contour=[
  {y:.60,width:.47,z:-.355},
  {y:.68,width:.47,z:-.400},
  {y:.77,width:.40,z:-.485},
  {y:.85,width:.32,z:-.415},
  {y:.915,width:.245,z:-.255}
 ];
 const horizontal=28,verts:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let row=0;row<contour.length;row++){
  const shape=contour[row];
  for(let col=0;col<=horizontal;col++){
   const u=col/horizontal,x=(u*2-1)*shape.width;
   const centerWeight=Math.max(0,1-Math.pow((u-.5)*2,2));
   verts.push(x,shape.y+.017*centerWeight,shape.z-.018*centerWeight);
   uv.push(u,row/(contour.length-1));
  }
 }
 for(let row=0;row<contour.length-1;row++)for(let col=0;col<horizontal;col++){
  const a=row*(horizontal+1)+col,b=a+1,c=a+horizontal+1,d=c+1;
  indices.push(a,c,b,b,c,d);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(indices);geo.computeVertexNormals();geo.computeBoundingBox();
 return geo;
}
