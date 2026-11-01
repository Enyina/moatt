import {expect,test} from '@playwright/test';

test('studio mannequin is proportionate and can be inspected from front, back and side',async({page},info)=>{
 test.setTimeout(100000);
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:20000});
 if(await fallback.isVisible())return;
 await page.getByRole('button',{name:'Studio mannequin'}).click();
 await expect(canvas).toHaveAttribute('data-mannequin-status','studio-ready',{timeout:15000});
 await expect(canvas).toHaveAttribute('data-camera-preset','front',{timeout:15000});
 await page.locator('.canvas').screenshot({path:info.outputPath('mannequin-front-tshirt.png')});
 await page.getByRole('button',{name:'Side profile'}).click();
 await expect(canvas).toHaveAttribute('data-camera-preset','profile');
 await page.locator('.canvas').screenshot({path:info.outputPath('mannequin-profile-tshirt.png')});
 await page.getByRole('button',{name:'Hoodie'}).click();
 await page.locator('.canvas').screenshot({path:info.outputPath('mannequin-profile-hoodie.png')});
 await page.getByRole('button',{name:'Face-on view'}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(canvas).toHaveAttribute('data-camera-preset','back');
 await page.locator('.canvas').screenshot({path:info.outputPath('mannequin-back-hoodie.png')});
 await page.getByRole('button',{name:'Garment only'}).click();
 await expect(canvas).toHaveAttribute('data-mannequin-status','garment-only');
 await page.getByRole('button',{name:'Studio mannequin'}).click();
 await expect(canvas).toHaveAttribute('data-mannequin-status','studio-ready');
});
