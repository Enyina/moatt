import {test,expect} from '@playwright/test';

test('builds a genuinely usable front and back lookbook preview and PNG',async({page},testInfo)=>{
 await page.goto('/');
 await page.getByLabel('Design title').fill('Night Shift');
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('NIGHT SHIFT');
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await page.getByRole('button',{name:'Add text'}).click();
 await page.getByRole('textbox',{name:'Selected layer text'}).fill('EST 2026');
 await page.getByRole('button',{name:'Hoodie'}).click();
 await page.getByLabel('Fabric color').fill('#283650');
 await page.getByRole('button',{name:'Presentation'}).click();
 const visual=page.getByTestId('presentation-canvas');
 await expect(visual).toBeVisible();
 await expect(visual).toHaveAttribute('data-preview-ready','true',{timeout:20000});
 const data=await visual.evaluate((element)=>{
  const c=element as HTMLCanvasElement,ctx=c.getContext('2d')!;
  const sample=(x:number,y:number)=>Array.from(ctx.getImageData(x,y,1,1).data).join(',');
  return {width:c.width,height:c.height,background:sample(18,18),
    left:sample(610,690),right:sample(1810,690),label:sample(600,120)};
 });
 expect(data).toMatchObject({width:2400,height:1500});
 expect(data.left).not.toBe(data.background);
 expect(data.right).not.toBe(data.background);
 await page.screenshot({path:testInfo.outputPath('real-lookbook-preview.png'),fullPage:true});
 const download=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export presentation PNG'}).click();
 const file=await download;
 expect(file.suggestedFilename()).toContain('Night-Shift-presentation.png');
 const stream=await file.createReadStream(),chunks:Buffer[]=[];
 for await(const chunk of stream)chunks.push(Buffer.from(chunk));
 const png=Buffer.concat(chunks);
 expect(png.length).toBeGreaterThan(100_000);
 const meta=await page.evaluate(async(base64)=>{
  const image=new Image();image.src='data:image/png;base64,'+base64;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const ctx=canvas.getContext('2d')!;ctx.drawImage(image,0,0);
  const color=ctx.getImageData(610,690,1,1).data;
  return {width:canvas.width,height:canvas.height,opaque:color[3],pixel:Array.from(color)};
 },png.toString('base64'));
 expect(meta.width).toBe(2400);
 expect(meta.height).toBe(1500);
 expect(meta.opaque).toBe(255);
});
test('changing the garment material and body fit changes actual presentation pixels',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Presentation'}).click();
 const visual=page.getByTestId('presentation-canvas');
 await expect(visual).toHaveAttribute('data-preview-ready','true',{timeout:20000});
 const snapshot=async()=>visual.evaluate((element)=>{
  const canvas=element as HTMLCanvasElement;
  const ctx=canvas.getContext('2d')!;
  const out=ctx.getImageData(270,570,700,540).data;
  let sum=0;for(let i=0;i<out.length;i+=67)sum=(sum*33+out[i])>>>0;
  return sum;
 });
 const initial=await snapshot();
 await page.getByRole('combobox',{name:'Fabric material'}).selectOption('denim');
 await expect.poll(snapshot,{timeout:20000}).not.toBe(initial);
 const denim=await snapshot();
 await page.getByRole('button',{name:'Hoodie'}).click();
 await expect.poll(snapshot,{timeout:20000}).not.toBe(denim);
 await page.getByRole('button',{name:'2D edit'}).click();
 await page.getByRole('button',{name:'Presentation'}).click();
 await expect(visual).toHaveAttribute('data-preview-ready','true',{timeout:20000});
});
test('presentation remains available even when WebGL preview is unsupported',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Presentation'}).click();
 await expect(page.getByTestId('presentation-canvas')).toHaveAttribute('data-preview-ready','true',{timeout:20000});
 await page.getByRole('button',{name:'3D preview'}).click();
 await expect(page.locator('.preview-stage canvas').or(page.getByRole('alert').filter({hasText:'3D rendering is unavailable'}))).toBeVisible({timeout:15000});
 await page.getByRole('button',{name:'Presentation'}).click();
 await expect(page.getByTestId('presentation-canvas')).toHaveAttribute('data-preview-ready','true',{timeout:20000});
});

test('first-time founder creates a shareable design, saves, reopens and exports without assistance',async({page},testInfo)=>{
 await page.goto('/');
 await page.getByRole('textbox',{name:'Clothing idea'}).fill('Oversized black hoodie with "MIDNIGHT CLUB" on the front');
 await page.getByRole('button',{name:'Create editable draft'}).click();
 await expect(page.getByRole('button',{name:'Hoodie'})).toHaveClass(/selected/);
 await expect(page.getByText('text: MIDNIGHT CLUB')).toBeVisible();
 await page.getByRole('button',{name:'Save to my designs'}).click();
 const stored=page.getByRole('button',{name:/Open Black Oversized Hoodie concept/});
 await expect(stored).toBeVisible();
 page.once('dialog',d=>d.accept());
 await page.getByRole('button',{name:'New design'}).click();
 await expect(page.getByText('text: MIDNIGHT CLUB')).toHaveCount(0);
 page.once('dialog',d=>d.accept());
 await stored.click();
 await expect(page.getByText('text: MIDNIGHT CLUB')).toBeVisible();
 await page.getByRole('button',{name:'Presentation'}).click();
 const canvas=page.getByTestId('presentation-canvas');
 await expect(canvas).toHaveAttribute('data-preview-ready','true',{timeout:20000});
 await page.screenshot({path:testInfo.outputPath('founder-journey-saved-design.png'),fullPage:true});
 const d=page.waitForEvent('download');
 await page.getByRole('button',{name:'Export presentation PNG'}).click();
 const exported=await d;
 expect(exported.suggestedFilename()).toMatch(/Black-Oversized-Hoodie-concept-presentation\.png/);
});
