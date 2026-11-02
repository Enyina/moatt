import {test,expect} from '@playwright/test';

test('human avatar controls edit an adult body and save movement without changing design art',async({page},info)=>{
 test.setTimeout(110000);
 await page.goto('/');
 await page.getByRole('button',{name:'Small chest mark'}).click();
 await page.getByText('Human avatar · body and poses (beta)').click();
 await page.getByRole('button',{name:'Preview editable human'}).click();
 const canvas=page.locator('.preview-stage canvas');
 const fallback=page.getByRole('alert').filter({hasText:'3D rendering is unavailable'});
 await expect(canvas.or(fallback)).toBeVisible({timeout:20000});
 if(await fallback.isVisible())return;
 await expect(canvas).toHaveAttribute('data-mannequin-status','realistic-reference');
 await expect(canvas).toHaveAttribute('data-reference-status','loaded',{timeout:60000});
 // A working editor must change the actual imported mesh, not only form state.
 await expect(canvas).toHaveAttribute('data-avatar-morphs','supported',{timeout:20000});
 await expect(canvas).toHaveAttribute('data-avatar-rig','supported',{timeout:20000});
 const original=await canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL('image/png'));

 await page.getByRole('combobox',{name:'Avatar body presentation'}).selectOption('feminine');
 await page.getByRole('slider',{name:'Avatar age'}).press('End');
 await page.getByRole('slider',{name:'Avatar height'}).press('End');
 await page.getByRole('combobox',{name:'Avatar size'}).selectOption('XL');
 await page.getByRole('combobox',{name:'Avatar pose'}).selectOption('arms-up');
 await page.getByRole('slider',{name:'Avatar left arm'}).press('End');
 await page.getByRole('slider',{name:'Avatar rotation'}).press('End');
 await page.getByRole('slider',{name:'Avatar horizontal position'}).press('End');
 await expect.poll(()=>canvas.evaluate(c=>(c as HTMLCanvasElement).toDataURL('image/png')),{timeout:20000}).not.toBe(original);

 await expect(canvas).toHaveAttribute('data-avatar-presentation','feminine');
 await expect(canvas).toHaveAttribute('data-avatar-age','80');
 await expect(canvas).toHaveAttribute('data-avatar-size','XL');
 await expect(canvas).toHaveAttribute('data-avatar-pose','arms-up');
 await expect(canvas).toHaveAttribute('data-avatar-turn','180');
 await page.locator('.canvas').screenshot({path:info.outputPath('adult-avatar-adjusted-with-pose.png')});
 await page.reload();
 await page.getByText('Human avatar · body and poses (beta)').click();
 await expect(page.getByRole('combobox',{name:'Avatar pose'})).toHaveValue('arms-up');
 await expect(page.getByRole('combobox',{name:'Avatar body presentation'})).toHaveValue('feminine');
 await expect(page.getByRole('slider',{name:'Avatar horizontal position'})).toHaveValue('1.5');
 await page.getByRole('button',{name:'2D edit'}).click();
 await expect(page.getByText('text: YOUR BRAND')).toBeVisible();
});

test('reset human profile and separate front and back artwork survive pose changes',async({page})=>{
 await page.goto('/');
 await page.getByRole('button',{name:'Two-sided branding'}).click();
 await page.getByText('Human avatar · body and poses (beta)').click();
 await page.getByRole('combobox',{name:'Avatar pose'}).selectOption('walking');
 await page.getByRole('combobox',{name:'Avatar size'}).selectOption('XXL');
 await page.getByRole('button',{name:'Reset human avatar'}).click();
 await expect(page.getByRole('combobox',{name:'Avatar size'})).toHaveValue('M');
 await expect(page.getByRole('combobox',{name:'Avatar pose'})).toHaveValue('neutral');
 await page.getByRole('button',{name:'2D edit'}).click();
 await page.getByRole('button',{name:'Front',exact:true}).click();
 await expect(page.getByText('text: YOUR BRAND')).toBeVisible();
 await page.getByRole('button',{name:'Back',exact:true}).click();
 await expect(page.getByText('text: YOUR MESSAGE')).toBeVisible();
});
