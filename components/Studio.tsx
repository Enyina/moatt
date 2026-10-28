'use client';
import dynamic from 'next/dynamic';
import {useCallback,useEffect,useRef,useState} from 'react';
import type {ChangeEvent,PointerEvent} from 'react';
import {StudioDocument,Side,Tool,Layer,initialDocument,decodeDocument,modify,uid,clamp,STORAGE_KEY} from '../lib/studio-document';
import {renderArtwork,downloadBlob,savePng} from '../lib/render-design';
import {analyzePrintPlacement,SAFE_REGION} from '../lib/print-guides';
import {analyzeArtworkVisibility,legibleInk} from '../lib/artwork-contrast';
import {draftFromIdea,IDEA_EXAMPLES} from '../lib/design-starter';
import {createSupplierReviewHtml} from '../lib/supplier-review';
import {renderPresentation,PRESENTATION_HEIGHT,PRESENTATION_WIDTH} from '../lib/presentation-render';
import {loadLibrary,saveToLibrary,openFromLibrary,deleteFromLibrary} from '../lib/design-library';
import type {LibraryEntry} from '../lib/design-library';
const Preview=dynamic(()=>import('./GarmentPreview'),{ssr:false,loading:()=> <div className="empty3d">Loading preview…</div>});
type History={past:StudioDocument[];present:StudioDocument;future:StudioDocument[]};
const START:History={past:[],present:initialDocument(),future:[]};
export default function Studio(){
 const [idea,setIdea]=useState(IDEA_EXAMPLES[0]),[ideaFeedback,setIdeaFeedback]=useState('');
 const [modelStyle,setModelStyle]=useState<'studio'|'classic'>('studio');
 const [presentationFocused,setPresentationFocused]=useState(false);
 const [savedDesigns,setSavedDesigns]=useState<LibraryEntry[]>([]);
 const [history,setHistory]=useState<History>(START),[hydrated,setHydrated]=useState(false),[saveError,setSaveError]=useState(''),[side,setSide]=useState<Side>('front'),[tool,setTool]=useState<Tool>('select'),[selected,setSelected]=useState<string|null>(null),[tab,setTab]=useState<'2d'|'3d'|'presentation'>('2d'),[toast,setToast]=useState(''),[brushColor,setBrushColor]=useState('#202329'),[brushWidth,setBrushWidth]=useState(14);
 const doc=history.present;const printIssues=analyzePrintPlacement(doc);const visibilityIssues=analyzeArtworkVisibility(doc);const canvasRef=useRef<HTMLCanvasElement>(null),presentationRef=useRef<HTMLCanvasElement>(null),fileRef=useRef<HTMLInputElement>(null),projectRef=useRef<HTMLInputElement>(null);
 const drag=useRef<{id:string;startX:number;startY:number;originX:number;originY:number;points?:number[]}|null>(null);
 const notify=(text:string)=>{setToast(text);setTimeout(()=>setToast(''),3500)};
 useEffect(()=>{try{
  const saved=localStorage.getItem(STORAGE_KEY);
  if(saved)setHistory({...START,present:decodeDocument(saved)});
  setSavedDesigns(loadLibrary(localStorage));
 }catch(e){setSaveError('Could not restore saved design. '+String(e))}
 setHydrated(true)},[]);
 useEffect(()=>{if(!hydrated)return;try{localStorage.setItem(STORAGE_KEY,JSON.stringify(doc));setSaveError('')}catch{setSaveError('Saving failed. Export your project to avoid losing changes.')}},[doc,hydrated]);
 const commit=useCallback((fn:(draft:StudioDocument)=>void)=>{setHistory(h=>({past:[...h.past.slice(-39),h.present],present:modify(h.present,fn),future:[]}))},[]);
 const undo=()=>setHistory(h=>h.past.length?{past:h.past.slice(0,-1),present:h.past[h.past.length-1],future:[h.present,...h.future]}:h);
 const redo=()=>setHistory(h=>h.future.length?{past:[...h.past,h.present],present:h.future[0],future:h.future.slice(1)}:h);
 const current=doc.layers[side],active=current.find(l=>l.id===selected);
 const layerAdd=(layer:Layer)=>{commit(d=>{d.layers[side].push(layer)});setSelected(layer.id);setTool('select')};
 const update=(id:string,patch:Partial<Layer>)=>commit(d=>{const l=d.layers[side].find(l=>l.id===id);if(l&&!l.locked)Object.assign(l,patch)});
 const position=(e:PointerEvent<HTMLCanvasElement>)=>{const r=e.currentTarget.getBoundingClientRect();return {x:clamp((e.clientX-r.left)*1024/r.width,0,1024),y:clamp((e.clientY-r.top)*1024/r.height,0,1024)}};
 const paint=useCallback(async()=>{const canvas=canvasRef.current;if(!canvas)return;try{const image=await renderArtwork(doc,side);const ctx=canvas.getContext('2d');if(ctx){ctx.clearRect(0,0,1024,1024);ctx.drawImage(image,0,0)}}catch(e){setSaveError('Preview rendering failed: '+String(e))}},[doc,side]);
 useEffect(()=>{void paint()},[paint]);
 const hit=(p:{x:number;y:number})=>[...current].reverse().find(l=>{if(l.hidden||l.locked)return false;if(l.kind==='stroke'){const pts=l.points||[];for(let i=0;i<pts.length;i+=2){if(Math.hypot(p.x-(l.x+pts[i]),p.y-(l.y+pts[i+1]))<18)return true}return false}return p.x>=l.x&&p.x<=l.x+l.width&&p.y>=l.y&&p.y<=l.y+l.height;});
 const pointerDown=(e:PointerEvent<HTMLCanvasElement>)=>{const p=position(e);e.currentTarget.setPointerCapture(e.pointerId);if(tool==='draw'){const id=uid();drag.current={id,startX:p.x,startY:p.y,originX:p.x,originY:p.y,points:[0,0]};return}if(tool==='erase'){const target=hit(p);if(target){commit(d=>{d.layers[side]=d.layers[side].filter(l=>l.id!==target.id)});setSelected(null)}return}const target=hit(p);setSelected(target?.id||null);if(target)drag.current={id:target.id,startX:p.x,startY:p.y,originX:target.x,originY:target.y}};
 const pointerMove=(e:PointerEvent<HTMLCanvasElement>)=>{if(!drag.current)return;const p=position(e);if(tool==='draw'&&drag.current.points){drag.current.points.push(p.x-drag.current.originX,p.y-drag.current.originY);const c=canvasRef.current?.getContext('2d');if(c){const pts=drag.current.points;c.strokeStyle=brushColor;c.lineWidth=brushWidth;c.lineCap='round';c.beginPath();if(pts.length>2){c.moveTo(drag.current.originX+pts[pts.length-4],drag.current.originY+pts[pts.length-3]);c.lineTo(p.x,p.y);c.stroke();}}}else if(tool==='select'){const d=drag.current;const el=document.querySelector('[data-layer-id="'+d.id+'"]') as HTMLElement|null;if(el)el.style.transform='translate('+((p.x-d.startX)*100/1024)+'%, '+((p.y-d.startY)*100/1024)+'%)';}};
 const pointerUp=(e:PointerEvent<HTMLCanvasElement>)=>{const d=drag.current;drag.current=null;if(!d)return;const p=position(e);if(tool==='draw'&&d.points){const layer:Layer={id:d.id,kind:'stroke',x:d.originX,y:d.originY,width:1024,height:1024,rotation:0,value:'',color:brushColor,fontSize:brushWidth,points:d.points};commit(x=>x.layers[side].push(layer));setSelected(d.id);return;}if(tool==='select'){const nx=clamp(d.originX+p.x-d.startX,-1024,2048),ny=clamp(d.originY+p.y-d.startY,-1024,2048);if(nx!==d.originX||ny!==d.originY)update(d.id,{x:nx,y:ny});else{const el=document.querySelector('[data-layer-id="'+d.id+'"]') as HTMLElement|null;if(el)el.style.transform='';}}};
 const storeDesign=()=>{try{
  const saved=saveToLibrary(localStorage,doc);
  setSavedDesigns(saved);notify('Design saved in your browser library. Download a backup for safety.');
 }catch(e){notify('Could not save design: '+String(e));}};
 const openDesign=(id:string)=>{
  if(!window.confirm('Open this saved design? Your current design will stay in browser autosave only until you save it to the library or export it.'))return;
  try{const next=openFromLibrary(localStorage,id);
   setHistory(h=>({past:[...h.past.slice(-39),h.present],present:next,future:[]}));
   setSelected(null);setSide('front');setTool('select');setTab('2d');notify('Design opened.');
  }catch(e){notify('Could not open design: '+String(e));}
 };
 const removeDesign=(id:string)=>{
  if(!window.confirm('Delete this saved design from your browser library? Export a backup first if needed.'))return;
  try{setSavedDesigns(deleteFromLibrary(localStorage,id));notify('Saved design deleted.');}
  catch(e){notify('Could not delete design: '+String(e));}
 };
 const newDesign=()=>{
  if(!window.confirm('Start a new design? Save the current design to your library or export a backup first.'))return;
  setHistory(h=>({past:[...h.past.slice(-39),h.present],present:initialDocument(),future:[]}));
  setSelected(null);setSide('front');setTool('select');setTab('2d');notify('New design ready.');
 };
 const applyIdea=()=>{
  try{
   const draft=draftFromIdea(idea,doc);
   setHistory(h=>({past:[...h.past.slice(-39),h.present],present:draft.document,future:[]}));
   setTab('2d');setSide('front');setTool('select');setSelected(null);
   setIdeaFeedback((draft.recognized.length?'Applied: '+draft.recognized.join(', ')+'. ':'No settings recognized. ')+draft.needsReview.join(' '));
   notify(draft.recognized.length?'Editable concept added. Undo is available.':'No matching settings found; edit the idea.');
  }catch(e){setIdeaFeedback(String(e));}
 };
 const exportSupplierReview=async()=>{
  try{
   const [front,back]=await Promise.all([renderArtwork(doc,'front'),renderArtwork(doc,'back')]);
   const html=createSupplierReviewHtml(doc,front.toDataURL('image/png'),back.toDataURL('image/png'));
   downloadBlob(new Blob([html],{type:'text/html;charset=utf-8'}),'moatt-'+doc.name.replace(/[^a-z0-9-]/gi,'-')+'-review.html');
   notify('Supplier review sheet saved. Measurements still need confirmation.');
  }catch(e){notify('Could not export review sheet: '+String(e));}
 };
 useEffect(()=>{
  if(tab!=='presentation')return;
  const target=presentationRef.current;
  if(!target)return;
  let live=true;
  renderPresentation(doc).then(result=>{
   if(!live)return;
   const ctx=target.getContext('2d');
   if(!ctx)throw Error('Presentation canvas unavailable');
   ctx.clearRect(0,0,target.width,target.height);
   ctx.drawImage(result,0,0);
   target.dataset.previewReady='true';
  }).catch(()=>{if(live)notify('Presentation preview unavailable. Try the export button.');});
  return()=>{live=false};
 // The document reference changes on every edit; stale renders are ignored.
 // eslint-disable-next-line react-hooks/exhaustive-deps
 },[doc,tab]);
 const exportPresentation=async()=>{
  try{
   const image=await renderPresentation(doc);
   await savePng(image,'moatt-'+(doc.name||'design').replace(/[^a-z0-9-]/gi,'-').slice(0,80)+'-presentation.png');
   notify('Front and back presentation saved as a high-resolution PNG.');
  }catch(e){notify('Could not export presentation: '+String(e));}
 };
 useEffect(()=>{if(!presentationFocused)return;const close=(e:KeyboardEvent)=>{if(e.key==='Escape')setPresentationFocused(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[presentationFocused]);
 const exportProject=()=>downloadBlob(new Blob([JSON.stringify(doc,null,2)],{type:'application/json'}),'moatt-'+doc.name.replace(/[^a-z0-9-]/gi,'-')+'.json');
 const exportMockup=async()=>{if(tab!=='3d'){setTab('3d');notify('3D preview opened. Select Export mockup again when ready.');return;}const canvas=document.querySelector('.preview-stage canvas') as HTMLCanvasElement|null;if(!canvas){notify('3D preview is unavailable');return;}try{await savePng(canvas,'moatt-'+side+'-mockup.png');notify('Mockup exported')}catch(e){notify('Mockup export failed: '+String(e))}};
 const saveSide=async(s:Side)=>{try{await savePng(await renderArtwork(doc,s,true),'moatt-'+s+'.png');notify(s+' PNG exported')}catch(e){notify(String(e))}};
 const upload=async(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>2_000_000){notify('Use a PNG, JPEG or WebP image under 2 MB');return}const reader=new FileReader();reader.onload=()=>{const id=uid();layerAdd({id,kind:'image',x:260,y:260,width:500,height:500,rotation:0,color:'#222222',value:String(reader.result)})};reader.readAsDataURL(f)};
 const importProject=async(e:ChangeEvent<HTMLInputElement>)=>{const f=e.target.files?.[0];e.target.value='';if(!f)return;if(f.size>6_000_000){notify('Project too large');return}try{const parsed=decodeDocument(await f.text());if(!window.confirm('Replace current design? Export it first if needed.'))return;setHistory({past:[doc],present:parsed,future:[]});setSelected(null);notify('Project imported')}catch(e){notify('Invalid project: '+String(e))}};
 useEffect(()=>{const onKey=(e:KeyboardEvent)=>{const target=e.target as HTMLElement;if(['INPUT','TEXTAREA','SELECT'].includes(target.tagName))return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo()}if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='y'){e.preventDefault();redo()}if(e.key==='Delete'&&selected) {commit(d=>{d.layers[side]=d.layers[side].filter(l=>l.id!==selected)});setSelected(null)}if(selected&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const amount=e.shiftKey?10:1;commit(d=>{const l=d.layers[side].find(x=>x.id===selected);if(!l||l.locked)return;if(e.key==='ArrowUp')l.y-=amount;if(e.key==='ArrowDown')l.y+=amount;if(e.key==='ArrowLeft')l.x-=amount;if(e.key==='ArrowRight')l.x+=amount})}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey)},[history,selected,side,commit]);
 if(!hydrated)return <main className="app" aria-busy="true"><header className="header"><span className="brand">MOATT <small>STUDIO</small></span><p role="status">Restoring your design…</p></header></main>;
 return <main className="app">
 <header className="header"><span className="brand">MOATT <small>STUDIO</small></span><div className="row"><button className="button" disabled={!history.past.length} onClick={undo}>Undo</button><button className="button" disabled={!history.future.length} onClick={redo}>Redo</button><button className="button" onClick={exportProject}>Save project</button><button className="button primary" onClick={()=>void (tab==='presentation'?exportPresentation():saveSide(side))}>{tab==='presentation'?'Download presentation':'Export PNG'}</button></div></header>
 <aside className="panel">
 <div className="section"><h3>Start from an idea</h3><label htmlFor="idea-prompt">Describe your clothing idea</label>
 <textarea id="idea-prompt" aria-label="Clothing idea" className="field idea-input" maxLength={500} value={idea} onChange={e=>setIdea(e.target.value)} placeholder="e.g. Black oversized hoodie with &#34;MOATT&#34; on the front" />
 <div className="row">{IDEA_EXAMPLES.map((example,i)=><button key={example} className="button" onClick={()=>{setIdea(example);setIdeaFeedback('')}} aria-label={'Load example '+(i+1)}>Example {i+1}</button>)}</div>
 <button className="button primary" onClick={applyIdea}>Create editable draft</button>
 <p className="hint">Works offline with simple garment and artwork rules, not generative AI. Keeps your existing artwork. Undo is available.</p>
 {ideaFeedback&&<p className="hint" role="status">{ideaFeedback}</p>}</div>
 <div className="section"><h3>Garment</h3><div className="row">{(['tshirt','hoodie'] as const).map(g=><button key={g} className={'button '+(doc.garment===g?'selected':'')} onClick={()=>commit(d=>{if(d.garment===g)return;d.garment=g;d.sleeve=g==='hoodie'?'long':'short';d.pocket=g==='hoodie'?'kangaroo':'none'})}>{g==='tshirt'?'T-shirt':'Hoodie'}</button>)}</div></div>
 <div className="section"><h3>Fit and body</h3><label>Fit<select className="field" value={doc.fit} onChange={e=>commit(d=>{d.fit=e.target.value as StudioDocument['fit']})}><option value="regular">Regular</option><option value="oversized">Oversized</option></select></label><label>Mannequin<select className="field" value={doc.body} onChange={e=>commit(d=>{d.body=e.target.value as StudioDocument['body']})}><option value="standard">Standard</option><option value="tall">Tall</option></select></label></div>
 <div className="section"><h3>Garment details</h3><label>Sleeves<select aria-label="Sleeve length" className="field" value={doc.sleeve} onChange={e=>commit(d=>{d.sleeve=e.target.value as StudioDocument['sleeve']})}><option value="short">Short</option><option value="long">Long</option></select></label><label>Hem<select aria-label="Hem length" className="field" value={doc.hem} onChange={e=>commit(d=>{d.hem=e.target.value as StudioDocument['hem']})}><option value="standard">Standard</option><option value="cropped">Cropped</option></select></label><label>Neckline<select aria-label="Neckline" className="field" value={doc.neck} onChange={e=>commit(d=>{d.neck=e.target.value as StudioDocument['neck']})}><option value="crew">Crew</option><option value="wide">Wide</option></select></label><label>Pocket style<select aria-label="Pocket style" className="field" value={doc.pocket} onChange={e=>commit(d=>{d.pocket=e.target.value as StudioDocument['pocket']})}><option value="none">None</option><option value="chest">Chest pocket</option>{doc.garment==='hoodie'&&<option value="kangaroo">Kangaroo pouch</option>}</select></label></div><div className="section"><h3>Fabric material</h3><label>Fabric<select aria-label="Fabric material" className="field" value={doc.material} onChange={e=>commit(d=>{d.material=e.target.value as StudioDocument['material']})}><option value="cotton">Cotton / matte</option><option value="denim">Denim / textured</option><option value="satin">Satin / sheen</option></select></label><p className="hint">Visual material preview, not fabric simulation.</p></div><div className="section"><h3>Fabric color</h3><input aria-label="Fabric color" type="color" value={doc.baseColor} onChange={e=>commit(d=>{d.baseColor=e.target.value})}/></div>
 <div className="section"><h3>Artwork tools</h3><div className="row">{(['select','draw','erase'] as Tool[]).map(t=><button key={t} className={'button '+(tool===t?'selected':'')} onClick={()=>setTool(t)}>{t}</button>)}</div><div className="row"><button className="button" onClick={()=>layerAdd({id:uid(),kind:'text',x:260,y:370,width:500,height:140,rotation:0,color:legibleInk(doc.baseColor),fontSize:85,value:'YOUR DESIGN'})}>Add text</button><button className="button" onClick={()=>fileRef.current?.click()}>Upload image</button></div><input type="file" hidden ref={fileRef} accept="image/png,image/jpeg,image/webp" onChange={e=>void upload(e)}/></div>
 <div className="section"><h3>Brush</h3><label>Ink color <input aria-label="Brush color" type="color" value={brushColor} onChange={e=>setBrushColor(e.target.value)}/></label><label>Size <input aria-label="Brush size" className="field" type="range" min="2" max="70" value={brushWidth} onChange={e=>setBrushWidth(Number(e.target.value))}/></label></div><p className="hint">2D: drag to move layers, or select Draw to paint. 3D: orbit and zoom independently. Preview geometry is illustrative, not a fitted sewing pattern.</p>
 </aside>
 <section className="canvas"><div className="mobile-quick"><button className="button" onClick={()=>{setTab('2d');layerAdd({id:uid(),kind:'text',x:260,y:370,width:500,height:140,rotation:0,color:legibleInk(doc.baseColor),fontSize:85,value:'NEW DESIGN'})}}>New text</button><button className="button" onClick={()=>{setTab('2d');setTool('draw')}}>Paint design</button></div><div className="viewtools"><button className={'button '+(side==='front'?'selected':'')} onClick={()=>{setSide('front');setSelected(null)}}>Front</button><button className={'button '+(side==='back'?'selected':'')} onClick={()=>{setSide('back');setSelected(null)}}>Back</button><button className={'button '+(tab==='2d'?'selected':'')} onClick={()=>setTab('2d')}>2D edit</button><button className={'button '+(tab==='3d'?'selected':'')} onClick={()=>setTab('3d')}>3D preview</button><button className={'button '+(tab==='presentation'?'selected':'')} onClick={()=>setTab('presentation')}>Presentation</button>{tab==='presentation'&&<button className="button" onClick={()=>setPresentationFocused(true)}>Expand board</button>}{tab==='3d'&&<>
 <button className={'button '+(modelStyle==='studio'?'selected':'')} onClick={()=>setModelStyle('studio')}>Studio mannequin</button>
 <button className={'button '+(modelStyle==='classic'?'selected':'')} onClick={()=>setModelStyle('classic')}>Classic mannequin</button>
 </>}</div>
 <div className="studio-stage" style={{display:tab==='2d'?'flex':'none'}}><div className="artboard"><canvas ref={canvasRef} width={1024} height={1024} aria-label={side+' artwork canvas'} style={{touchAction:'none',cursor:tool==='draw'?'crosshair':tool==='erase'?'not-allowed':'move'}} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={()=>{drag.current=null;void paint()}}/><div aria-hidden="true" className="safe-guide" style={{left:SAFE_REGION.left/1024*100+'%',top:SAFE_REGION.top/1024*100+'%',width:(SAFE_REGION.right-SAFE_REGION.left)/1024*100+'%',height:(SAFE_REGION.bottom-SAFE_REGION.top)/1024*100+'%'}}/>{active&&tool==='select'&&<div className="selection-outline" data-layer-id={active.id} style={{left:active.x/1024*100+'%',top:active.y/1024*100+'%',width:active.width/1024*100+'%',height:active.height/1024*100+'%',transform:'rotate('+active.rotation+'deg)'}}/>}</div></div>
 <div className="preview-stage" style={{display:tab==='3d'?'block':'none'}}>{tab==='3d'&&<Preview doc={doc} side={side} modelStyle={modelStyle}/>}</div>
 <div className={'presentation-stage '+(presentationFocused?'is-focused':'')} style={{display:tab==='presentation'?'flex':'none'}}>{presentationFocused&&<button className="button primary board-close" onClick={()=>setPresentationFocused(false)}>Close full-screen board</button>}{tab==='presentation'&&<canvas data-testid="presentation-canvas" ref={presentationRef} width={PRESENTATION_WIDTH} height={PRESENTATION_HEIGHT} role="img" aria-label="Front and back garment presentation"/>}</div>
 <div className="notice">{tab==='3d'?'Drag to orbit · scroll to zoom · visual garment approximation':tab==='presentation'?'Two-sided design presentation · visual concept, not a production pattern':'Artwork layout · front and back saved separately'}</div></section>
 <aside className="panel right"><div className="section"><h3>Project</h3><input aria-label="Design title" className="field" value={doc.name} maxLength={120} onChange={e=>commit(d=>{d.name=e.target.value})}/><p className="hint">{saveError||(!hydrated?'Loading saved design…':'Autosaved in this browser')}</p><button className="button" onClick={()=>projectRef.current?.click()}>Import project</button><input hidden type="file" accept=".json,application/json" ref={projectRef} onChange={e=>void importProject(e)}/></div>
 <div className="section"><h3>My designs</h3>
 <div className="row"><button className="button primary" onClick={storeDesign}>Save to my designs</button><button className="button" onClick={newDesign}>New design</button><button className="button" onClick={()=>{const clone=modify(doc,d=>{d.id=uid();d.name=(d.name+' — colorway').slice(0,120)});setHistory(h=>({past:[...h.past.slice(-39),h.present],present:clone,future:[]}));setSelected(null);notify('Colorway copy created. Update the color and save it to My designs.')}}>Duplicate colorway</button></div>
 <p className="hint">Stored on this browser only. Download JSON backups before clearing browser data or switching devices.</p>
 {savedDesigns.length===0?<p className="hint">No designs in your local library yet.</p>:
 savedDesigns.map(item=><div className="layer-row" key={item.id}><button className="choice" aria-label={'Open '+item.name} onClick={()=>openDesign(item.id)}>{item.name} · {item.savedAt.slice(0,10)}</button><button className="button" aria-label={'Delete '+item.name} onClick={()=>removeDesign(item.id)}>×</button></div>)}
 </div>
 <div className="section"><h3>Brand and supplier notes</h3><p className="hint">Optional information you provide for a supplier discussion. All physical details require independent verification.</p>
 {([
 ['brand','Brand name'],['targetCustomer','Target customer'],['fabricComposition','Requested fabric composition'],
 ['fabricWeight','Requested fabric weight'],['sizingNotes','Requested sizing / measurements'],
 ['constructionNotes','Construction requests'],['productionNotes','Additional supplier questions']
 ] as Array<[keyof StudioDocument['brief'],string]>).map(([key,label])=>
 <label key={key}>{label}<textarea aria-label={label} className="field" rows={key==='brand'?1:2} maxLength={2000} value={doc.brief[key]}
 onChange={e=>commit(d=>{d.brief[key]=e.target.value.slice(0,2000)})}/></label>)}
 </div>
 <div className="section"><h3>{side} layers ({current.length})</h3>{[...current].reverse().map(l=><div key={l.id} className="layer-row"><button className={'choice '+(selected===l.id?'selected':'')} onClick={()=>{setSelected(l.id);setTool('select')}}>{l.kind}: {l.kind==='text'?l.value.slice(0,12):l.kind==='stroke'?'brush stroke':'image'}</button><button aria-label="Delete layer" className="button" onClick={()=>{commit(d=>{d.layers[side]=d.layers[side].filter(x=>x.id!==l.id)});setSelected(null)}}>×</button></div>)}{!current.length&&<p className="hint">Add text, upload an image, or draw on the canvas.</p>}</div>
 {active&&<div className="section"><h3>Selected layer</h3>{active.kind==='text'&&<><label>Text<textarea aria-label="Selected layer text" className="field" value={active.value} onChange={e=>update(active.id,{value:e.target.value.slice(0,300)})}/></label><label>Text size<input className="field" type="number" min={12} max={320} value={active.fontSize||90} onChange={e=>update(active.id,{fontSize:clamp(Number(e.target.value),12,320)})}/></label></>}
 {active.kind!=='image'&&<label>Ink <input type="color" value={active.color} onChange={e=>update(active.id,{color:e.target.value})}/></label>}
 <label>X<input className="field" type="number" value={Math.round(active.x)} onChange={e=>update(active.id,{x:clamp(Number(e.target.value),-1024,2048)})}/></label><label>Y<input className="field" type="number" value={Math.round(active.y)} onChange={e=>update(active.id,{y:clamp(Number(e.target.value),-1024,2048)})}/></label><label>Width<input className="field" type="number" value={Math.round(active.width)} onChange={e=>update(active.id,{width:clamp(Number(e.target.value),10,1024)})}/></label><label>Height<input className="field" type="number" value={Math.round(active.height)} onChange={e=>update(active.id,{height:clamp(Number(e.target.value),10,1024)})}/></label><label>Rotation<input className="field" type="range" min={-180} max={180} value={active.rotation} onChange={e=>update(active.id,{rotation:Number(e.target.value)})}/></label>
 <div className="row"><button className="button" onClick={()=>update(active.id,{hidden:!active.hidden})}>{active.hidden?'Show':'Hide'}</button><button className="button" onClick={()=>commit(d=>{const l=d.layers[side].find(x=>x.id===active.id);if(l)l.locked=!l.locked})}>{active.locked?'Unlock':'Lock'}</button><button className="button" onClick={()=>commit(d=>{const a=d.layers[side];const i=a.findIndex(l=>l.id===active.id);if(i>=0&&i<a.length-1)[a[i],a[i+1]]=[a[i+1],a[i]]})}>Bring forward</button><button className="button" onClick={()=>commit(d=>{const a=d.layers[side];const i=a.findIndex(l=>l.id===active.id);if(i>0)[a[i],a[i-1]]=[a[i-1],a[i]]})}>Send backward</button><button className="button" onClick={()=>layerAdd({...active,id:uid(),x:active.x+30,y:active.y+30})}>Duplicate</button></div></div>}
 <div className="section"><h3>Artwork checks</h3>
 {visibilityIssues.length>0&&<>
  <p className="hint" role="status">{visibilityIssues.length} text layer{visibilityIssues.length===1?'':'s'} may disappear against this garment color.</p>
  <button className="button primary" onClick={()=>{
   let fixed=0;
   commit(d=>{
    for(const warning of analyzeArtworkVisibility(d)){
     const layer=d.layers[warning.side].find(l=>l.id===warning.layerId);
     if(layer&&!layer.locked){layer.color=warning.recommended;fixed++;}
    }
   });
   notify(fixed+' editable text layer'+(fixed===1?'':'s')+' adjusted for contrast. Locked text left unchanged.');
  }}>Fix text visibility</button>
  {visibilityIssues.map(item=><p className="hint" key={item.side+item.layerId}>{item.side} text contrast {item.ratio.toFixed(1)}:1. {item.message}</p>)}
 </>}
 {printIssues.length?printIssues.map((issue,i)=><p key={issue.layerId+'-'+i} className="hint" role="status">{issue.severity==='error'?'Outside canvas':'Placement note'} ({issue.side}): {issue.message}</p>):<p className="hint">Artwork falls within the suggested placement area.</p>}<p className="hint">Dashed area is a design guide only. Confirm real print dimensions with your production partner.</p></div><div className="section"><h3>Export</h3><button className="button" onClick={()=>void Promise.all([saveSide('front'),saveSide('back')])}>Export both artwork sides</button><button className="button primary" onClick={()=>void exportPresentation()}>Export presentation PNG</button><button className="button" onClick={()=>void exportMockup()}>Export 3D mockup</button><button className="button" onClick={()=>void exportSupplierReview()}>Export supplier review sheet</button><p className="hint">Artwork PNGs use transparent backgrounds; preview textures include fabric color. These are not calibrated factory prints or production patterns. The supplier review sheet is a visual brief, not a technical pattern.</p></div>
 </aside>{toast&&<div className="toast" role="status">{toast}</div>}
 </main>;
}
