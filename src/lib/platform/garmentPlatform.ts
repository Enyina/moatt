import { BodyProfile } from '../bodyProfile';
import { GARMENT_DEFINITIONS } from '../constants/products';
import { DEFAULT_HOODIE_PARAMS } from '../procedural/hoodie';
import { DEFAULT_TSHIRT_PARAMS } from '../procedural/tshirt';
import type { TShirtParams } from '../procedural/garmentTypes';
import type {
  GarmentDefinition,
  GarmentInstance,
  GarmentRenderContext,
  GarmentType,
  MaterialSlot,
  SavedGarment,
  SavedProject,
} from '../types';

export type PlatformGarmentInstance = GarmentInstance;

const GENERATOR_BY_TYPE: Partial<Record<GarmentType, string>> = {
  hoodie: 'procedural-hoodie-v1',
  shirt: 'procedural-tshirt-v1',
};

const DEFAULT_PARAMS_BY_TYPE: Partial<Record<GarmentType, Record<string, number>>> = {
  hoodie: DEFAULT_HOODIE_PARAMS,
  shirt: DEFAULT_TSHIRT_PARAMS,
};

const PROCEDURAL_TYPE_BY_GARMENT_TYPE: Partial<Record<GarmentType, string>> = {
  hoodie: 'hoodie',
  shirt: 'tshirt',
};

function getDefaultStyleOptions(definition: GarmentDefinition): Record<string, string> {
  return Object.fromEntries(
    Object.entries(definition.styleOptions).flatMap(([key, values]) => {
      const defaultValue = values?.[0];
      return defaultValue ? [[key, defaultValue]] : [];
    }),
  );
}

function cloneMaterialOverrides(materialSlots: MaterialSlot[]): Record<string, Partial<MaterialSlot>> {
  return Object.fromEntries(materialSlots.map((slot) => [slot.id, { ...slot, maps: { ...slot.maps } }]));
}

export function getGarmentDefinition<TType extends GarmentType>(
  type: TType,
): GarmentDefinition & { type: TType } {
  return GARMENT_DEFINITIONS[type] as GarmentDefinition & { type: TType };
}

export function getAvailableGarmentDefinitions(): GarmentDefinition[] {
  return Object.values(GARMENT_DEFINITIONS).filter((definition) => definition.status === 'available');
}

export function validateGarmentDefinition(definition: GarmentDefinition): { ok: true; issues: [] } {
  const issues: string[] = [];
  const materialSlotIds = new Set(definition.materialSlots.map((slot) => slot.id));
  const panelIds = new Set(definition.panels.map((panel) => panel.id));

  if (!definition.id) issues.push('Missing definition id.');
  if (!definition.label) issues.push('Missing label.');
  if (definition.status === 'available' && definition.materialSlots.length === 0) {
    issues.push('Available garments need at least one material slot.');
  }
  definition.bindings.forEach((binding) => {
    if (!panelIds.has(binding.semanticId)) {
      issues.push(`Binding "${binding.meshName}" points to missing panel "${binding.semanticId}".`);
    }
  });
  definition.decalZones.forEach((zone) => {
    if (!panelIds.has(zone.meshId)) {
      issues.push(`Decal zone "${zone.id}" points to missing panel "${zone.meshId}".`);
    }
  });
  if (definition.renderAsset.type === 'primitive') {
    definition.renderAsset.nodes.forEach((node) => {
      if (node.materialSlotId && !materialSlotIds.has(node.materialSlotId)) {
        issues.push(`Render node "${node.name}" points to missing material slot "${node.materialSlotId}".`);
      }
    });
  }

  if (issues.length > 0) {
    throw new Error(`Invalid garment definition "${definition.id}": ${issues.join(' ')}`);
  }

  return { ok: true, issues: [] };
}

