import {test,expect} from '@playwright/test';

/**
 * This is intentionally not a WebGL fallback test. Without a functioning
 * renderer the critical realistic-print flow must fail, not silently pass.
 */
test('existing front artwork maps into the real T-shirt native UV atlas',async({page},info)=>{
 test.setTimeout(120000);
 await page.goto('/?moattUvDebug=1');
 await page.getByRole('button',{name:'Small chest mark'}).click();
 await page.getByText('Human avatar · body and poses (beta)').click();
 await page.getByRole('button',{name:'Preview editable human'}).click();

 const canvas=page.locator('.preview-stage canvas');
 await expect(canvas).toBeVisible({timeout:25000});
 await expect(canvas).toHaveAttribute('data-reference-status','loaded',{timeout:60000});
 await expect(canvas).toHaveAttribute('data-realistic-print-status','mapped',{timeout:25000});
 await expect(canvas).toHaveAttribute('data-realistic-print-debug','true');
 const count=Number(await canvas.getAttribute('data-realistic-print-triangles'));
 expect(count).toBeGreaterThan(0);
 const calibration=await page.locator('.canvas').screenshot({path:info.outputPath('real-tshirt-front-uv-debug.png')});

 // Switch the same saved design back from high-contrast UV debug to its
 // actual front artwork. A changed screenshot cannot independently establish
 // correct alignment, but catches a texture path that never updates.
 await page.goto('/');
 await page.getByText('Human avatar · body and poses (beta)').click();
 await page.getByRole('button',{name:'Preview editable human'}).click();
 await expect(canvas).toBeVisible({timeout:25000});
 await expect(canvas).toHaveAttribute('data-reference-status','loaded',{timeout:60000});
 await expect(canvas).toHaveAttribute('data-realistic-print-status','mapped',{timeout:25000});
 await expect(canvas).toHaveAttribute('data-realistic-print-debug','false');
 const actual=await page.locator('.canvas').screenshot({path:info.outputPath('real-tshirt-front-artwork.png')});
 expect(actual.equals(calibration)).toBe(false);

 // Deforming the body must preserve a mapped garment, with no new fallback.
 await page.getByRole('combobox',{name:'Avatar size'}).selectOption('XL');
 await page.getByRole('combobox',{name:'Avatar pose'}).selectOption('arms-up');
 await expect(canvas).toHaveAttribute('data-realistic-print-status','mapped');
 await page.locator('.canvas').screenshot({path:info.outputPath('real-tshirt-front-xl-raised-arms.png')});
 await page.reload();
 await page.getByText('Human avatar · body and poses (beta)').click();
 await expect(page.getByRole('combobox',{name:'Avatar size'})).toHaveValue('XL');
 await expect(page.getByRole('combobox',{name:'Avatar pose'})).toHaveValue('arms-up');
 await page.getByRole('button',{name:'Preview editable human'}).click();
 await expect(canvas).toHaveAttribute('data-realistic-print-status','mapped',{timeout:60000});
});
