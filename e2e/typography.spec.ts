import {test,expect} from '@playwright/test';

test('type styling updates real pixels and survives reload on the chosen side',async({page},testInfo)=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Centered statement'}).click();
 const art=page.locator('canvas[aria-label="front artwork canvas"]');
 await expect(art).toBeVisible();
 const first=await art.evaluate(node=>(node as HTMLCanvasElement).toDataURL('image/png'));
 await page.getByRole('button',{name:'Editorial'}).click();
 await expect(page.getByRole('combobox',{name:'Text typeface'})).toHaveValue('serif');
 await page.getByRole('combobox',{name:'Text weight'}).selectOption('regular');
 await page.getByRole('combobox',{name:'Text alignment'}).selectOption('right');
 await page.getByRole('spinbutton',{name:'Text letter spacing'}).fill('5');
 await page.getByRole('spinbutton',{name:'Text line spacing'}).fill('1.4');
 await expect.poll(()=>art.evaluate(node=>(node as HTMLCanvasElement).toDataURL('image/png'))).not.toBe(first);
 await page.locator('.canvas').screenshot({path:testInfo.outputPath('styled-apparel-artwork.png')});
 await page.reload();
 await page.getByRole('button',{name:'text: MAKE IT YOUR'}).click();
 await expect(page.getByRole('combobox',{name:'Text typeface'})).toHaveValue('serif');
 await expect(page.getByRole('combobox',{name:'Text alignment'})).toHaveValue('right');
 await expect(page.getByRole('spinbutton',{name:'Text letter spacing'})).toHaveValue('5');
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByText('text: MAKE IT YOUR')).toHaveCount(0);
 await page.getByRole('button',{name:'Presentation',exact:true}).click();
 await expect(page.getByTestId('presentation-canvas')).toHaveAttribute('data-preview-ready','true',{timeout:25000});
 await page.locator('.canvas').screenshot({path:testInfo.outputPath('styled-apparel-presentation.png')});
});
test('typographic preset is undoable, a copied label becomes independently editable',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Small chest mark'}).click();
 await page.getByRole('button',{name:'Utility label'}).click();
 await expect(page.getByRole('combobox',{name:'Text typeface'})).toHaveValue('mono');
 await page.getByRole('button',{name:'Streetwear'}).click();
 await expect(page.getByRole('combobox',{name:'Text typeface'})).toHaveValue('display');
 await page.getByRole('button',{name:'Undo'}).click();
 await expect(page.getByRole('combobox',{name:'Text typeface'})).toHaveValue('mono');
 await page.getByRole('button',{name:'Copy to back'}).click();
 await page.getByRole('combobox',{name:'Text typeface'}).selectOption('serif');
 await page.getByRole('button',{name:'Front',exact:true}).click();
 await page.getByRole('button',{name:'text: YOUR BRAND'}).click();
 await expect(page.getByRole('combobox',{name:'Text typeface'})).toHaveValue('mono');
});

test('a tiny text box reports overflow rather than pretending artwork is production-safe',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Centered statement'}).click();
 await page.getByLabel('Width',{exact:true}).fill('20');
 await page.getByLabel('Height',{exact:true}).fill('20');
 await expect(page.getByRole('alert')).toContainText('Text exceeds this box',{timeout:15000});
 await page.getByLabel('Width',{exact:true}).fill('640');
 await page.getByLabel('Height',{exact:true}).fill('200');
 await expect(page.getByRole('alert')).toHaveCount(0);
});
