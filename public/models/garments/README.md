# Garment Model Assets

This directory should contain the GLB models for the hybrid garment configurator.

## Naming Convention for Mesh Variants

The `Studio3D` style resolver expects the following naming pattern for mesh variants to support the `fit` style option:

- `{garment_name}_slim.glb` (for 'slim' or 'fitted' fit)
- `{garment_name}_regular.glb` (for 'regular' or 'straight' fit)
- `{garment_name}_oversized.glb` (for 'relaxed' or 'oversized' fit)

### Example for Shirt:
- `shirt_slim.glb`
- `shirt_regular.glb`
- `shirt_oversized.glb`

## Mesh Requirements
- Origin at (0, 0, 0)
- Correct scale for the mannequin (approx 1.8m height)
- Standard UV mapping for decals and textures
- (Optional) Separated meshes inside the GLB for specific panel materials
