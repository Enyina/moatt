import {modify,uid} from './studio-document';
import type {Side,StudioDocument,Layer} from './studio-document';

export type IdeaDraft = {
 document: StudioDocument;
 recognized: string[];
 needsReview: string[];
};

/** An offline, rule-based starting point. It is not a generative model or garment simulation. */
const palette: Array<[RegExp,string,string]> = [
 [/\b(black|charcoal)\b/i,'#23262a','black'],
 [/\b(white|ivory)\b/i,'#f5f1e9','white'],
 [/\b(cream|beige|sand)\b/i,'#e9dfc9','cream'],
 [/\b(red|scarlet)\b/i,'#be3340','red'],
 [/\b(blue|navy)\b/i,'#25476c','blue'],
 [/\b(green|olive)\b/i,'#3e624a','green'],
 [/\b(pink|rose)\b/i,'#df93a9','pink'],
 [/\b(purple|violet)\b/i,'#6a4e88','purple'],
 [/\b(yellow|gold)\b/i,'#efc857','yellow'],
 [/\b(orange|rust)\b/i,'#c66a37','orange']
];

export const IDEA_EXAMPLES = [
 'Oversized black hoodie with "MIDNIGHT CLUB" on the front',
 'Cream cotton T-shirt, cropped hem, back text: MADE FOR EVERYDAY',
 'Navy satin hoodie with long sleeves and a wide neckline'
];

export function draftFromIdea(input:string,current:StudioDocument):IdeaDraft {
 const idea=input.trim();
 if(idea.length<8 || idea.length>500)throw Error('Describe your clothing idea in 8 to 500 characters.');
 const recognized:string[]=[];
 const needsReview:string[]=[];
 const next=modify(current,d=>{
  if(/\b(hoodie|hooded sweatshirt)\b/i.test(idea)){
   if(d.garment!=='hoodie'){d.sleeve='long';d.pocket='kangaroo';}
   d.garment='hoodie';recognized.push('hoodie');
  }
  else if(/\b(t-?shirt|tee|shirt)\b/i.test(idea)){
   if(d.garment!=='tshirt'){d.sleeve='short';d.pocket='none';}
   d.garment='tshirt';recognized.push('T-shirt');
  }
  if(/\boversized\b/i.test(idea)){d.fit='oversized';recognized.push('oversized fit');}
  else if(/\bregular fit\b/i.test(idea)){d.fit='regular';recognized.push('regular fit');}
  if(/\blong sleeves?\b/i.test(idea)){d.sleeve='long';recognized.push('long sleeves');}
  else if(/\bshort sleeves?\b/i.test(idea)){d.sleeve='short';recognized.push('short sleeves');}
  if(/\bcropped\b/i.test(idea)){d.hem='cropped';recognized.push('cropped hem');}
  if(/\b(no pocket|without pockets?)\b/i.test(idea)){d.pocket='none';recognized.push('no pocket');}
  if(/\b(kangaroo|pouch) pocket\b/i.test(idea)&&d.garment==='hoodie'){d.pocket='kangaroo';recognized.push('kangaroo pocket');}
  else if(/\b(chest|front) pocket\b/i.test(idea)&&!/\b(no pocket|without pockets?)\b/i.test(idea)){d.pocket='chest';recognized.push('chest pocket');}
  if(/\bwide neck(line)?\b/i.test(idea)){d.neck='wide';recognized.push('wide neckline');}
  if(/\b(cotton|denim|satin)\b/i.test(idea)){const material=idea.match(/\b(cotton|denim|satin)\b/i)![1].toLowerCase() as StudioDocument['material'];d.material=material;recognized.push(material+' appearance');}
  const color=palette.find(([test])=>test.test(idea));
  if(color){d.baseColor=color[1];recognized.push(color[2]+' color');}
  const slogans: Array<{side:Side;value:string}>=[];
  for(const match of idea.matchAll(/["“]([^"”\n]{1,80})["”]/g)){
   if(slogans.length>=2)break;
   const before=idea.slice(Math.max(0,match.index-35),match.index);
   const after=idea.slice(match.index+match[0].length,match.index+match[0].length+25);
   const side:Side=/\bback\b/i.test(before+' '+after)?'back':'front';
   slogans.push({side,value:match[1].trim()});
  }
  if(slogans.length===0){
   for(const match of idea.matchAll(/\b(front|back)\s+(?:text|says|reads)\s*:\s*([^\n.,]{2,80})/gi)){
    slogans.push({side:match[1].toLowerCase() as Side,value:match[2].trim()});
    if(slogans.length>=2)break;
   }
  }
  for(const slogan of slogans){
   if(!slogan.value)continue;
   const layer:Layer={id:uid(),kind:'text',x:190,y:350,width:644,height:190,rotation:0,
    value:slogan.value.slice(0,80),color:d.baseColor.toLowerCase()==='#23262a'?'#f5f1e9':'#23262a',fontSize:126};
   d.layers[slogan.side].push(layer);
   recognized.push(slogan.side+' artwork text');
  }
  if(current.name==='My clothing design'){
   const shade=color?.[2]||'Custom';
   d.name=shade.charAt(0).toUpperCase()+shade.slice(1)+' '+(d.fit==='oversized'?'Oversized ':'')+(d.garment==='hoodie'?'Hoodie':'T-shirt')+' concept';
  }
 });
 if(/\b(logo|photo|sketch|pocket|zipper|embroidery|seam|pattern|printed fabric)\b/i.test(idea))
  needsReview.push('Specific logos, sketches, pockets, seams and garment construction must be added or checked manually.');
 if(!recognized.length)
  needsReview.push('No matching garment settings found. Try specifying a hoodie or T-shirt, fit, fabric or color.');
 needsReview.push('This is a rule-based editable draft, not AI image generation or validated clothing construction.');
 return {document:next,recognized,needsReview};
}
