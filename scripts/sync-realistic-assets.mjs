/** Download only generated CC0 assets. Never copy or bundle GPL source code from CharacterCreator. */
import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const upstream='852e48f316b90a0937234886630e4fb4cdfd1f78';
const baseUrl='https://raw.githubusercontent.com/kblood/CharacterCreator/'+upstream+'/output/';
export const models=[
 {name:'base_body.glb',sha:'a5632913dddae4f7f50188e9f8eb273b78d7d1b0',min:1_000_000},
 {name:'clothing_tshirt.glb',sha:'ce7966dfd52c4bc6158e1e3b21969e6a63b066da',min:100_000},
 {name:'clothing_hoodie.glb',sha:'85999d3584078c11e9e4637ea53d88b150a775c3',min:100_000}
];
const folder=join(process.cwd(),'public','models','realistic');
function verifyBlob(bytes,expected,min){
 if(bytes.byteLength<min||bytes.subarray(0,4).toString('utf8')!=='glTF')return false;
 const size=bytes.readUInt32LE(8);
 if(size!==bytes.length)return false;
 const prefix=Buffer.from('blob '+bytes.length+'\0');
 return createHash('sha1').update(prefix).update(bytes).digest('hex')===expected;
}
const required=process.env.REQUIRE_REALISTIC_ASSETS==='1';
let failures=0;
await mkdir(folder,{recursive:true});
for(const item of models){
 try{
  const file=join(folder,item.name);
  const cached=await readFile(file).catch(()=>null);
  if(cached&&verifyBlob(cached,item.sha,item.min)){console.log('Verified CC0 avatar asset from cache: '+item.name);continue;}
  const response=await fetch(baseUrl+item.name,{signal:AbortSignal.timeout(45000)});
  if(!response.ok)throw Error('HTTP '+response.status);
  const bytes=Buffer.from(await response.arrayBuffer());
  if(!verifyBlob(bytes,item.sha,item.min))throw Error('Asset integrity mismatch: '+item.name);
  await writeFile(file,bytes);
  console.log('Verified CC0 model '+item.name+' ('+bytes.length+' bytes)');
 }catch(e){
  failures++;
  console.warn('Realistic reference model unavailable ('+item.name+'): '+String(e));
 }
}
if(failures&&required)process.exitCode=1;
