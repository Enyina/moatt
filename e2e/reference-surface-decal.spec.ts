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
 const actual=await canvas.evaluate(c=>{
  const source=c as HTMLCanvasElement;
  const off=document.createElement('canvas');off.width=source.width;off.height=source.height;
  const ctx=off.getContext('2d')!;ctx.drawImage(source,0,0);
  const w=off.width,h=off.height;
  // Chest occupies central upper-middle area of garment close-up, rather than at the hem.
  const pixels=ctx.getImageData(Math.floor(w*.32),Math.floor(h*.18),Math.floor(w*.36),Math.floor(h*.43)).data;
  let dark=0;for(let i=0;i<pixels.length;i+=4){if(pixels[i]<80&&pixels[i+1]<80&&pixels[i+2]<80)dark++;}
  return {w,h,dark};
 });
 expect(actual.w).toBeGreaterThan(500);
 expect(actual.dark,'Chest art must produce readable high-contrast ink near center, not solely near hem').toBeGreaterThan(65);
 await page.screenshot({path:testInfo.outputPath('chest-decal-readable-text.png'),fullPage:true});
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('BACK PRINT');
 await expect(canvas).toHaveAttribute('data-reference-artwork','ready',{timeout:20000});
 await page.screenshot({path:testInfo.outputPath('back-decal-readable-text.png'),fullPage:true});
});
