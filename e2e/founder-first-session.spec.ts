import {test,expect} from '@playwright/test';

/** A full newcomer journey, not isolated buttons: idea to saved, shareable variants. */
test('founder creates a two-sided hoodie, saves a colorway and exports a shareable board',async({page})=>{
 test.setTimeout(75000);
 await page.goto('/');
 await page.getByLabel('Design title').fill('Night Shift Collection');
 await page.getByRole('button',{name:'Hoodie'}).click();
 await page.getByRole('button',{name:'Two-sided branding'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('AFTER HOURS');
 await page.getByRole('button',{name:'Front',exact:true}).click();
 await page.getByRole('button',{name:'text: YOUR BRAND'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('NIGHT SHIFT');
 await page.getByLabel('Fabric color').fill('#202124');
 await page.getByRole('button',{name:'Fix text visibility'}).click();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByText('text: AFTER HOURS')).toBeVisible();
 await page.getByRole('button',{name:'Presentation',exact:true}).click();
 await expect(page.getByTestId('presentation-canvas')).toHaveAttribute('data-preview-ready','true',{timeout:25000});
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download presentation'}).click();
 expect((await download).suggestedFilename()).toContain('presentation.png');
 await page.getByRole('button',{name:'Save to my designs'}).click();
 await expect(page.getByRole('button',{name:/^Open Night Shift Collection$/})).toBeVisible();
 await page.getByRole('button',{name:'Duplicate colorway'}).click();
 await page.getByLabel('Fabric color').fill('#e2bc85');
 await page.getByRole('button',{name:'Save to my designs'}).click();
 await expect(page.getByRole('button',{name:/^Open Night Shift Collection — colorway$/})).toBeVisible();
 page.once('dialog',d=>d.accept());
 await page.getByRole('button',{name:/^Open Night Shift Collection$/}).click();
 await expect(page.getByLabel('Fabric color')).toHaveValue('#202124');
 await page.reload();
 await expect(page.getByLabel('Design title')).toHaveValue('Night Shift Collection');
 await page.getByRole('button',{name:'Front',exact:true}).click();
 await expect(page.getByText('text: NIGHT SHIFT')).toBeVisible();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByText('text: AFTER HOURS')).toBeVisible();
});
