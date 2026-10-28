import {test,expect} from '@playwright/test';
test('garment switch starts with normal clothing proportions and retains manual overrides',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Hoodie'}).click();
 await expect(page.getByRole('combobox',{name:'Sleeve length'})).toHaveValue('long');
 await expect(page.getByRole('combobox',{name:'Pocket style'})).toHaveValue('kangaroo');
 await page.getByRole('combobox',{name:'Sleeve length'}).selectOption('short');
 await page.getByRole('button',{name:'Hoodie'}).click();
 await expect(page.getByRole('combobox',{name:'Sleeve length'})).toHaveValue('short');
 await page.getByRole('button',{name:'T-shirt'}).click();
 await expect(page.getByRole('combobox',{name:'Sleeve length'})).toHaveValue('short');
 await expect(page.getByRole('combobox',{name:'Pocket style'})).toHaveValue('none');
});
