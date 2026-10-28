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
  const radius=THREE.MathUtils.lerp(sections[a].radius,sections[a+1].radius,alpha);
  const depth=THREE.MathUtils.lerp(sections[a].depth??sections[a].radius,sections[a+1].depth??sections[a+1].radius,alpha);
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
 geom.setAttribute('position',new THREE.Float32BufferAttribute(position,3));
 geom.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 geom.setIndex(indices);geom.computeVertexNormals();geom.computeBoundingBox();
 return geom;
}
/** Both sides include the whole arm and hand; no visually exposed elbow or wrist joint. */
export function mannequinArm(sign:-1|1):THREE.BufferGeometry{
 return makeSmoothLimb([
  {x:sign*.64,y:2.30,z:0,radius:.19,depth:.17},
  {x:sign*.76,y:2.07,z:.01,radius:.16,depth:.155},
  {x:sign*.90,y:1.79,z:.025,radius:.126,depth:.133},
  {x:sign*.96,y:1.60,z:.045,radius:.129,depth:.122},
  {x:sign*1.04,y:1.31,z:.08,radius:.087,depth:.095},
  {x:sign*1.06,y:1.16,z:.11,radius:.107,depth:.06},
  {x:sign*1.06,y:1.04,z:.15,radius:.064,depth:.045},
 ],18,32);
}
export function mannequinLeg(sign:-1|1):THREE.BufferGeometry{
 return makeSmoothLimb([
  {x:sign*.245,y:1.13,z:0,radius:.225,depth:.225},
  {x:sign*.255,y:.94,z:0,radius:.215,depth:.205},
  {x:sign*.270,y:.70,z:.015,radius:.185,depth:.17},
  {x:sign*.28,y:.55,z:.025,radius:.142,depth:.151},
  {x:sign*.285,y:.36,z:.05,radius:.154,depth:.145},
  {x:sign*.285,y:.17,z:.08,radius:.108,depth:.115},
  {x:sign*.28,y:.10,z:.10,radius:.104,depth:.107},
 ],20,32);
}

export function mannequinTorso():THREE.BufferGeometry{
 return makeSmoothLimb([
  {x:0,y:2.48,z:0,radius:.147,depth:.145},
  {x:0,y:2.31,z:0,radius:.45,depth:.255},
  {x:0,y:2.17,z:-.01,radius:.56,depth:.28},
  {x:0,y:1.86,z:-.02,radius:.535,depth:.278},
  {x:0,y:1.54,z:0,radius:.45,depth:.235},
  {x:0,y:1.29,z:0,radius:.41,depth:.24},
  {x:0,y:1.06,z:.01,radius:.48,depth:.27},
  {x:0,y:.97,z:.01,radius:.39,depth:.235},
 ],32,40);
}
export function mannequinHead():THREE.BufferGeometry{
 return makeSmoothLimb([
  {x:0,y:3.16,z:0,radius:.045,depth:.065},
  {x:0,y:3.11,z:0,radius:.145,depth:.155},
  {x:0,y:2.98,z:0,radius:.218,depth:.218},
  {x:0,y:2.83,z:.014,radius:.222,depth:.218},
  {x:0,y:2.73,z:.025,radius:.196,depth:.187},
  {x:0,y:2.63,z:.04,radius:.133,depth:.14},
  {x:0,y:2.60,z:.04,radius:.055,depth:.065},
 ],32,28);
}
