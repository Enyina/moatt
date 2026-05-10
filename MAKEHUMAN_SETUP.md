# MakeHuman Integration Setup Guide

## Overview
This guide explains how to set up MakeHuman models for all body types in Moatt. The system now supports rigged, animation-ready base meshes with standard bone hierarchies for women, men, and children categories.

## Required Models

### Women Body Types
1. **female-standard.dae** - Standard adult female build
2. **female-athletic.dae** - Athletic female build with toned proportions  
3. **female-plus.dae** - Plus size female build

### Men Body Types
1. **male-standard.dae** - Standard adult male build
2. **male-athletic.dae** - Athletic male build with muscular proportions
3. **male-plus.dae** - Plus size male build

### Children Body Types
1. **child-toddler.dae** - Toddler build (ages 2-4)
2. **child-youth.dae** - Youth build (ages 8-12)
3. **child-teen.dae** - Teen build (ages 13-17)

## MakeHuman Export Settings

### Critical Export Configuration
```
MAKEHUMAN EXPORT SETTINGS
=========================

Model: Base human (no clothes, no hair)
Pose: T-Pose (arms out, legs straight)

Export Tab Settings:
├── Format: Collada (.dae) - REQUIRED for Three.js compatibility
├── Include:
│   ├── ☑ Geometry (mesh)
│   ├── ☑ UV coordinates
│   ├── ☑ Normals
│   ├── ☑ Skin weights (rigging)
│   └── ☐ Cameras
│   └── ☐ Lights
│
├── Morphs:
│   └── ☐ All (keep file small)
│
└── Rigging:
    └── ☑ Game Engine (standard bone hierarchy)
```

### Step-by-Step Export Process

1. **Open MakeHuman**
   - Download from: http://www.makehumancommunity.org/
   - Launch the application

2. **Configure Base Model**
   - Start with default human model
   - Adjust parameters for each body type:
     - **Women**: Use female gender, adjust age, muscle, weight
     - **Men**: Use male gender, adjust age, muscle, weight  
     - **Children**: Use child age settings, adjust height/weight

3. **Set Pose**
   - Go to Pose tab
   - Select "T-Pose" (arms straight out, legs straight)
   - This ensures consistent UV mapping

4. **Export Model**
   - Go to Export tab
   - Choose Collada (.dae) format
   - Use the exact filenames from the "Required Models" section
   - Ensure all required options are checked

5. **File Placement**
   - Save exported .dae files to: `/public/models/makehuman/`
   - Verify filenames match the configuration in `/src/lib/models.ts`

## UV Template Creation

### Blender Setup for UV Export
```
BLENDER STEPS:
==============

1. Import .dae into Blender
2. Select mesh → Edit Mode
3. UV → Export UV Layout
4. Settings:
   ├── Format: PNG
   ├── Size: 2048x2048 (for HD textures)
   ├── Fill Opacity: 0.0 (wireframe only)
   └── Outline: 2px
5. Save as: [body-type]-[clothing].png
```

### Required UV Templates
Place templates in `/public/templates/makehuman/[category]/`

**Women templates:**
- female-standard-shirt.png
- female-standard-pants.png
- female-standard-dress.png
- female-athletic-shirt.png
- female-athletic-pants.png
- female-athletic-dress.png
- female-plus-shirt.png
- female-plus-pants.png
- female-plus-dress.png

**Men templates:**
- male-standard-shirt.png
- male-standard-pants.png
- male-athletic-shirt.png
- male-athletic-pants.png
- male-plus-shirt.png
- male-plus-pants.png

**Children templates:**
- child-toddler-shirt.png
- child-toddler-pants.png
- child-toddler-shorts.png
- child-youth-shirt.png
- child-youth-pants.png
- child-youth-shorts.png
- child-teen-shirt.png
- child-teen-pants.png
- child-teen-shorts.png

## System Integration

### Model Configuration
The system uses `/src/lib/models.ts` to map body types to model files:

```typescript
export const BODY_TYPE_CONFIGS: Record<string, BodyTypeConfig> = {
  'female-standard': {
    id: 'female-standard',
    name: 'Women Standard',
    category: 'women',
    modelPath: '/models/makehuman/female_standard.dae',
    scale: 1.0,
    position: [0, -1, 0],
    description: 'Standard adult female build'
  },
  // ... other configurations
};
```

### UV Template Configuration
UV templates are mapped in `/src/lib/templates.ts`:

```typescript
export const UV_TEMPLATE_CONFIGS: Record<string, UVTemplateConfig> = {
  'female-standard': {
    bodyTypeId: 'female-standard',
    category: 'women',
    templates: {
      shirt: '/templates/makehuman/women/female-standard-shirt.png',
      pants: '/templates/makehuman/women/female-standard-pants.png',
      dress: '/templates/makehuman/women/female-standard-dress.png'
    }
  },
  // ... other configurations
};
```

## Testing the Integration

### 1. Verify Model Loading
```bash
npm run dev
# Navigate to /templates
# Check browser console for model loading errors
```

### 2. Test Template Display
- Each template should show the correct 3D model
- Models should have proper proportions for their category
- Fallback to procedural models if MakeHuman models fail to load

### 3. Verify UV Mapping
- Select a template
- Open design editor
- Draw on clothing template
- Verify texture appears correctly on 3D model

## Troubleshooting

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Model doesn't load | Wrong file path or missing file | Verify .dae files exist in `/public/models/makehuman/` |
| Texture stretched | Wrong UV mapping | Re-export UV layout from Blender |
| Model too dark | Missing normals | Ensure normals exported from MakeHuman |
| Wrong proportions | Incorrect scale | Adjust scale in BODY_TYPE_CONFIGS |
| Animation errors | Missing rigging | Ensure "Game Engine" rigging exported |

### Debug Console Logs
The system provides detailed logging:
- `=== DAE MESH STRUCTURE for [body-type] ===` - Shows mesh structure
- `[MannequinViewer] Applied texture to: [mesh-name]` - Texture application
- Loading errors with fallback activation

## Next Steps

1. **Export all 9 MakeHuman models** using the settings above
2. **Create UV templates** for each body type and clothing type
3. **Test the integration** by running the development server
4. **Verify template selection** works for all categories
5. **Test clothing design** workflow with real models

## Benefits of This Setup

- **Rigged Models**: All models include standard bone hierarchies for animation
- **Consistent UV Mapping**: T-Pose ensures predictable texture mapping
- **Scalable System**: Easy to add new body types by updating configuration
- **Fallback Support**: Procedural models if MakeHuman models fail
- **Performance Optimized**: Efficient loading with error boundaries

---

**Status**: System is ready for MakeHuman model integration. Follow the steps above to complete the setup.
