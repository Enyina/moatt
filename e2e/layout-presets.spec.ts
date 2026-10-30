import {test,expect} from '@playwright/test';

test('start a usable chest layout, center it and undo without losing the text',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Small chest mark'}).click();
 const text=page.getByRole('textbox',{name:'Selected layer text'});
 await expect(text).toHaveValue('YOUR BRAND');
 const top=page.getByLabel('Y',{exact:true});
 expect(Number(await top.inputValue())).toBe(254);
 await page.getByRole('button',{name:'Top center'}).click();
 expect(Number(await top.inputValue())).toBe(170);
 await page.getByRole('button',{name:'Undo'}).click();
 expect(Number(await top.inputValue())).toBe(254);
 await text.fill('MIDNIGHT CLUB');
 await expect(page.getByText('text: MIDNIGHT CL')).toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:'text: MIDNIGHT CL'}).click();
 await expect(page.getByRole('textbox',{name:'Selected layer text'})).toHaveValue('MIDNIGHT CLUB');
});

test('generate independent front/back brand layout and copy the chosen element across',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('EXISTING ART');
 await page.getByRole('button',{name:'Front + back branding'}).click();
 await expect(page.getByText('text: YOUR MESSAGE')).toBeVisible();
 await page.getByRole('button',{name:'Front',exact:true}).click();
 await expect(page.getByText('text: EXISTING ART')).toBeVisible();
 await expect(page.getByText('text: YOUR BRAND')).toBeVisible();
 await page.getByRole('button',{name:'text: YOUR BRAND'}).click();
 await page.getByRole('button',{name:'Copy to back'}).click();
 await expect(page.getByText('text: YOUR MESSAGE')).toBeVisible();
 await expect(page.getByText('text: YOUR BRAND')).toBeVisible();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('BACK UNIQUE');
 await page.getByRole('button',{name:'Front',exact:true}).click();
 await expect(page.getByText('text: YOUR BRAND')).toBeVisible();
 await expect(page.getByText('text: BACK UNIQUE')).toHaveCount(0);
 await page.getByRole('button',{name:'Presentation'}).click();
 await expect(page.getByTestId('presentation-canvas')).toHaveAttribute('data-preview-ready','true',{timeout:20000});
});

test('fit uploaded art proportionally into print guide before sharing it',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Centered statement'}).click();
 await page.getByLabel('Width',{exact:true}).fill('1024');
 await page.getByLabel('Height',{exact:true}).fill('500');
 await page.getByRole('button',{name:'Fit safe guide'}).click();
 const width=Number(await page.getByLabel('Width',{exact:true}).inputValue());
 const height=Number(await page.getByLabel('Height',{exact:true}).inputValue());
 expect(width).toBeLessThanOrEqual(664);
 expect(height).toBeLessThanOrEqual(680);
 expect(width/height).toBeCloseTo(1024/500,2);
 await page.getByRole('button',{name:'2D edit'}).click();
 await expect(page.locator('canvas[aria-label="front artwork canvas"]')).toBeVisible();
});
