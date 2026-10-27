import type {Side,StudioDocument} from './studio-document';

const escapeHtml=(value:string)=>value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));
const words=(value:string)=>value.charAt(0).toUpperCase()+value.slice(1);
const safePng=(data:string)=>{
 if(data.length>9_000_000 || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(data))throw Error('Cannot prepare review sheet: artwork preview is invalid or too large.');
 return data;
};
const detail=(name:string,value:string)=>'<tr><th scope="row">'+escapeHtml(name)+'</th><td>'+escapeHtml(value)+'</td></tr>';
const visibleCount=(doc:StudioDocument,side:Side)=>doc.layers[side].filter(layer=>!layer.hidden).length;

/** A printable conversation starter, never a factory-certified technical pattern or specification. */
export function createSupplierReviewHtml(doc:StudioDocument,frontPng:string,backPng:string):string {
 const front=safePng(frontPng),back=safePng(backPng);
 const title=escapeHtml(doc.name||'Untitled garment');
 const color=/^#[0-9a-fA-F]{6}$/.test(doc.baseColor)?doc.baseColor:'#e9dfc9';
 const summary=[
  detail('Garment',doc.garment==='hoodie'?'Hoodie':'T-shirt'),
  detail('Fit description',words(doc.fit)),
  detail('Mannequin preview',words(doc.body)+' (illustrative only)'),
  detail('Sleeves',words(doc.sleeve)),
  detail('Hem',words(doc.hem)),
  detail('Neckline',words(doc.neck)),
  detail('Material appearance',words(doc.material)+' (visual preset, not a fabric specification)'),
  detail('Visual color',color+' (screen color only; request a physical sample)'),
  detail('Visible artwork',visibleCount(doc,'front')+' front / '+visibleCount(doc,'back')+' back layers'),
  detail('Brand (user supplied)',doc.brief.brand||'Not provided'),
  detail('Intended customer (user supplied)',doc.brief.targetCustomer||'Not provided'),
  detail('Fabric composition (unverified)',doc.brief.fabricComposition||'Not confirmed'),
  detail('Fabric weight (unverified)',doc.brief.fabricWeight||'Not confirmed'),
  detail('Sizing and measurements (unverified)',doc.brief.sizingNotes||'Not confirmed'),
  detail('Construction requests (unverified)',doc.brief.constructionNotes||'Not confirmed'),
  detail('Other production questions',doc.brief.productionNotes||'Not provided')
 ].join('\n');
 return [
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">',
  '<title>'+title+' — Moatt design review</title>',
  '<style>body{font:15px/1.5 system-ui,sans-serif;max-width:970px;margin:25px auto;padding:0 24px;color:#202329}h1{margin:0}h2{font-size:19px;margin-top:30px}.label{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#777}.warning{border:2px solid #8d6d27;background:#fff8e8;padding:15px;margin:20px 0}.images{display:grid;grid-template-columns:1fr 1fr;gap:20px}.images img{max-width:100%;border:1px solid #bbb}.images figcaption{font-weight:700}table{border-collapse:collapse;width:100%}th,td{border-bottom:1px solid #ddd;padding:10px;text-align:left}th{width:37%}li{margin-bottom:7px}footer{margin-top:35px;color:#666;font-size:12px}@media print{body{margin:0;max-width:100%}.images{break-inside:avoid}h2{break-after:avoid}}</style></head><body>',
  '<div class="label">Moatt Studio · Concept review sheet</div><h1>'+title+'</h1>',
  '<div class="warning"><strong>Not a manufacturing tech pack.</strong> This is a visual brief for discussion. Print dimensions, garment measurements, fabric composition, construction, sizing, placement and fit have not been verified. Do not cut fabric or print a production run from this document.</div>',
  '<h2>Design views</h2><div class="images"><figure><img alt="Front garment artwork mockup" src="'+front+'"><figcaption>Front artwork preview</figcaption></figure><figure><img alt="Back garment artwork mockup" src="'+back+'"><figcaption>Back artwork preview</figcaption></figure></div>',
  '<p>The flat previews show artwork placement on an illustrative color field, not physically calibrated panels or a realistic 3D fabric simulation.</p>',
  '<h2>Proposed look</h2><table>'+summary+'</table>',
  '<h2>Supplier and designer must confirm</h2><ol>',
  '<li>Actual body and finished garment measurements, grading and fit approval.</li>',
  '<li>Fabric composition, weight, stretch, shade reference and physical swatches.</li>',
  '<li>Construction and patterns: seams, cuffs, hood, pockets, fasteners and stitch types.</li>',
  '<li>Artwork locations and printable dimensions in physical units, technique and color separation.</li>',
  '<li>Labelling, care instructions, sampling, tolerances and final production approval.</li>',
  '</ol><p>Attach approved technical drawings and real sample measurements separately before manufacturing.</p>',
  '<footer>Created from an editable Moatt concept. Share for discussion, not as an instruction to manufacture.</footer>',
  '</body></html>'
 ].join('\n');
}
