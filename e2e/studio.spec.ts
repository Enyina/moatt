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
 await expect(page.locator('.preview-stage canvas').or(page.getByRole('alert').filter({hasText:'3D rendering is unavailable'}))).toBeVisible({timeout:15000});
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
 const unavailable=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(view.or(unavailable)).toBeVisible({timeout:15000});
 if(await unavailable.isVisible()){
  await expect(unavailable).toContainText('still editable and exportable in 2D');
 }else{
  await expect.poll(async()=>view.evaluate(node=>{
   const canvas=node as HTMLCanvasElement;return canvas.width>0&&canvas.height>0;
  }),{timeout:15000}).toBeTruthy();
  await expect(view).toHaveAttribute('data-mannequin-status','loaded',{timeout:20000});
 }
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

test('loads a verified mannequin and retains garment construction changes',async({page})=>{
 await page.goto('/');
 await page.getByRole('combobox',{name:'Sleeve length'}).selectOption('long');
 await page.getByRole('combobox',{name:'Hem length'}).selectOption('cropped');
 await page.getByRole('combobox',{name:'Neckline'}).selectOption('wide');
 const asset=page.waitForResponse(r=>r.url().includes('/models/mannequin.glb'),{timeout:6000}).catch(()=>null);
 await page.getByRole('button',{name:'3D preview'}).click();
 const response=await asset;
 if(response)expect(response.status()).toBe(200);
 else await expect(page.getByRole('alert').filter({hasText:'3D rendering is unavailable'})).toBeVisible();
 await page.reload();
 await expect(page.getByRole('combobox',{name:'Sleeve length'})).toHaveValue('long');
 await expect(page.getByRole('combobox',{name:'Hem length'})).toHaveValue('cropped');
 await expect(page.getByRole('combobox',{name:'Neckline'})).toHaveValue('wide');
});

test('keeps GPU allocations bounded across fabric and silhouette edits',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'3D preview'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:15000});
 if(await fallback.isVisible())return;
 await expect.poll(()=>canvas.getAttribute('data-gpu-textures')).not.toBeNull();
 const baselineTextures=Number(await canvas.getAttribute('data-gpu-textures'));
 const baselineGeometries=Number(await canvas.getAttribute('data-gpu-geometries'));
 for(let i=0;i<12;i++){
  await page.getByLabel('Fabric color').fill(i%2===0?'#ff4422':'#334455');
  await page.getByRole('combobox',{name:'Sleeve length'}).selectOption(i%2===0?'long':'short');
 }
 await page.waitForTimeout(1000);
 const textures=Number(await canvas.getAttribute('data-gpu-textures'));
 const geometries=Number(await canvas.getAttribute('data-gpu-geometries'));
 console.log('GPU allocations',JSON.stringify({baselineTextures,baselineGeometries,textures,geometries}));
 expect(textures-baselineTextures).toBeLessThanOrEqual(4);
 expect(geometries-baselineGeometries).toBeLessThanOrEqual(4);
});

test('exports independent transparent artwork rather than fabric color',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Add text'}).click();
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export PNG',exact:true}).click();
 const stream=await (await download).createReadStream();
 const chunks:Buffer[]=[];for await(const chunk of stream)chunks.push(Buffer.from(chunk));
 const encoded=Buffer.concat(chunks).toString('base64');
 const alpha=await page.evaluate(async(encoded)=>{
  const img=new Image();img.src='data:image/png;base64,'+encoded;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
  return ctx.getImageData(0,0,1,1).data[3];
 },encoded);
 expect(alpha).toBe(0);
});
