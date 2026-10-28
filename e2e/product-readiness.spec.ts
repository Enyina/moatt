import {test,expect} from '@playwright/test';

test('maintains two named designs and restores the correct one',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Design title').fill('First Collection');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('DESIGN ONE');
 await page.getByRole('button',{name:'Save to my designs'}).click();
 await expect(page.getByRole('button',{name:/Open First Collection/})).toBeVisible();
 page.once('dialog',d=>d.accept());
 await page.getByRole('button',{name:'New design'}).click();
 await page.getByLabel('Design title').fill('Second Collection');
 await page.getByRole('button',{name:'Save to my designs'}).click();
 await expect(page.getByRole('button',{name:/Open Second Collection/})).toBeVisible();
 page.once('dialog',d=>d.accept());
 await page.getByRole('button',{name:/Open First Collection/}).click();
 await expect(page.getByText('text: DESIGN ONE')).toBeVisible();
 await page.reload();
 await expect(page.getByText('text: DESIGN ONE')).toBeVisible();
});

test('supplier notes round-trip into a clearly unverified handoff',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Brand name').fill('NORTH STUDIO');
 await page.getByLabel('Requested fabric composition').fill('Proposed: 100% cotton, supplier to verify');
 await page.getByLabel('Requested sizing / measurements').fill('Requested 110 cm chest, fit sample required');
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export supplier review sheet'}).click();
 const file=await download;
 const reader=await file.createReadStream();let html='';
 for await(const chunk of reader)html+=chunk.toString();
 expect(html).toContain('NORTH STUDIO');
 expect(html).toContain('supplier to verify');
 expect(html).toContain('110 cm');
 expect(html).toContain('Not a manufacturing tech pack');
 await page.reload();
 await expect(page.getByLabel('Requested fabric composition')).toHaveValue('Proposed: 100% cotton, supplier to verify');
});

test('front and back mockup preview remain independent',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('FRONT SIDE');
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('BACK SIDE');
 await expect(page.getByText('text: BACK SIDE')).toBeVisible();
 await page.getByRole('button',{name:'Front',exact:true}).click();
 await expect(page.getByText('text: FRONT SIDE')).toBeVisible();
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const unavailable=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(unavailable)).toBeVisible({timeout:15000});
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(canvas.or(unavailable)).toBeVisible({timeout:15000});
});

test('malicious imported brief cannot inject markup into a review',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Brand name').fill('<script>alert(1)</script>');
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export supplier review sheet'}).click();
 const stream=await(await download).createReadStream();let html='';
 for await(const chunk of stream)html+=chunk.toString();
 expect(html).not.toContain('<script>');
 expect(html).toContain('&lt;script&gt;');
});
