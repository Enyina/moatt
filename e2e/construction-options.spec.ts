import {test,expect} from '@playwright/test';
test('colorway duplication retains artwork while allowing independent material changes',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('KEEP THIS');
 await page.getByRole('button',{name:'Duplicate colorway'}).click();
 await expect(page.getByText('text: KEEP THIS')).toBeVisible();
 await expect(page.getByLabel('Design title')).toHaveValue(/colorway/);
 await page.getByLabel('Fabric color').fill('#ff5500');
 await page.getByRole('button',{name:'Undo'}).click();
 await expect(page.getByLabel('Fabric color')).not.toHaveValue('#ff5500');
});
test('pocket option persists and switching to T-shirt clears invalid hoodie pouch',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Hoodie'}).click();
 await page.getByRole('combobox',{name:'Pocket style'}).selectOption('kangaroo');
 await page.reload();
 await expect(page.getByRole('combobox',{name:'Pocket style'})).toHaveValue('kangaroo');
 await page.getByRole('button',{name:'T-shirt'}).click();
 await expect(page.getByRole('combobox',{name:'Pocket style'})).toHaveValue('none');
});
test('mobile editor controls remain within viewport',async({page},testInfo)=>{
 if(testInfo.project.name!=='mobile')return;
 await page.goto('/');
 const width=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:window.innerWidth}));
 expect(width.document).toBeLessThanOrEqual(width.viewport+2);
 await expect(page.getByRole('button',{name:'New text'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Paint design'})).toBeVisible();
});
