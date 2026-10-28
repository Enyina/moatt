import * as THREE from 'three';

export type GarmentShape={
 garment:'tshirt'|'hoodie';
 fit:'regular'|'oversized';
 sleeve:'short'|'long';
 hem:'standard'|'cropped';
 neck:'crew'|'wide';
};
export type GarmentMeshSet={
 front:THREE.BufferGeometry;
 back:THREE.BufferGeometry;
 sleeves:[THREE.BufferGeometry,THREE.BufferGeometry];
 neckBand:THREE.BufferGeometry;
 hemBand:THREE.BufferGeometry;
 cuffBands:[THREE.BufferGeometry,THREE.BufferGeometry];
};
export function garmentDimensions(shape:GarmentShape){
 const ease=shape.fit==='oversized'?1.16:1;
 const hem=shape.hem==='cropped'?-.19:shape.garment==='hoodie'?-.59:-.48;
 const neckline=shape.neck==='wide'?.42:.315;
 return {ease,hem,neckline,top:.90};
}
type BodyRing={y:number;rx:number;rz:number;centerZ:number};
/** Smooth profile with a genuine open neck and softly lowered shoulders. */
export function torsoProfile(shape:GarmentShape):BodyRing[]{
 const {ease,hem,neckline}=garmentDimensions(shape);
 return [
  {y:hem,rx:.81*ease,rz:.32*ease,centerZ:.015},
  {y:hem+.09,rx:.83*ease,rz:.34*ease,centerZ:.008},
  {y:Math.max(hem+.22,-.08),rx:.86*ease,rz:.37*ease,centerZ:0},
  {y:.23,rx:.89*ease,rz:.39*ease,centerZ:0},
  {y:.51,rx:.97*ease,rz:.405*ease,centerZ:0},
  {y:.72,rx:1.01*ease,rz:.38*ease,centerZ:-.012},
  {y:.81,rx:.89*ease,rz:.33*ease,centerZ:-.025},
  {y:.86,rx:neckline*1.52,rz:.245,centerZ:-.025},
  {y:.90,rx:neckline,rz:.21,centerZ:-.025}
 ];
}
function profileAt(profiles:BodyRing[],t:number):BodyRing{
 const y=profiles[0].y+(profiles[profiles.length-1].y-profiles[0].y)*t;
 let end=1;
 while(end<profiles.length-1&&profiles[end].y<y)end++;
 const a=profiles[end-1],b=profiles[end];
 const f=THREE.MathUtils.smoothstep(y,a.y,b.y);
 return {y,rx:THREE.MathUtils.lerp(a.rx,b.rx,f),rz:THREE.MathUtils.lerp(a.rz,b.rz,f),centerZ:THREE.MathUtils.lerp(a.centerZ,b.centerZ,f)};
}
function torsoHalf(shape:GarmentShape,side:'front'|'back',horizontal=24,vertical=32):THREE.BufferGeometry{
 const rings=torsoProfile(shape);
 const {hem,top}=garmentDimensions(shape);
 const verts:number[]=[],uv:number[]=[],idx:number[]=[];
 const start=side==='front'?-Math.PI/2:Math.PI/2;
 for(let y=0;y<=vertical;y++){
  const f=y/vertical,p=profileAt(rings,f);
  const fade=Math.pow(1-f,1.8),ease=shape.fit==='oversized'?1.35:1;
  for(let x=0;x<=horizontal;x++){
   const u=x/horizontal,angle=start+u*Math.PI;
   const sn=Math.sin(angle),cs=Math.cos(angle);
   const seamWeight=Math.max(0,1-Math.abs(sn));
   // Minor body drape and non-uniform hem edge; folds fade near neckline.
   const ripple=.018*ease*fade*Math.sin(sn*11+f*7)+.012*ease*fade*Math.cos(sn*17-f*4);
   const depth=p.rz+ripple*seamWeight;
   const xCoord=sn*(p.rx+.009*fade*Math.sin(sn*15+f*7));
   const yCoord=p.y+.012*fade*Math.cos(sn*8)+(f<.045?.007*Math.cos(sn*12):0);
   verts.push(xCoord,yCoord,p.centerZ+cs*depth);
   uv.push(u,Math.max(0,Math.min(1,(p.y-hem)/(top-hem))));
  }
 }
 for(let row=0;row<vertical;row++)for(let col=0;col<horizontal;col++){
  const a=row*(horizontal+1)+col,b=a+1,c=a+horizontal+1,d=c+1;
  idx.push(a,b,c,b,d,c);
 }
 const geo=new THREE.BufferGeometry();
 geo.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));
 geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geo.setIndex(idx);
 geo.computeVertexNormals();geo.computeBoundingBox();
 return geo;
}
function sleeve(shape:GarmentShape,sign:-1|1,radial=18,longitudinal=18):THREE.BufferGeometry{
 const long=shape.sleeve==='long',ease=shape.fit==='oversized'?1.16:1;
 const from=new THREE.Vector3(sign*.93*ease,.69,0);
 const to=new THREE.Vector3(sign*(long?1.70:1.47)*ease,long?-.40:.34,.035);
 const along=to.clone().sub(from).normalize();
 const across=new THREE.Vector3(0,0,1);
 const up=new THREE.Vector3().crossVectors(along,across).normalize();
 const positions:number[]=[],uv:number[]=[],indices:number[]=[];
 for(let row=0;row<=longitudinal;row++){
  const t=row/longitudinal;
  const center=from.clone().lerp(to,t);
  center.y-=.043*Math.sin(Math.PI*t);
  const r=(.24*(1-t)+(long?.205:.21)*t+.035*Math.sin(Math.PI*t))*ease;
  for(let col=0;col<=radial;col++){
   const angle=2*Math.PI*col/radial;
   const pt=center.clone().addScaledVector(up,Math.cos(angle)*r).addScaledVector(across,Math.sin(angle)*r*.84);
   positions.push(pt.x,pt.y,pt.z);
   uv.push(col/radial,t);
  }
 }
 for(let row=0;row<longitudinal;row++)for(let col=0;col<radial;col++){
  const a=row*(radial+1)+col,b=a+1,c=a+radial+1,d=c+1;
  // The winding points outward for the sleeve axis and side chosen.
  indices.push(a,c,b,b,c,d);
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geometry.setIndex(indices);
 geometry.computeVertexNormals();geometry.computeBoundingBox();
 return geometry;
}
function ellipseBand(xRadius:number,zRadius:number,y:number,tube:number):THREE.BufferGeometry{
 const geom=new THREE.TorusGeometry(1,tube,9,48);
 geom.rotateX(Math.PI/2);
 // Scale the ring without scaling the yarn thickness too drastically.
 const p=geom.getAttribute('position');
 for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*xRadius,p.getY(i)+y,p.getZ(i)*zRadius);
 p.needsUpdate=true;geom.computeVertexNormals();geom.computeBoundingBox();return geom;
}
function sleeveBand(shape:GarmentShape,sign:-1|1):THREE.BufferGeometry{
 const long=shape.sleeve==='long',ease=shape.fit==='oversized'?1.16:1;
 const from=new THREE.Vector3(sign*.93*ease,.69,0),end=new THREE.Vector3(sign*(long?1.70:1.47)*ease,long?-.40:.34,.035);
 const axis=end.clone().sub(from).normalize();
 const ring=new THREE.TorusGeometry((long?.205:.21)*ease,.02,8,24);
 
 ring.rotateX(Math.PI/2);
 ring.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),axis));
 ring.translate(end.x,end.y,end.z);
 ring.computeBoundingBox();
 return ring;
}
export function createGarmentMesh(shape:GarmentShape):GarmentMeshSet{
 const {neckline,hem,ease}=garmentDimensions(shape);
 return {
  front:torsoHalf(shape,'front'),back:torsoHalf(shape,'back'),
  sleeves:[sleeve(shape,-1),sleeve(shape,1)],
  neckBand:ellipseBand(neckline,.21,.899,.047),
  hemBand:ellipseBand(.81*ease,.32*ease,hem+.018,.034),
  cuffBands:[sleeveBand(shape,-1),sleeveBand(shape,1)]
 };
}
export function disposeGarmentMesh(mesh:GarmentMeshSet){
 mesh.front.dispose();mesh.back.dispose();mesh.neckBand.dispose();mesh.hemBand.dispose();
 mesh.sleeves.forEach(g=>g.dispose());mesh.cuffBands.forEach(g=>g.dispose());
}
