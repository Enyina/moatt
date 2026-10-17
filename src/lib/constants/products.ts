import {
  DecalZone,
  GarmentDefinition,
  GarmentType,
  MaterialBehavior,
  MaterialSlot,
  MeshBinding,
  MeshMeta,
  ProductPrimitiveNode,
  ProductState,
} from '../types';

const SOFT_CREPE: MaterialBehavior = {
  id: 'soft-crepe',
  name: 'Soft Crepe',
  stiffness: 0.35,
  stretch: 0.15,
  anisotropy: 0.05,
};

const STRUCTURED_COTTON: MaterialBehavior = {
  id: 'structured-cotton',
  name: 'Structured Cotton',
  stiffness: 0.58,
  stretch: 0.08,
  anisotropy: 0.03,
};

const TWILL: MaterialBehavior = {
  id: 'tailor-twill',
  name: 'Tailor Twill',
  stiffness: 0.7,
  stretch: 0.05,
  anisotropy: 0.12,
};

const material = (
  id: string,
  name: string,
  baseColor: string,
  behaviorId: string,
  roughness = 0.72,
): MaterialSlot => ({
  id,
  name,
  baseColor,
  roughness,
  metalness: 0,
  opacity: 1,
  behaviorId,
  maps: {},
});

const panel = (
  id: string,
  region: MeshMeta['region'],
  panelName: MeshMeta['panel'],
  side: MeshMeta['side'],
  label: string,
  layer: MeshMeta['layer'] = 'outer',
): MeshMeta => ({
  id,
  region,
  panel: panelName,
  layer,
  side,
  label,
});

const bind = (meshName: string, semanticId: string): MeshBinding => ({ meshName, semanticId });
const zone = (id: string, label: string, meshId: string): DecalZone => ({ id, label, meshId });

const gownNodes: ProductPrimitiveNode[] = [
  { name: 'gown-body', primitive: 'cylinder', position: [0, 0, 0], materialSlotId: 'gown-fabric', args: [0.3, 0.3, 1.2, 8] },
  { name: 'gown-neckline-trim', primitive: 'torus', args: [0.22, 0.018, 12, 48], position: [0, 1.04, 0.075], rotation: [Math.PI / 2, 0, 0], scale: [1.18, 0.62, 1], materialSlotId: 'gown-fabric' },
];

const shirtNodes: ProductPrimitiveNode[] = [
  { name: 'tshirt-group', primitive: 'procedural-tshirt', position: [0, 0.12, 0], materialSlotId: 'shirt-fabric', args: [] },
];

const hoodieNodes: ProductPrimitiveNode[] = [
  { name: 'hoodie-group', primitive: 'procedural-hoodie', position: [0, 0.12, 0], materialSlotId: 'hoodie-fabric', args: [] },
];

const trouserNodes: ProductPrimitiveNode[] = [
  { name: 'trouser-waistband', primitive: 'torus', args: [0.38, 0.03, 12, 64], position: [0, 0.26, 0.01], rotation: [Math.PI / 2, 0, 0], scale: [1, 0.55, 1], materialSlotId: 'trouser-fabric' },
  { name: 'trouser-left-leg', primitive: 'tube', args: [0.18, 0.13, 1.28, 36], position: [-0.17, -0.43, 0.005], scale: [0.88, 1, 0.7], materialSlotId: 'trouser-fabric' },
  { name: 'trouser-right-leg', primitive: 'tube', args: [0.18, 0.13, 1.28, 36], position: [0.17, -0.43, 0.005], scale: [0.88, 1, 0.7], materialSlotId: 'trouser-fabric' },
];