export function createDefaultGarmentInstance<TType extends GarmentType>(
  definition: GarmentDefinition & { type: TType },
  overrides: Partial<Pick<GarmentInstance, 'id' | 'materials' | 'name' | 'params' | 'styleOptions' | 'visible'>> = {},
): GarmentInstance & { type: TType } {
  const generator = GENERATOR_BY_TYPE[definition.type];

  return {
    id: overrides.id ?? `garment_${definition.type}_${Date.now()}`,
    definitionId: definition.id,
    type: definition.type,
    source: generator
      ? { kind: 'procedural', generator }
      : definition.renderAsset.type === 'model'
        ? { kind: 'model', url: definition.renderAsset.url }
        : { kind: 'procedural', generator: `primitive-${definition.type}-v1` },
    name: overrides.name ?? definition.label,
    params: {
      ...(DEFAULT_PARAMS_BY_TYPE[definition.type] ?? {}),
      ...(overrides.params ?? {}),
    },
    styleOptions: {
      ...getDefaultStyleOptions(definition),
      ...(overrides.styleOptions ?? {}),
    },
    materials: overrides.materials ?? cloneMaterialOverrides(definition.materialSlots),
    decals: [],
    visible: overrides.visible ?? true,
    layer: 'outer',
  } as GarmentInstance & { type: TType };
}

function resolveTShirtParams(params: Record<string, number>, styleOptions: Record<string, string>): TShirtParams {
  const next: TShirtParams = { ...DEFAULT_TSHIRT_PARAMS, ...params };

  if (styleOptions.fit === 'slim') {
    next.looseness = Math.min(next.looseness, 0.9);
    next.torsoWidth = Math.min(next.torsoWidth, 0.48);
    next.sleeveTopRadius = Math.min(next.sleeveTopRadius, 0.1);
  } else if (styleOptions.fit === 'relaxed') {
    next.looseness = Math.max(next.looseness, 1.18);
    next.torsoWidth = Math.max(next.torsoWidth, 0.62);
    next.sleeveLength = Math.max(next.sleeveLength, 0.34);
    next.sleeveTopRadius = Math.max(next.sleeveTopRadius, 0.08);
  }

  if (styleOptions.neckline === 'v-neck') {
    next.neckWidth = next.neckWidth || 0.2;
    next.neckDropFront = Math.max(next.neckDropFront, 0.09);
    next.neckDropBack = next.neckDropBack || 0.012;
  } else if (styleOptions.neckline === 'collar') {
    next.neckWidth = next.neckWidth || 0.2;
    next.neckDropFront = Math.min(next.neckDropFront, 0.025);
    next.neckDropBack = Math.min(next.neckDropBack, 0.01);
  }

  if (styleOptions.sleeveType === 'long') {
    next.sleeveLength = Math.max(next.sleeveLength, 0.56);
    next.sleeveCuffRadius = Math.min(next.sleeveCuffRadius, 0.034);
  } else if (styleOptions.sleeveType === 'sleeveless') {
    next.sleeveLength = 0;
  }

  return next;
}

export function getProceduralTypeForGarment(type: GarmentType): string | null {
  return PROCEDURAL_TYPE_BY_GARMENT_TYPE[type] ?? null;
}

export function resolveGarmentRenderParams<TParams extends Record<string, number>>(
  instance: GarmentInstance,
  _context: GarmentRenderContext & { bodyProfile?: BodyProfile } = {},
): TParams {
  void _context;

  if (instance.type === 'shirt') {
    return resolveTShirtParams(instance.params, instance.styleOptions) as unknown as TParams;
  }

  if (instance.type === 'hoodie') {
    return { ...DEFAULT_HOODIE_PARAMS, ...instance.params } as unknown as TParams;
  }

  return { ...instance.params } as TParams;
}

export function normalizeGarmentInstances(project: Pick<SavedProject, 'garments'>): GarmentInstance[] {
  return project.garments.map((savedGarment: SavedGarment) => {
    const type = savedGarment.type;
    const definition = getGarmentDefinition(type);

    return createDefaultGarmentInstance(definition, {
      id: savedGarment.id,
      params: savedGarment.params as Record<string, number>,
      styleOptions: savedGarment.styleOptions,
      materials: savedGarment.materials,
    });
  });
}
