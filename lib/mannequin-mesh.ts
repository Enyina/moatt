import * as THREE from 'three';

export type LimbSection={x:number;y:number;z:number;radius:number;depth?:number};
/** Continuous anatomical-looking display limb, with gentle joint taper rather than exposed cylinders and spheres. */
export function makeSmoothLimb(sections:LimbSection[],radial=16,lengthSegments=24):THREE.BufferGeometry{
 if(sections.length<2||radial<8||radial>64||lengthSegments<4||lengthSegments>128||
  sections.some(p=>![p.x,p.y,p.z,p.radius,p.depth??p.radius].every(Number.isFinite)||p.radius<=0))
  throw Error('Invalid mannequin limb dimensions');
 const control=sections.map(p=>new THREE.Vector3(p.x,p.y,p.z));
 const curve=new THREE.CatmullRomCurve3(control,false,'centripetal');
 const position:number[]=[],indices:number[]=[],uv:number[]=[];
 for(let i=0;i<=lengthSegments;i++){
  const t=i/lengthSegments;
  const center=curve.getPoint(t),tangent=curve.getTangent(t).normalize();
  const first=new THREE.Vector3().crossVectors(tangent,new THREE.Vector3(0,0,1)).normalize();
  const second=new THREE.Vector3().crossVectors(tangent,first).normalize();
  const sectionPosition=t*(sections.length-1);
  const a=Math.min(sections.length-2,Math.floor(sectionPosition)),alpha=sectionPosition-a;
  // Monotone cubic interpolation: smoothly transitions shoulders, wrists, knees
  // without the visible linear radius kinks or Catmull-Rom radius overshoot.
  const dimension=(value:(index:number)=>number)=>{
   const v0=value(a),v1=value(a+1);
   const slope=(i:number)=>{
    if(i===0)return value(1)-value(0);
    if(i===sections.length-1)return value(i)-value(i-1);
    const previous=value(i)-value(i-1),next=value(i+1)-value(i);
    if(previous*next<=0)return 0;
    return Math.sign(previous)*Math.min(Math.abs(previous),Math.abs(next));
   };
   const m0=slope(a),m1=slope(a+1),u=alpha,u2=u*u,u3=u2*u;
   return Math.max(.005,(2*u3-3*u2+1)*v0+(u3-2*u2+u)*m0+(-2*u3+3*u2)*v1+(u3-u2)*m1);
  };
  const radius=dimension(i=>sections[i].radius);
  const depth=dimension(i=>sections[i].depth??sections[i].radius);
  for(let j=0;j<=radial;j++){
   const theta=j/radial*Math.PI*2;
   const point=center.clone().addScaledVector(first,Math.cos(theta)*radius).addScaledVector(second,Math.sin(theta)*depth);
   position.push(point.x,point.y,point.z);uv.push(j/radial,t);
  }
 }
 for(let i=0;i<lengthSegments;i++)for(let j=0;j<radial;j++){
  const a=i*(radial+1)+j,b=a+1,c=a+radial+1,d=c+1;
  indices.push(a,b,c,b,d,c);
 }
 const geom=new THREE.BufferGeometry();
 // End caps close visible scalp/hand/ankle openings. The endpoints of hidden
 // sections may overlap the torso, but no naked circular cut should show.
 const topIndex=position.length/3;
 const top=sections[0];position.push(top.x,top.y,top.z);uv.push(.5,0);
 const bottomIndex=position.length/3;
 const bottom=sections[sections.length-1];position.push(bottom.x,bottom.y,bottom.z);uv.push(.5,1);
 for(let j=0;j<radial;j++){
  indices.push(topIndex,j+1,j);
  const last=lengthSegments*(radial+1);
  indices.push(bottomIndex,last+j,last+j+1);
 }
 geom.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geom.setIndex(indices);geom.computeVertexNormals();
 // UV seams duplicate a vertex. Average their normals so lighting stays smooth
 // when viewed from the rear and at extreme mobile camera angles.
 const normals=geom.getAttribute('normal') as THREE.BufferAttribute;
 for(let i=0;i<=lengthSegments;i++){
  const a=i*(radial+1),b=a+radial;
  const normal=new THREE.Vector3(normals.getX(a)+normals.getX(b),normals.getY(a)+normals.getY(b),normals.getZ(a)+normals.getZ(b)).normalize();
  normals.setXYZ(a,normal.x,normal.y,normal.z);normals.setXYZ(b,normal.x,normal.y,normal.z);
 }
 normals.needsUpdate=true;
 geom.computeBoundingBox();
 return geom;
}
/** Both sides include the whole arm and hand; no visually exposed elbow or wrist joint. */
export function mannequinArm(sign:-1|1):THREE.BufferGeometry{
 return makeSmoothLimb([
  {x:sign*.33,y:2.23,z:0,radius:.145,depth:.142},
  {x:sign*.71,y:2.06,z:.01,radius:.171,depth:.157},
  {x:sign*.90,y:1.79,z:.025,radius:.126,depth:.133},
  {x:sign*.96,y:1.60,z:.045,radius:.129,depth:.122},
  {x:sign*1.04,y:1.31,z:.08,radius:.087,depth:.095},
  {x:sign*1.06,y:1.16,z:.11,radius:.107,depth:.06},
  {x:sign*1.095,y:.96,z:.16,radius:.059,depth:.048},
 ],18,32);
}
export function mannequinLeg(sign:-1|1):THREE.BufferGeometry{
 return makeSmoothLimb([
  {x:sign*.245,y:1.13,z:0,radius:.225,depth:.225},
  {x:sign*.255,y:.94,z:0,radius:.215,depth:.205},
  {x:sign*.270,y:.69,z:.015,radius:.185,depth:.17},
  {x:sign*.28,y:.47,z:.025,radius:.142,depth:.151},
  {x:sign*.285,y:.20,z:.05,radius:.154,depth:.145},
  {x:sign*.285,y:-.13,z:.08,radius:.108,depth:.115},
  {x:sign*.28,y:-.22,z:.10,radius:.104,depth:.107},
 ],20,32);
}

