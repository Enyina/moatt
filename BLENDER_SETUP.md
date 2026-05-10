# Blender Setup for Realistic UV Templates

## Critical Fix: Why You Need This

The current `shirt.svg` is a **placeholder**. Without real UV templates:
- ❌ Designs stretch and warp
- ❌ Logos appear distorted
- ❌ Clothes don't align with body

Real UV templates from your 3D model = pixel-perfect alignment.

---

## Step-by-Step Blender Export

### 1. Import MakeHuman Model

```
File → Import → glTF 2.0 (.glb/.gltf)
Select: female-adult.glb (from MakeHuman export)
```

### 2. Inspect Mesh Structure

**CRITICAL**: Your model must have named meshes:

| Mesh Name | What It Is | Clothing Type |
|-----------|-----------|---------------|
| `torso` | Chest + stomach | Shirts, dresses |
| `legs` | Upper + lower legs | Pants, shorts |
| `arms` | Upper + lower arms | Sleeves |
| `head` | Head + neck | None |

**If your model is one mesh**:
```
1. Select mesh
2. Enter Edit Mode (Tab)
3. Select torso vertices
4. Press P → Separate by Selection
5. Rename: torso, legs, arms, head
```

### 3. Unwrap UV (The Magic Step)

**For each clothing mesh:**

```
1. Select mesh (torso for shirts)
2. Enter Edit Mode (Tab)
3. Select all faces (A)
4. UV → Smart UV Project
   ├── Island Margin: 0.02
   └── Angle Limit: 66°

OR for better results:

UV → Unwrap (if you marked seams)
```

**Seam marking (advanced)**:
```
1. Edge Select mode
2. Select edges where cuts make sense
   └── Shirt: under arms, down sides
3. Ctrl+E → Mark Seam
4. UV → Unwrap
```

### 4. Export UV Layout

```
UV Editing workspace (top tab)
│
UV → Export UV Layout
├── Format: PNG
├── Size: 2048 × 2048
├── Fill Opacity: 0.0 (wireframe)
└── Outline: 2px

Save as: /templates/makehuman/female/shirt.png
```

### 5. Test in App

```bash
# Replace placeholder
/public/templates/makehuman/female/
  ├── shirt.svg (old placeholder)
  └── shirt.png (new from Blender)
```

Refresh browser → Draw on template → See perfect alignment.

---

## UV Mapping Best Practices

### Shirt Template
```
┌─────────────────────┐
│    FRONT TORSO      │ ← Chest area
│                     │
├─────────────────────┤
│    BACK TORSO       │ ← Shoulder blades
│                     │
├─────────────────────┤
│  LEFT    │  RIGHT   │ ← Sleeves
│  SLEEVE  │  SLEEVE  │
└─────────────────────┘
```

### Pants Template
```
┌─────────────────────┐
│    FRONT WAIST      │
│                     │
├─────────────────────┤
│    BACK WAIST       │
│                     │
├─────────────────────┤
│  LEFT    │  RIGHT   │
│   LEG    │   LEG    │
└─────────────────────┘
```

---

## Quick Reference: Blender Hotkeys

| Action | Key |
|--------|-----|
| Edit Mode | Tab |
| Select All | A |
| Box Select | B |
| UV Unwrap | U |
| Export UV | UV → Export UV Layout |
| Mark Seam | Ctrl+E |
| Separate Mesh | P |

---

## Expected File Structure After

```
/public/
├── /models/
│   ├── female-adult.glb      ← From MakeHuman
│   ├── male-adult.glb
│   └── child.glb
│
└── /templates/
    └── /makehuman/
        └── /female/
            ├── shirt.png     ← NEW: Blender UV export
            ├── pants.png
            └── dress.png
```

---

## Verification Checklist

Before saying "it works":

- [ ] Exported PNG is 2048×2048
- [ ] UV islands don't overlap
- [ ] Template shows wireframe outline
- [ ] Drawing logo on chest → appears on 3D chest
- [ ] Drawing on sleeve → appears on arm
- [ ] No stretching on curved areas

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Texture stretches | Bad UV unwrap | Use Smart UV Project |
| Logo appears twice | Overlapping UVs | Check UV Editing view |
| Design upside down | flipY issue | Already fixed in code |
| Misaligned on body | Wrong UV template | Export from correct mesh |
| Blurry texture | Low res | Use 2048×2048 minimum |

---

## Time Investment

- **First time**: 30-45 minutes
- **After practice**: 5 minutes per template
- **ROI**: Zero stretching, professional results

---

## Video Tutorial Resources

- Blender UV Unwrapping: https://www.youtube.com/results?search_query=blender+uv+unwrap+clothing
- MakeHuman to Blender: https://www.youtube.com/results?search_query=makehuman+blender+workflow

---

## Summary

**Without this step**: Prototype only
**With this step**: Production-ready

Your call.
