import {createHash} from 'node:crypto';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';

const source='https://raw.githubusercontent.com/UMRAM-Bilkent/supine-human-model/main/assets/human_posed.glb';
const gitSha='159784ffb1d1437f42ffb316ccc8e28dcdb64636';
const target=join(process.cwd(),'public','models','mannequin.glb');
function verify(data){
 const header=Buffer.from('blob '+data.length+'\0','utf8');
 return createHash('sha1').update(header).update(data).digest('hex')===gitSha;
}
try{
 const saved=await readFile(target).catch(()=>null);
 if(saved&&verify(saved)){console.log('Verified mannequin asset in cache');process.exit(0);}
 const response=await fetch(source,{signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('Asset request failed: '+response.status);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(!verify(bytes))throw Error('Asset integrity mismatch — refusing unverified model');
 await mkdir(join(process.cwd(),'public','models'),{recursive:true});
 await writeFile(target,bytes);
 console.log('Verified CC0 mannequin asset, '+bytes.length+' bytes');
}catch(error){
 console.warn('Mannequin asset unavailable; use procedural fallback: '+error.message);
 if(process.env.REQUIRE_MANNEQUIN_ASSET==='1')process.exitCode=1;
}
