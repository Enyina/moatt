import {test,expect} from '@playwright/test';
test('creates front and back designs and restores saved project',async({page})=>{
 await page.goto('/');await expect(page.getByText(/MOATT/)).toBeVisible();
 await page.getByRole('button',{name:'Add text'}).click();
 await expect(page.getByText('text: YOUR DESIGN')).toBeVisible();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('FRONT TEST');
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('BACK TEST');
 await expect(page.getByText('text: BACK TEST')).toBeVisible();
 await page.reload();
 await page.getByRole('button',{name:'Back',exact:true}).click();
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
test('draws on artwork without invoking 3D orbit and opens the mannequin',async({page},testInfo)=>{
 await page.goto('/');
 await page.getByRole('button',{name:'draw',exact:true}).click();
 const artboard=page.locator('.artboard canvas');await artboard.scrollIntoViewIfNeeded();const b=await artboard.boundingBox();expect(b).toBeTruthy();
 if(testInfo.project.name==='mobile'){await page.touchscreen.tap(b!.x+b!.width/2,b!.y+b!.height/2)}else{await page.mouse.move(b!.x+b!.width/3,b!.y+b!.height/3);await page.mouse.down();await page.mouse.move(b!.x+b!.width/2,b!.y+b!.height/2,{steps:6});await page.mouse.up();}
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

test('captures editable garment and 3D design evidence',async({page},testInfo)=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('MOATT');
 await page.getByRole('button',{name:'3D preview'}).click();
 const view=page.locator('.preview-stage canvas');
 await expect(view).toBeVisible();
 await expect.poll(async()=>view.evaluate((node)=>{const c=node as HTMLCanvasElement;return c.width>0&&c.height>0})).toBeTruthy();
 await page.screenshot({path:testInfo.outputPath('garment-preview.png'),fullPage:true});
 await page.getByRole('button',{name:'2D edit'}).click();
 await page.screenshot({path:testInfo.outputPath('artwork-editor.png'),fullPage:true});
});
test('nudges the selected layer with keyboard and can undo',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 const input=page.getByLabel('X',{exact:true});
 const before=Number(await input.inputValue());
 await page.locator('.artboard canvas').click({position:{x:15,y:15}});
 await page.getByText('text: YOUR DESIGN').click();
 await page.keyboard.press('ArrowRight');
 await expect(input).toHaveValue(String(before+1));
 await page.getByRole('button',{name:'Undo'}).click();
 await expect(input).toHaveValue(String(before));
});
