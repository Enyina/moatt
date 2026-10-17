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
 await page.getByRole('button',{name:'Back'}).click();
 await expect(page.getByText('text: BACK TEST')).toBeVisible();
 await page.getByRole('button',{name:'Front'}).click();
 await expect(page.getByText('text: FRONT TEST')).toBeVisible();
});
test('switches garment and uses undo',async({page})=>{await page.goto('/');await page.getByRole('button',{name:'Hoodie'}).click();await expect(page.getByRole('button',{name:'Hoodie'})).toHaveClass(/selected/);await page.getByRole('button',{name:'Undo'}).click();await expect(page.getByRole('button',{name:'T-shirt'})).toHaveClass(/selected/);});

test('uploads artwork and exports a PNG',async({page})=>{
 await page.goto('/');
 await page.locator('input[type=file][accept*="image/png"]').setInputFiles({name:'mark.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/X6kAAAAASUVORK5CYII=','base64')});
 await expect(page.getByText('image: image')).toBeVisible();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export PNG',exact:true}).click();
 expect((await download).suggestedFilename()).toContain('front.png');
});
test('draws on artwork without invoking 3D orbit and opens the mannequin',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'draw',exact:true}).click();
 const artboard=page.locator('.artboard canvas');const b=await artboard.boundingBox();expect(b).toBeTruthy();
 await page.mouse.move(b!.x+b!.width/3,b!.y+b!.height/3);
 await page.mouse.down();await page.mouse.move(b!.x+b!.width/2,b!.y+b!.height/2,{steps:6});await page.mouse.up();
 await expect(page.getByText(/stroke: brush stroke/)).toBeVisible();
 await page.getByRole('button',{name:'3D preview'}).click();
 await expect(page.locator('.preview-stage canvas')).toBeVisible();
});
test('round trips project JSON through import',async({page})=>{
 await page.goto('/');
 await page.getByLabel('Design title').fill('Round trip design');
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Save project'}).click();
 const file=await download;
 expect(file.suggestedFilename()).toContain('Round-trip-design.json');
 const source=await file.createReadStream();
 const chunks:Buffer[]=[];for await(const part of source)chunks.push(Buffer.from(part));
 const json=Buffer.concat(chunks);
 page.once('dialog',dialog=>dialog.accept());
 await page.locator('input[type=file][accept*="application/json"]').setInputFiles({name:'round-trip.json',mimeType:'application/json',buffer:json});
 await expect(page.getByLabel('Design title')).toHaveValue('Round trip design');
});
