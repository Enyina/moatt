import {test,expect} from '@playwright/test';
test('creates an editable concept from a phrase without replacing artwork',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Clothing idea'}).fill('Oversized black hoodie with "AFTER HOURS" on the back');
 await page.getByRole('button',{name:'Create editable draft'}).click();
 await expect(page.getByRole('button',{name:'Hoodie'})).toHaveClass(/selected/);
 await expect(page.getByText('text: YOUR DESIGN')).toBeVisible();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByText('text: AFTER HOURS')).toBeVisible();
 await page.getByRole('button',{name:'Undo'}).click();
 await expect(page.getByText('text: AFTER HOURS')).toHaveCount(0);
});
test('exports a marked non-production supplier review',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export supplier review sheet'}).click();
 const file=await download;
 expect(file.suggestedFilename()).toContain('review.html');
 const stream=await file.createReadStream();let value='';
 for await(const chunk of stream)value+=chunk.toString();
 expect(value).toContain('Not a manufacturing tech pack');
 expect(value).toContain('Supplier and designer must confirm');
});
