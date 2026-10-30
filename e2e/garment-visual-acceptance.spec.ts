import {expect,test} from '@playwright/test';

/** Acceptance guard: visual controls must never obscure the garment. */
test('garment-only is the preferred preview and toolbar never overlays the canvas',async({page},testInfo)=>{
 test.setTimeout(110000);
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const unsupported=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(unsupported)).toBeVisible({timeout:25000});
 if(await unsupported.isVisible())return;
 await expect(canvas).toHaveAttribute('data-mannequin-status','garment-reference');
 await expect(canvas).toHaveAttribute('data-reference-status','loaded',{timeout:80000});
 await expect(canvas).toHaveAttribute('data-reference-artwork','ready',{timeout:30000});
 const regions=await page.evaluate(()=>{
  const controls=document.querySelector('.viewtools')!.getBoundingClientRect();
  const view=document.querySelector('.preview-stage')!.getBoundingClientRect();
  const quick=document.querySelector('.mobile-quick')!.getBoundingClientRect();
  return {controlsBottom:controls.bottom,viewTop:view.top,viewBottom:view.bottom,
   quickTop:quick.top,quickHeight:quick.height,viewWidth:view.width,viewHeight:view.height};
 });
 expect(regions.viewWidth).toBeGreaterThan(280);
 expect(regions.viewHeight).toBeGreaterThan(340);
 expect(regions.controlsBottom,'preview buttons cannot cover the clothing').toBeLessThanOrEqual(regions.viewTop+2);
 if(regions.quickHeight>1)expect(regions.quickTop,'mobile editing shortcuts cannot cover the clothing').toBeGreaterThanOrEqual(regions.viewBottom-2);
 await page.locator('.canvas').screenshot({path:testInfo.outputPath('garment-first-responsive-layout.png')});
});

test('front/back and T-shirt/hoodie produce reviewable 3D proof at the tested viewport',async({page},testInfo)=>{
 test.setTimeout(150000);
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('FRONT ART');
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('BACK ART');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const unsupported=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(unsupported)).toBeVisible({timeout:20000});
 if(await unsupported.isVisible())return;
 for(const [garment,side] of [['tshirt','back'],['tshirt','front'],['hoodie','front'],['hoodie','back']] as const){
  if(garment==='hoodie')await page.getByRole('button',{name:'Hoodie',exact:true}).click();
  await page.getByRole('button',{name:side==='front'?'Front':'Back',exact:true}).click();
  await expect(canvas).toHaveAttribute('data-reference-status','loaded',{timeout:80000});
  await expect(canvas).toHaveAttribute('data-reference-artwork','ready',{timeout:30000});
  await canvas.screenshot({path:testInfo.outputPath('garment-'+garment+'-'+side+'.png')});
 }
 await page.getByRole('button',{name:'2D edit'}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByText('text: BACK ART')).toBeVisible();
});
