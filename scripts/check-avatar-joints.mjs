import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const path='public/models/realistic/base_body.joints.json';
const expected='85c678206c9978215d3009a6ac476d93f57652b0';
const content=readFileSync(path);
const sha=createHash('sha1').update(Buffer.from('blob '+content.length+'\0')).update(content).digest('hex');
if(sha!==expected)throw Error('Pinned CC0 joint sidecar integrity mismatch');
const json=JSON.parse(content.toString('utf8'));
if(json.rig!=='game_engine'||json.version!==1||Object.keys(json.bones).length<40)
 throw Error('Joint rig schema mismatch');
console.log('Verified pinned CC0 avatar joint calibration ('+Object.keys(json.bones).length+' bones)');