export const GARMENT_DEFINITIONS: Record<GarmentType, GarmentDefinition> = {
  gown: {
    id: 'plain-knee-length-gown-v1',
    type: 'gown',
    label: 'Plain Knee-Length Gown',
    status: 'available',
    requiredMeasurements: ['bust', 'waist', 'hip', 'shoulder', 'sleeve', 'length'],
    styleOptions: {
      neckline: ['round', 'v-neck', 'square'],
      sleeveType: ['short', 'sleeveless', 'three-quarter'],
      fit: ['regular', 'fitted', 'relaxed'],
      length: ['knee', 'midi', 'ankle'],
      flare: ['straight', 'a-line', 'full'],
      closure: ['back zip', 'side zip', 'buttons'],
    },
    panels: [
      panel('torso_front', 'torso', 'front', 'center', 'Front Gown Panel'),
      panel('torso_back', 'torso', 'back', 'center', 'Back Gown Panel'),
      panel('sleeve_left', 'arms', 'sleeve', 'left', 'Left Short Sleeve'),
      panel('sleeve_right', 'arms', 'sleeve', 'right', 'Right Short Sleeve'),
      panel('hem', 'legs', 'hem', 'center', 'Knee-Length Hem'),
    ],
    materialSlots: [material('gown-fabric', 'Plain Matte Crepe', '#D7C9BA', SOFT_CREPE.id)],
    materialBehaviors: [SOFT_CREPE],
    bindings: [
      bind('Gown_Bodice_Front', 'torso_front'),
      bind('Gown_Bodice_Back', 'torso_back'),
      bind('Gown_Hem', 'hem'),
      bind('Sleeve_L', 'sleeve_left'),
      bind('Sleeve_R', 'sleeve_right'),
      // Fallback for the whole body
      bind('gown-body', 'torso_front'),
    ],
    renderAsset: { type: 'primitive', normalizedHeight: 1.45, position: [0, 0.16, 0], nodes: gownNodes },
    decalZones: [zone('gown-front-chest', 'Front bodice', 'torso_front'), zone('gown-hem-front', 'Hem front', 'hem')],
  },
  shirt: {
    id: 'basic-shirt-v1',
    type: 'shirt',
    label: 'Basic Shirt',
    status: 'available',
    requiredMeasurements: ['chest', 'waist', 'shoulder', 'sleeve', 'length', 'neck'],
    styleOptions: {
      neckline: ['crew', 'v-neck', 'collar'],
      sleeveType: ['short', 'long', 'sleeveless'],
      fit: ['regular', 'slim', 'relaxed'],
      closure: ['pullover', 'buttons'],
    },
    panels: [
      panel('shirt_front', 'torso', 'front', 'center', 'Front Shirt Panel'),
      panel('shirt_back', 'torso', 'back', 'center', 'Back Shirt Panel'),
      panel('shirt_left_side', 'torso', 'side', 'left', 'Left Side Seam'),
      panel('shirt_right_side', 'torso', 'side', 'right', 'Right Side Seam'),
      panel('shirt_left_sleeve', 'arms', 'sleeve', 'left', 'Left Sleeve'),
      panel('shirt_right_sleeve', 'arms', 'sleeve', 'right', 'Right Sleeve'),
      panel('shirt_collar', 'torso', 'collar', 'center', 'Collar', 'trim'),
    ],
    materialSlots: [material('shirt-fabric', 'Structured Cotton', '#E7E1D5', STRUCTURED_COTTON.id)],
    materialBehaviors: [STRUCTURED_COTTON],
    bindings: [
      bind('tshirt-front', 'shirt_front'),
      bind('tshirt-back', 'shirt_back'),
      bind('tshirt-leftSide', 'shirt_left_side'),
      bind('tshirt-rightSide', 'shirt_right_side'),
      bind('tshirt-leftSleeve', 'shirt_left_sleeve'),
      bind('tshirt-rightSleeve', 'shirt_right_sleeve'),
      bind('Collar_Base', 'shirt_collar'),
    ],
    renderAsset: { type: 'primitive', normalizedHeight: 0.72, position: [0, 0.48, 0], nodes: shirtNodes },
    decalZones: [zone('shirt-front-print', 'Front print area', 'shirt_front'), zone('shirt-back-print', 'Back print area', 'shirt_back')],
  },
  hoodie: {
    id: 'basic-hoodie-v1',
    type: 'hoodie',
    label: 'Basic Pullover Hoodie',
    status: 'available',
    requiredMeasurements: ['chest', 'waist', 'shoulder', 'sleeve', 'length'],
    styleOptions: {
      fit: ['regular', 'oversized', 'slim'],
      closure: ['pullover'],
    },
    panels: [
      panel('hoodie_front', 'torso', 'front', 'center', 'Front Panel'),
      panel('hoodie_back', 'torso', 'back', 'center', 'Back Panel'),
      panel('hoodie_left_side', 'torso', 'side', 'left', 'Left Side Seam'),
      panel('hoodie_right_side', 'torso', 'side', 'right', 'Right Side Seam'),
      panel('hoodie_left_sleeve', 'arms', 'sleeve', 'left', 'Left Sleeve'),
      panel('hoodie_right_sleeve', 'arms', 'sleeve', 'right', 'Right Sleeve'),
      panel('hoodie_hood', 'head', 'collar', 'center', 'Hood'),
      panel('hoodie_pocket', 'torso', 'pocket', 'center', 'Kangaroo Pocket'),
    ],
    materialSlots: [material('hoodie-fabric', 'Heavy Cotton', '#D3D3D3', STRUCTURED_COTTON.id)],
    materialBehaviors: [STRUCTURED_COTTON],
    bindings: [
      bind('hoodie-front', 'hoodie_front'),
      bind('hoodie-back', 'hoodie_back'),
      bind('hoodie-leftSide', 'hoodie_left_side'),
      bind('hoodie-rightSide', 'hoodie_right_side'),
      bind('hoodie-leftSleeve', 'hoodie_left_sleeve'),
      bind('hoodie-rightSleeve', 'hoodie_right_sleeve'),
      bind('hoodie-hood', 'hoodie_hood'),
      bind('hoodie-pocket', 'hoodie_pocket'),
    ],
    renderAsset: { type: 'primitive', normalizedHeight: 0.8, position: [0, 0.48, 0], nodes: hoodieNodes },
    decalZones: [zone('hoodie-front-print', 'Front print area', 'hoodie_front'), zone('hoodie-back-print', 'Back print area', 'hoodie_back')],
  },
  trouser: {
    id: 'basic-trouser-v1',
    type: 'trouser',
    label: 'Basic Trouser',
    status: 'available',
    requiredMeasurements: ['waist', 'hip', 'inseam', 'thigh', 'length'],
    styleOptions: {
      fit: ['straight', 'slim', 'relaxed'],
      length: ['ankle', 'full', 'cropped'],
      closure: ['zip fly', 'elastic waist', 'drawstring'],
    },
    panels: [
      panel('trouser_waistband', 'torso', 'waistband', 'center', 'Waistband'),
      panel('trouser_left_leg', 'legs', 'front', 'left', 'Left Leg'),
      panel('trouser_right_leg', 'legs', 'front', 'right', 'Right Leg'),
    ],
    materialSlots: [material('trouser-fabric', 'Tailor Twill', '#2F3437', TWILL.id, 0.78)],
    materialBehaviors: [TWILL],
    bindings: [
      bind('trouser-waistband', 'trouser_waistband'),
      bind('trouser-left-leg', 'trouser_left_leg'),
      bind('trouser-right-leg', 'trouser_right_leg'),
    ],
    renderAsset: { type: 'primitive', normalizedHeight: 1.15, position: [0, -0.28, 0], nodes: trouserNodes },
    decalZones: [zone('trouser-left-thigh', 'Left thigh mark', 'trouser_left_leg'), zone('trouser-right-thigh', 'Right thigh mark', 'trouser_right_leg')],
  },
  skirt: {
    id: 'skirt-placeholder-v1',
    type: 'skirt',
    label: 'Skirt',
    status: 'coming_soon',
    requiredMeasurements: ['waist', 'hip', 'length'],
    styleOptions: { fit: ['straight', 'a-line'], length: ['mini', 'knee', 'midi'] },
    panels: [],
    materialSlots: [],
    materialBehaviors: [],
    bindings: [],
    renderAsset: { type: 'primitive', nodes: [] },
    decalZones: [],
  },
  jacket: {
    id: 'jacket-placeholder-v1',
    type: 'jacket',
    label: 'Jacket',
    status: 'coming_soon',
    requiredMeasurements: ['chest', 'waist', 'shoulder', 'sleeve', 'length'],
    styleOptions: { fit: ['regular', 'tailored'], closure: ['buttons', 'zip'] },
    panels: [],
    materialSlots: [],
    materialBehaviors: [],
    bindings: [],
    renderAsset: { type: 'primitive', nodes: [] },
    decalZones: [],
  },
  native_wear: {
    id: 'native-wear-placeholder-v1',
    type: 'native_wear',
    label: 'Native Wear',
    status: 'coming_soon',
    requiredMeasurements: ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'length'],
    styleOptions: { neckline: ['round', 'embroidered'], fit: ['regular', 'relaxed'], length: ['hip', 'knee'] },
    panels: [],
    materialSlots: [],
    materialBehaviors: [],
    bindings: [],
    renderAsset: { type: 'primitive', nodes: [] },
    decalZones: [],
  },
};