export function mannequinTorso():THREE.BufferGeometry{
 return makeSmoothLimb([
  {x:0,y:2.70,z:.025,radius:.098,depth:.108},
  {x:0,y:2.57,z:.018,radius:.135,depth:.129},
  {x:0,y:2.44,z:0,radius:.191,depth:.159},
  {x:0,y:2.31,z:0,radius:.475,depth:.27},
  {x:0,y:2.17,z:-.01,radius:.565,depth:.292},
  {x:0,y:1.86,z:-.02,radius:.535,depth:.278},
  {x:0,y:1.54,z:0,radius:.45,depth:.235},
  {x:0,y:1.29,z:0,radius:.41,depth:.24},
  {x:0,y:1.06,z:.01,radius:.48,depth:.27},
  {x:0,y:.97,z:.01,radius:.39,depth:.235},
 ],32,40);
}
/** A balanced, neutral faceless head: closer to 7.5 heads in the full figure. */
export function mannequinHead():THREE.BufferGeometry{
 return makeSmoothLimb([
  {x:0,y:3.11,z:-.008,radius:.018,depth:.028},
  {x:0,y:3.075,z:-.008,radius:.105,depth:.125},
  {x:0,y:3.008,z:0,radius:.176,depth:.181},
  {x:0,y:2.910,z:.008,radius:.201,depth:.202},
  {x:0,y:2.817,z:.017,radius:.197,depth:.202},
  {x:0,y:2.752,z:.025,radius:.168,depth:.179},
  {x:0,y:2.688,z:.030,radius:.104,depth:.125},
  {x:0,y:2.651,z:.033,radius:.041,depth:.060}
 ],40,36);
}

/** Only skin outside the sleeve should remain visible; otherwise matte shoulder geometry clips through clothing. */
export function mannequinExposedArm(sign:-1|1,sleeve:'short'|'long'):THREE.BufferGeometry{
 if(sleeve==='long'){
  return makeSmoothLimb([
   {x:sign*1.03,y:1.23,z:.07,radius:.091,depth:.092},
   {x:sign*1.055,y:1.16,z:.1,radius:.092,depth:.075},
   {x:sign*1.095,y:.96,z:.16,radius:.059,depth:.048}
  ],16,12);
 }
 return makeSmoothLimb([
  {x:sign*.89,y:1.84,z:.02,radius:.129,depth:.137},
  {x:sign*.95,y:1.60,z:.045,radius:.126,depth:.121},
  {x:sign*1.04,y:1.32,z:.08,radius:.086,depth:.095},
  {x:sign*1.06,y:1.16,z:.1,radius:.106,depth:.06},
  {x:sign*1.095,y:.96,z:.16,radius:.059,depth:.048}
 ],18,24);
}
