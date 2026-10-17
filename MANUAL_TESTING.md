# MOATT MANUAL TESTING CHECKLIST

## 1. Setup & Initialization
- **Open URL:** `http://localhost:3000/design/new?template=male-standard`
- **Expected Result:** App loads without crashing. 3D studio displays a male mannequin wearing a procedural T-shirt.
- **Console Check:** No `WebGL context lost` or `Uncaught Error` logs.
- **Fail Condition:** White screen in the 3D area.

## 2. Procedural Garments
### 2.1 T-Shirt Rendering
- **Action:** Ensure Garment Type is `Basic Shirt`.
- **Expected Result:** T-Shirt renders front, back, and sleeves properly.
- **Action:** Draw a red stroke on the 2D Fabric Canvas.
- **Expected Result:** The red stroke projects correctly onto the corresponding 3D UV region.
- **Pass/Fail:** [ ] Pass / [ ] Fail

### 2.2 Hoodie Rendering
- **Action:** Change Garment Type to `Hoodie`.
- **Expected Result:** Hoodie shape generates. Hood, pocket, and drawstrings are distinctly visible.
- **Action:** Verify pocket geometry sits *above* the torso, not z-fighting.
- **Expected Result:** Drawstrings render as solid tubes (not flat or missing).
- **Pass/Fail:** [ ] Pass / [ ] Fail

## 3. Parametric Controls
- **Action:** In the Garment tab, move `TORSO LENGTH`, `LOOSENESS`, and `SLEEVE LENGTH` sliders to their maximum values.
- **Expected Result:** The 3D model geometry stretches and adapts instantly.
- **What should NOT happen:** The material should *not* reset to default plastic. Any red stroke you drew earlier must still be visible and dynamically stretched across the new geometry.
- **Pass/Fail:** [ ] Pass / [ ] Fail

## 4. Fabric Material Presets
- **Action:** Click a mesh region on the 3D model (e.g., the front torso). The debug overlay should show `Selected Part: shirt_front` or similar.
- **Action:** In the Material tab, apply `Denim`.
- **Expected Result:** Fabric physically looks like denim twill.
- **Action:** Apply `Leather`.
- **Expected Result:** Fabric physically looks like leather grain.
- **What should NOT happen:** The red stroke you drew earlier must *not* disappear. Base color must remain preserved.
- **Pass/Fail:** [ ] Pass / [ ] Fail

## 5. HDRI Studio Lighting
- **Action:** Go to the Studio tab. Select `Dark Editorial`.
- **Expected Result:** The scene gets darker, lighting contrast increases, and the background reflects the moody environment.
- **Action:** Select `Outdoor Overcast`.
- **Expected Result:** The scene becomes bright and soft. Specular highlights on Leather/Silk change accordingly.
- **What should NOT happen:** The browser must not crash or show a white screen when switching.
- **Pass/Fail:** [ ] Pass / [ ] Fail

## 6. Project Persistence (Save/Load)
- **Action:** With the customized hoodie (Leather preset, red stroke, Dark Editorial lighting) active, click `EXPORT` in the Property Panel.
- **Expected Result:** A JSON file downloads successfully.
- **Action:** Refresh the page (`CMD+R`).
- **Expected Result:** The app resets to the default Basic Shirt.
- **Action:** Click `IMPORT` and select the downloaded JSON file.
- **Expected Result:** The Hoodie geometry, slider values, Leather material, red stroke drawing, and Dark Editorial lighting are all fully restored.
- **Pass/Fail:** [ ] Pass / [ ] Fail

## 7. V1 Legacy Migration (Optional)
- **Action:** Try importing an older saved JSON file (before the garments array existed).
- **Expected Result:** The app successfully hydrates the old format into the new V2 schema without crashing.
- **Pass/Fail:** [ ] Pass / [ ] Fail

---

### Known Acceptable Visual Imperfections (Do Not Block)
- Slight texture stretching near extreme parametric deformation bounds.
- Very faint seams where UV islands meet.

### Screenshot Capture Points
Please capture and upload screenshots if you encounter:
1. Pure white or black screen instead of the 3D scene.
2. Z-fighting (flickering polygons) on the Hoodie pocket.
3. Drawstrings looking flat instead of 3D tubes.
4. Fabric texture completely disappearing when moving a slider.
