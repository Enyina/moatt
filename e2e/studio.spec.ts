import {test,expect} from '@playwright/test';
test('creates front and back designs and restores saved project',async({page})=>{
 await page.goto('/');await expect(page.getByText(/MOATT/)).toBeVisible();
 await page.getByRole('button',{name:'Add text'}).click();
 await expect(page.getByText('text: YOUR DESIGN')).toBeVisible();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('FRONT TEST');
 await page.getByRole('button',{name:'Back'}).click();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('BACK TEST');
 await expect(page.getByText('text: BACK TEST')).toBeVisible();
 await page.reload();
 await expect(page.getByText('text: BACK TEST')).toBeVisible();
 await page.getByRole('button',{name:'Front'}).click();
 await expect(page.getByText('text: FRONT TEST')).toBeVisible();
});
test('switches garment and uses undo',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Hoodie'}).click();await expect(page.getByRole('button',{name:'Hoodie'})).toHaveClass(/selected/);await page.getByRole('button',{name:'Undo'}).click();await expect(page.getByRole('button',{name:'T-shirt'})).toHaveClass(/selected/);});
