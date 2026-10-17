import {readFile,stat} from 'node:fs/promises';
import {join} from 'node:path';
const root=join(process.cwd(),'out');
const mandatory=['index.html','_next','models/mannequin.glb'];
let failed=false;
for(const path of mandatory){
 try{const s=await stat(join(root,path));if(path.endsWith('.glb')&&s.size<10000)throw Error('suspiciously small asset');console.log('OK '+path+' ('+(s.isDirectory()?'directory':s.size+' bytes')+')');}
 catch(e){failed=true;console.error('MISSING '+path+': '+e.message);}
}
try{
 const html=await readFile(join(root,'index.html'),'utf8');
 if(!html.includes('MOATT'))throw Error('Missing product markup');
 if(/localhost:3000|undefined\/models\//.test(html))throw Error('Unexpected hardcoded runtime URL');
 console.log('OK static entry content');
}catch(e){failed=true;console.error('INVALID static entry: '+e.message);}
if(failed)process.exit(1);
