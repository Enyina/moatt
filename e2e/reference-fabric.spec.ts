import {test,expect} from '@playwright/test';

test('fabric choice changes the fitted garment material, not only a selector label',async({page},testInfo)=>{
 test.setTimeout(105000);
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const unsupported=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(unsupported)).toBeVisible({timeout:20000});
 if(await unsupported.isVisible())return;
 await page.getByRole('button',{name:'Garment close-up'}).click();
 await expect(canvas).toHaveAttribute('data-reference-status','loaded',{timeout:60000});
 await expect(canvas).toHaveAttribute('data-reference-fabric','cotton',{timeout:20000});
 const snapshot=()=>canvas.evaluate(node=>(node as HTMLCanvasElement).toDataURL('image/png'));
 const cotton=await snapshot();
 // Source GLB textures and our stable albedo/bump maps are uploaded lazily.
 // Warm the entire material set before measuring sustained switching, rather
 // than counting legitimate first-time uploads as a memory leak.
 for(const material of ['denim','satin','cotton'] as const){
  await page.getByRole('combobox',{name:'Fabric material'}).selectOption(material);
  await expect(canvas).toHaveAttribute('data-reference-fabric',material,{timeout:20000});
  await canvas.evaluate(node=>(node as HTMLCanvasElement).toDataURL('image/png'));
 }
 await expect(canvas).toHaveAttribute('data-reference-fabric','cotton');
 const initialCount=Number(await canvas.getAttribute('data-gpu-textures'));
 await page.screenshot({path:testInfo.outputPath('fitted-fabric-cotton.png'),fullPage:true});
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('denim');
 await expect(canvas).toHaveAttribute('data-reference-fabric','denim',{timeout:20000});
 await expect.poll(snapshot,{timeout:20000}).not.toBe(cotton);
 const denim=await snapshot();
 await page.screenshot({path:testInfo.outputPath('fitted-fabric-denim.png'),fullPage:true});
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('satin');
 await expect(canvas).toHaveAttribute('data-reference-fabric','satin',{timeout:20000});
 await expect.poll(snapshot,{timeout:20000}).not.toBe(denim);
 await page.screenshot({path:testInfo.outputPath('fitted-fabric-satin.png'),fullPage:true});
 // Exercise multiple full material cycles. The same GPU bump map must be reused.
 for(const material of ['cotton','denim','satin','cotton','denim','satin'] as const){
  await page.getByRole('combobox',{name:'Fabric material'}).selectOption(material);
  await expect(canvas).toHaveAttribute('data-reference-fabric',material,{timeout:20000});
 }
 const lastCount=Number(await canvas.getAttribute('data-gpu-textures'));
 expect(Number.isFinite(initialCount)&&Number.isFinite(lastCount)).toBeTruthy();
 expect(lastCount-initialCount).toBeLessThanOrEqual(3);
 await page.getByRole('button',{name:'2D edit'}).click();
 await expect(page.getByRole('combobox',{name:'Fabric material'})).toHaveValue('satin');
});
