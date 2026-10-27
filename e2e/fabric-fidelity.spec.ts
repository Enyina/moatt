import {test,expect} from '@playwright/test';
test('opens on polished studio mannequin and exposes distinct fabric styles',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:15000});
 if(await fallback.isVisible())return;
 await expect(canvas).toHaveAttribute('data-mannequin-status','studio-ready');
 await expect(canvas).toHaveAttribute('data-fabric-material','cotton');
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('denim');
 await expect(canvas).toHaveAttribute('data-fabric-material','denim');
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('satin');
 await expect(canvas).toHaveAttribute('data-fabric-material','satin');
 await expect(page.getByRole('button',{name:'Studio mannequin'})).toHaveClass(/selected/);
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