const recordById = <T extends { id: string }>(items: T[]): Record<string, T> => (
  items.reduce<Record<string, T>>((record, item) => {
    record[item.id] = item;
    return record;
  }, {})
);

export function buildProductStateFromGarment(garment: GarmentDefinition): ProductState {
  const defaultMaterialSlotId = garment.materialSlots[0]?.id || 'default-fabric';

  return {
    id: garment.id,
    metadata: {
      name: garment.label,
      category: garment.type,
    },
    renderAsset: garment.renderAsset,
    meshes: garment.panels.reduce<ProductState['meshes']>((meshes, meta) => {
      meshes[meta.id] = {
        materialSlotId: garment.materialSlots[0]?.id || defaultMaterialSlotId,
        visible: true,
        meta,
      };
      return meshes;
    }, {}),
    materials: recordById(garment.materialSlots.length > 0
      ? garment.materialSlots
      : [material(defaultMaterialSlotId, 'Default Fabric', '#D7C9BA', SOFT_CREPE.id)]),
    behaviors: recordById(garment.materialBehaviors.length > 0 ? garment.materialBehaviors : [SOFT_CREPE]),
    bindings: garment.bindings,
    decals: [],
  };
}

export const DEFAULT_GARMENT_TYPE: GarmentType = 'gown';
export const PLAIN_KNEE_LENGTH_GOWN_V1 = buildProductStateFromGarment(GARMENT_DEFINITIONS.gown);
export const T_SHIRT_V1 = buildProductStateFromGarment(GARMENT_DEFINITIONS.shirt);
export const HOODIE_V1 = buildProductStateFromGarment(GARMENT_DEFINITIONS.hoodie);
