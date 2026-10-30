import {expect,test} from '@playwright/test';

test('front and back details show larger original artwork without changing either side',async({page},testInfo)=>{
 test.setTimeout(90000);
 await page.goto('/');
 await page.getByRole('button',{name:'Small chest mark'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('FRONT DETAIL');
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('BACK DETAIL');
 await page.getByRole('button',{name:'Presentation',exact:true}).click();
 const preview=page.getByTestId('presentation-canvas');
 await expect(preview).toHaveAttribute('data-preview-ready','true',{timeout:20000});
 await page.getByRole('button',{name:'Front detail'}).click();
 await expect(preview).toHaveAttribute('data-preview-mode','front',{timeout:20000});
 await expect(preview).toHaveAttribute('data-preview-ready','true',{timeout:20000});
 await page.locator('.presentation-stage').screenshot({path:testInfo.outputPath('front-artwork-detail.png')});
 const frontData=await preview.evaluate(c=>(c as HTMLCanvasElement).toDataURL('image/png'));
 await page.getByRole('button',{name:'Back detail'}).click();
 await expect(preview).toHaveAttribute('data-preview-mode','back',{timeout:20000});
 const backData=await preview.evaluate(c=>(c as HTMLCanvasElement).toDataURL('image/png'));
 expect(backData).not.toBe(frontData);
 await page.locator('.presentation-stage').screenshot({path:testInfo.outputPath('back-artwork-detail.png')});
 await page.getByRole('button',{name:'Both views'}).click();
 await expect(preview).toHaveAttribute('data-preview-mode','overview',{timeout:20000});
 await page.getByRole('button',{name:'2D edit'}).click();
 await page.getByRole('button',{name:'Front',exact:true}).click();
 await expect(page.getByText('text: FRONT DETAIL')).toBeVisible();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByText('text: BACK DETAIL')).toBeVisible();
});

test('mobile zoom exposes the same document at a larger display size and allows fit reset',async({page},testInfo)=>{
 if(testInfo.project.name!=='mobile')return;
 await page.goto('/');
 await page.getByRole('button',{name:'Centered statement'}).click();
 await page.getByRole('button',{name:'Presentation',exact:true}).click();
 const canvas=page.getByTestId('presentation-canvas');
 await expect(canvas).toHaveAttribute('data-preview-ready','true',{timeout:20000});
 await page.getByRole('button',{name:'Front detail'}).click();
 await expect(canvas).toHaveAttribute('data-preview-mode','front',{timeout:20000});
 const before=await canvas.boundingBox();
 await page.getByRole('button',{name:'Zoom in presentation'}).click();
 await page.getByRole('button',{name:'Zoom in presentation'}).click();
 const after=await canvas.boundingBox();
 expect(after!.width).toBeGreaterThan(before!.width*1.9);
 expect(await canvas.evaluate(c=>(c as HTMLCanvasElement).width)).toBe(2400);
 const positions=await page.evaluate(()=>{
  const a=document.querySelector('.presentation-controls')!.getBoundingClientRect();
  const b=document.querySelector('.presentation-scroll')!.getBoundingClientRect();
  return {controlBottom:a.bottom,scrollTop:b.top};
 });
 expect(positions.controlBottom).toBeLessThanOrEqual(positions.scrollTop+2);
 await page.locator('.presentation-stage').screenshot({path:testInfo.outputPath('mobile-zoomed-design-detail.png')});
 await page.getByRole('button',{name:'Fit board'}).click();
 const reset=await canvas.boundingBox();
 expect(reset!.width).toBeCloseTo(before!.width,0);
 await page.getByRole('button',{name:'Expand board'}).click();
 await expect(page.locator('.presentation-stage')).toHaveClass(/is-focused/);
 await page.getByRole('button',{name:'Close full-screen board'}).click();
 await expect(page.locator('.presentation-stage')).not.toHaveClass(/is-focused/);
});

test('detail export matches current inspected side at full resolution and keeps default overview',async({page})=>{
 test.setTimeout(90000);
 await page.goto('/');
 await page.getByLabel('Design title').fill('Brand Review');
 await page.getByRole('button',{name:'Centered statement'}).click();
 await page.getByRole('button',{name:'Presentation',exact:true}).click();
 const canvas=page.getByTestId('presentation-canvas');
 await page.getByRole('button',{name:'Front detail'}).click();
 await expect(canvas).toHaveAttribute('data-preview-mode','front',{timeout:20000});
 const expected=await canvas.evaluate(c=>{
  const el=c as HTMLCanvasElement;
  const data=el.getContext('2d')!.getImageData(1850,800,1,1).data;
  return {size:[el.width,el.height],sample:Array.from(data)};
 });
 const down=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export presentation PNG'}).click();
 const file=await down;
 expect(file.suggestedFilename()).toBe('moatt-Brand-Review-front-detail.png');
 const buffers:Buffer[]=[];for await(const chunk of await file.createReadStream())buffers.push(Buffer.from(chunk));
 const exported=await page.evaluate(async(b64)=>{
  const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();
  const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(img,0,0);
  return {size:[img.width,img.height],sample:Array.from(ctx.getImageData(1850,800,1,1).data)};
 },Buffer.concat(buffers).toString('base64'));
 expect(exported).toEqual(expected);
 await page.getByRole('button',{name:'Both views'}).click();
 await expect(canvas).toHaveAttribute('data-preview-mode','overview',{timeout:20000});
 const other=page.waitForEvent('download');
 await page.getByRole('button',{name:'Download presentation'}).click();
 expect((await other).suggestedFilename()).toBe('moatt-Brand-Review-presentation.png');
});
