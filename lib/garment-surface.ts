import * as THREE from 'three';

/**
 * Gives a triangulated garment art panel a modest rounded body shape.
 * This is visual geometry, not fabric physics or a validated pattern.
 * A separate reversed-UV panel keeps lettering readable when viewed from behind.
 */
export function curvedArtworkSurface(input:THREE.BufferGeometry,halfWidth:number,bottom:number,mirrorU=false,subdivisions=5):THREE.BufferGeometry{
 if(!Number.isFinite(halfWidth)||halfWidth<=0||!Number.isFinite(bottom)||subdivisions<1||subdivisions>12)
  throw Error('Invalid preview surface parameters');
 const positions=input.getAttribute('position'),uvs=input.getAttribute('uv'),indices=input.getIndex();
 if(!positions||!uvs)throw Error('Garment surface is missing layout data');
 const triangles=indices?indices.count/3:positions.count/3;
 const points:number[]=[],uv:number[]=[];
 const vertex=(i:number)=>({x:positions.getX(i),y:positions.getY(i),u:uvs.getX(i),v:uvs.getY(i)});
 const curve=(x:number,y:number)=>{
  const normalizedX=Math.min(1,Math.abs(x)/(1.05*halfWidth));
  const height=Math.min(1,Math.max(0,(y-bottom)/(1.04-bottom)));
  return 0.16*(1-normalizedX*normalizedX)*Math.sin(Math.PI*height);
 };
 for(let tri=0;tri<triangles;tri++){
  const a=vertex(indices?indices.getX(tri*3):tri*3);
  const b=vertex(indices?indices.getX(tri*3+1):tri*3+1);
  const c=vertex(indices?indices.getX(tri*3+2):tri*3+2);
  const point=(i:number,j:number)=>{
   const t=i/subdivisions,s=j/subdivisions;
   return {x:a.x+(b.x-a.x)*t+(c.x-a.x)*s,y:a.y+(b.y-a.y)*t+(c.y-a.y)*s,
    u:a.u+(b.u-a.u)*t+(c.u-a.u)*s,v:a.v+(b.v-a.v)*t+(c.v-a.v)*s};
  };
  const emit=(p:{x:number;y:number;u:number;v:number})=>{
   points.push(p.x,p.y,curve(p.x,p.y));uv.push(mirrorU?1-p.u:p.u,p.v);
  };
  for(let i=0;i<subdivisions;i++)for(let j=0;j<subdivisions-i;j++){
   emit(point(i,j));emit(point(i+1,j));emit(point(i,j+1));
   if(i+j<subdivisions-1){
    emit(point(i+1,j));emit(point(i+1,j+1));emit(point(i,j+1));
   }
  }
 }
 const surface=new THREE.BufferGeometry();
 surface.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
 surface.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 surface.computeVertexNormals();
 surface.computeBoundingBox();
 return surface;
}
