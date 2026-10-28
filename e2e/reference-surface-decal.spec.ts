import {expect,test} from '@playwright/test';

/** Detect what the user sees, not just that a canvas rendered or downloaded. */
test('real fitted cloth shows readable chest artwork where the garment is, not on hem or seams',async({page},testInfo)=>{
 test.setTimeout(120000);
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const unsupported=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(unsupported)).toBeVisible({timeout:20000});
 if(await unsupported.isVisible())return;
 await page.getByRole('button',{name:'Garment close-up'}).click();
 await expect(canvas).toHaveAttribute('data-reference-status','loaded',{timeout:60000});
 await expect(canvas).toHaveAttribute('data-reference-artwork','ready',{timeout:20000});
 await expect(canvas).toHaveAttribute('data-reference-projection','curved-surface-decal-v1');
 expect(Number(await canvas.getAttribute('data-reference-coverage'))).toBeGreaterThan(.65);

 const imageData=async()=>canvas.evaluate(element=>{
  const c=element as HTMLCanvasElement;
  // The browser-owned PNG is a stable readback from the actual visible 3D canvas.
  return c.toDataURL('image/png');
 });
 const baseline=await imageData();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('REAL PRINT');
 await expect.poll(imageData,{timeout:25000}).not.toBe(baseline);
 await expect(canvas).toHaveAttribute('data-reference-artwork','ready',{timeout:25000});
 const actual=await canvas.evaluate(async(c,baselineImage)=>{
  const source=c as HTMLCanvasElement,w=source.width,h=source.height;
  const old=new Image();old.src=baselineImage;await old.decode();
  const before=document.createElement('canvas'),after=document.createElement('canvas');
  before.width=after.width=w;before.height=after.height=h;
  const beforeCtx=before.getContext('2d')!,afterCtx=after.getContext('2d')!;
  beforeCtx.drawImage(old,0,0);afterCtx.drawImage(source,0,0);
  const x=Math.floor(w*.30),y=Math.floor(h*.22),width=Math.floor(w*.4),height=Math.floor(h*.38);
  const oldPixels=beforeCtx.getImageData(x,y,width,height).data;
  const newPixels=afterCtx.getImageData(x,y,width,height).data;
  const bands=[0,0,0,0,0];let changed=0;
  for(let yy=0;yy<height;yy++)for(let xx=0;xx<width;xx++){
   const i=(yy*width+xx)*4;
   const delta=Math.abs(oldPixels[i]-newPixels[i])+Math.abs(oldPixels[i+1]-newPixels[i+1])+Math.abs(oldPixels[i+2]-newPixels[i+2]);
   if(delta>100){changed++;bands[Math.min(4,Math.floor(xx*5/width))]++;}
  }
  return {w,h,changed,bands};
 },baseline);
 expect(actual.w).toBeGreaterThan(500);
 expect(actual.changed,'The actual chest must contain substantial visible artwork, not just two letters or a background change').toBeGreaterThan(450);
 expect(actual.bands.filter(b=>b>30).length,'Artwork must span the chest rather than appearing as isolated edge fragments').toBeGreaterThanOrEqual(3);
 await page.screenshot({path:testInfo.outputPath('chest-decal-readable-text.png'),fullPage:true});
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('BACK PRINT');
 await expect(canvas).toHaveAttribute('data-reference-artwork','ready',{timeout:20000});
 await page.screenshot({path:testInfo.outputPath('back-decal-readable-text.png'),fullPage:true});
});
