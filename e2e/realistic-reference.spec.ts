import {test,expect} from '@playwright/test';

test('a genuine licensed human model can load and be compared without overwriting editable artwork',async({page,browserName},testInfo)=>{
 test.setTimeout(110000);
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('COMPARE');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:20000});
 if(await fallback.isVisible())return;
 await page.getByRole('button',{name:'Human fit reference'}).click();
 await expect(canvas).toHaveAttribute('data-mannequin-status','realistic-reference',{timeout:15000});
 const status=await Promise.race([
  canvas.locator('xpath=..').getByRole('alert').waitFor({timeout:65000}).then(()=> 'unavailable'),
  expect(canvas).toHaveAttribute('data-reference-status','loaded',{timeout:65000}).then(()=> 'loaded')
 ]);
 expect(status,'Verified CC0 source models must load before release in a browser with WebGL').toBe('loaded');
 await page.screenshot({path:testInfo.outputPath('realistic-reference-'+browserName+'.png'),fullPage:true});
 await page.getByRole('button',{name:'Studio mannequin'}).click();
 await expect(canvas).toHaveAttribute('data-mannequin-status','studio-ready',{timeout:15000});
 await page.getByRole('button',{name:'2D edit'}).click();
 await expect(page.getByText('text: COMPARE')).toBeVisible();
});
