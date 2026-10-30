import {test,expect} from '@playwright/test';
test('garment-first preview exposes distinct fabric styles',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:15000});
 if(await fallback.isVisible())return;
 await expect(canvas).toHaveAttribute('data-mannequin-status','garment-only');
 await expect(canvas).toHaveAttribute('data-fabric-material','cotton');
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('denim');
 await expect(canvas).toHaveAttribute('data-fabric-material','denim');
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('satin');
 await expect(canvas).toHaveAttribute('data-fabric-material','satin');
 await expect(page.getByRole('button',{name:'Garment only'})).toHaveClass(/selected/);
 await page.screenshot({path:test.info().outputPath('satin-mannequin.png'),fullPage:true});
});
test('can switch between smooth studio mannequin and legacy licensed model',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:15000});
 if(await fallback.isVisible())return;
 await page.getByRole('button',{name:'Classic mannequin'}).click();
 await expect(canvas).toHaveAttribute('data-mannequin-status',/loaded|asset-fallback/,{timeout:15000});
 await page.getByRole('button',{name:'Studio mannequin'}).click();
 await expect(canvas).toHaveAttribute('data-mannequin-status','studio-ready',{timeout:15000});
});

test('fabric changes visibly alter rendered pixels rather than only labels',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:15000});
 if(await fallback.isVisible())return;
 await expect(canvas).toHaveAttribute('data-mannequin-status','garment-only');
 const image=async()=>canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL('image/png'));
 await page.waitForTimeout(200);
 const cotton=await image();
 await page.screenshot({path:test.info().outputPath('cotton-mannequin.png'),fullPage:true});
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('denim');
 await page.waitForTimeout(350);
 const denim=await image();
 await page.screenshot({path:test.info().outputPath('denim-mannequin.png'),fullPage:true});
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('satin');
 await page.waitForTimeout(350);
 const satin=await image();
 expect(new Set([cotton,denim,satin]).size).toBe(3);
});

test('repaints after edits but does not continuously waste frames while idle',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:15000});
 if(await fallback.isVisible())return;
 await expect.poll(async()=>Number(await canvas.getAttribute('data-render-frames'))).toBeGreaterThan(0);
 await page.waitForTimeout(600);
 const before=Number(await canvas.getAttribute('data-render-frames'));
 await page.waitForTimeout(500);
 const after=Number(await canvas.getAttribute('data-render-frames'));
 expect(after-before).toBeLessThanOrEqual(6);
 await page.getByLabel('Fabric color').fill('#a34a48');
 await expect.poll(async()=>Number(await canvas.getAttribute('data-render-frames')),{timeout:15000}).toBeGreaterThan(after);
});
