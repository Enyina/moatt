# 3D Mannequin Pipeline Guide

## Phase 1: MakeHuman Export (Manual Step)

### Installation
1. Download MakeHuman from: http://www.makehumancommunity.org/
2. Install Blender (for UV export): https://www.blender.org/

### Export Settings (Critical)

```
MAKEHUMAN EXPORT SETTINGS
=========================

Model: Base human (no clothes, no hair)
Pose: T-Pose (arms out, legs straight)

Export Tab Settings:
├── Format: glTF 2.0 (.glb)
├── Include:
│   ├── ☑ Geometry (mesh)
│   ├── ☑ UV coordinates
│   ├── ☑ Normals
│   ├── ☑ Skin weights (if rigging)
│   └── ☐ Cameras
│   └── ☐ Lights
│
├── Morphs:
│   └── ☐ All (keep file small)
│
└── Rigging:
    └── ☑ Game Engine (if animating)
    └── OR ☐ None (static mannequin)
```

### Required Models

Generate 3 base mannequins:

| Model | Gender | Age | Height | Build | Filename |
|-------|--------|-----|--------|-------|----------|
| Female Adult | Female | 25 | 170cm | Average | `female-adult.glb` |
| Male Adult | Male | 30 | 180cm | Average | `male-adult.glb` |
| Child | Female | 10 | 140cm | Slim | `child.glb` |

### UV Template Extraction (Blender)

```
BLENDER STEPS:
==============

1. Import .glb into Blender
2. Select mesh → Edit Mode
3. UV → Export UV Layout
4. Settings:
   ├── Format: PNG
   ├── Size: 2048x2048 (for HD textures)
   ├── Fill Opacity: 0.0 (wireframe only)
   └── Outline: 2px
5. Save as: `uv-template-[model].png`
```

## Phase 2: Clothing Templates

### UV Template Structure

```
/public/
├── /models/
│   ├── female-adult.glb
│   ├── male-adult.glb
│   └── child.glb
│
├── /templates/
│   ├── /makehuman/
│   │   ├── female/
│   │   │   ├── shirt.png (2048x2048 UV template)
│   │   │   ├── pants.png
│   │   │   └── dress.png
│   │   ├── male/
│   │   │   ├── shirt.png
│   │   │   └── pants.png
│   │   └── child/
│   │       ├── shirt.png
│   │       └── pants.png
│   └── /rpm/ (Ready Player Me - Phase 2)
│
└── /designs/ (User generated - empty initially)
    └── /user-123/
        ├── design-1.png
        └── design-2.png
```

### Template Dimensions

All templates: **2048 x 2048 pixels**
- High enough for 4K exports
- Manageable file sizes (~1-2MB PNG)
- Matches standard UV map resolution

## Phase 3: Texture Pipeline

### How UV Mapping Works

```
3D MODEL                    2D TEXTURE
   ┌─────┐                  ┌─────────────┐
   │ ╱╲  │    UV Unwrap     │  ┌───────┐  │
   │╱  ╲ │  ────────────→   │  │FRONT  │  │
   │ │ │ │                  │  │       │  │
   │ │ │ │                  │  │ BACK  │  │
   └─────┘                  │  │       │  │
                            │  └───────┘  │
                            └─────────────┘

User draws on 2D → Texture applied to 3D
```

### Fabric.js Canvas Setup

Canvas size matches template: **2048 x 2048**
- Scale down for display: CSS `width: 512px; height: 512px`
- Export at full resolution for quality

## Quick Start Commands

```bash
# Install Fabric.js
npm install fabric@5.3.0

# Install Three.js helpers
npm install three-stdlib

# Create directories
mkdir -p public/models public/templates/makehuman/female public/designs
```

## Next Steps (After Models Ready)

1. Place `.glb` files in `/public/models/`
2. Place UV templates in `/public/templates/`
3. Run `npm run dev`
4. Test: Select model → Draw on template → See on 3D

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Texture stretched | Wrong UV mapping | Check Blender UV export |
| Model too dark | Missing normals | Export normals in MakeHuman |
| Clothes don't fit | Different proportions | Use consistent base models |
| Texture blurry | Low resolution | Use 2048x2048 minimum |

## Future: Ready Player Me Integration

Phase 2 adds:
- RPM avatar generation via API
- Separate UV templates for RPM body type
- Same Fabric.js editor, different template base

```typescript
// RPM API (free tier: 2000 avatars/month)
const avatarUrl = await fetch('https://api.readyplayer.me/v2/avatars', {
  method: 'POST',
  headers: { 'X-API-Key': 'YOUR_KEY' },
  body: JSON.stringify({ bodyType: 'fullbody' })
});
```

---
**Status**: MVP targets MakeHuman pipeline only. RPM is Phase 2 enhancement.
