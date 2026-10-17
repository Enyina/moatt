# Moatt Garment Asset Specification (v1.0)

This document defines the technical requirements for 3D garment models (GLB) to be ingested by the Moatt configurator.

## 📂 1. Folder Location & Naming

All garment assets must be placed in:
`public/models/garments/`

### File Naming Convention
Assets must follow the pattern: `{garment_type}_{variant}.glb`

**Currently supported types:**
- `shirt`
- `gown`
- `trouser`

**Supported variants (Fit):**
- `slim` (Fitted / Slim fit)
- `regular` (Standard / Straight fit)
- `oversized` (Relaxed / Oversized fit)

**Examples:**
- `shirt_regular.glb`
- `shirt_slim.glb`
- `gown_regular.glb`

---

## 🏗️ 2. Internal Mesh Structure & Naming

To enable interactive features (decal stamping, material selection), the GLB must have **separated mesh objects** inside.

### Required Internal Mesh Names
The configurator uses these names to bind logic. If names do not match, the part will render but will not be selectable or configurable.

#### Shirt / Gown:
- `Shirt_Front` / `Gown_Bodice_Front`
- `Shirt_Back` / `Gown_Bodice_Back`
- `Sleeve_L` (Left Sleeve)
- `Sleeve_R` (Right Sleeve)
- `Collar` (or `Collar_Base`)
- `Hem` (for Gowns)

#### Trousers:
- `Leg_L`
- `Leg_R`
- `Waistband`

---

## 📐 3. Scale, Origin, and Orientation

- **Units**: Meters (1.0 = 1 Meter).
- **Scale**: The garment must be modeled to fit the **MakeHuman Standard Female/Male** body templates (approx. 1.7m - 1.8m height).
- **Origin**: The scene origin `(0, 0, 0)` must be at the **center of the floor** (between the feet). Do not center the origin on the garment's bounding box.
- **Orientation**: Y-Up (Right-handed coordinate system).

---

## 🎨 4. UVs & Materials

- **Clean UVs**: Each selectable part must have non-overlapping UVs for decal placement and texture tiling.
- **Material Slots**: Use unique material names for different parts if they should have different default textures (e.g., `Fabric_Main`, `Button_Material`).
- **Texture Maps**: Do not embed massive 4K textures in the GLB. Use standard PBR naming if embedding (BaseColor, Normal, Roughness).

---

## 🚫 5. Body Model Exclusion Rule

**DO NOT** include the mannequin or body mesh inside the garment GLB file. The configurator renders the body independently. Including it will cause z-fighting and double-rendering.

---

## ✅ 6. Validation Steps (Asset Inspector)

Once you drop a file into the directory, use the **Asset Inspector** in the Studio to validate:

1.  **Status Check**: Ensure the inspector shows `PRODUCTION ASSET` in green. If it shows `GHOST FALLBACK` (red wireframe), the file name or path is incorrect.
2.  **Discovery List**: Confirm all your internal meshes (`Shirt_Front`, etc.) appear in the "Discovery" list.
3.  **Binding Check**: Ensure the core panels show a **green binding tag** (e.g., `torso_front`). If they show `unbound`, check your internal mesh naming against this spec.
4.  **Interaction**: Click on the mesh in the 3D viewport. It should highlight and the property panel should react.
5.  **Decals**: Try to stamp a decal. It should follow the surface of your imported GLB.
