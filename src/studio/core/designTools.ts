import type { StudioSelection, StudioState, StudioToolId } from './types';

export type StudioToolCategory =
  | 'select'
  | 'shape'
  | 'surface'
  | 'asset'
  | 'outfit'
  | 'mannequin'
  | 'view'
  | 'export';

export interface StudioToolDefinition {
  id: StudioToolId;
  label: string;
  category: StudioToolCategory;
  shortcut?: string;
  selectionMode: StudioSelection['type'][];
}

const ANY_SELECTION: StudioSelection['type'][] = [
  'none',
  'mannequin',
  'garment',
  'panel',
  'decal',
  'region',
];

export const DESIGN_TOOLS = {
  select: {
    id: 'select',
    label: 'Select',
    category: 'select',
    shortcut: 'V',
    selectionMode: ANY_SELECTION,
  },
  shape: {
    id: 'shape',
    label: 'Shape',
    category: 'shape',
    shortcut: 'S',
    selectionMode: ['garment', 'panel'],
  },
  panel: {
    id: 'panel',
    label: 'Panel',
    category: 'surface',
    shortcut: 'P',
    selectionMode: ['garment', 'panel'],
  },
  fabric: {
    id: 'fabric',
    label: 'Fabric',
    category: 'surface',
    shortcut: 'F',
    selectionMode: ['garment', 'panel'],
  },
  graphic: {
    id: 'graphic',
    label: 'Graphic',
    category: 'asset',
    shortcut: 'G',
    selectionMode: ['garment', 'panel', 'decal'],
  },
  outfit: {
    id: 'outfit',
    label: 'Outfit',
    category: 'outfit',
    shortcut: 'O',
    selectionMode: ANY_SELECTION,
  },
  mannequin: {
    id: 'mannequin',
    label: 'Mannequin',
    category: 'mannequin',
    shortcut: 'M',
    selectionMode: ANY_SELECTION,
  },
  preview: {
    id: 'preview',
    label: 'Preview',
    category: 'view',
    shortcut: 'Space',
    selectionMode: ANY_SELECTION,
  },
  export: {
    id: 'export',
    label: 'Export',
    category: 'export',
    shortcut: 'E',
    selectionMode: ANY_SELECTION,
  },
} as const satisfies Record<StudioToolId, StudioToolDefinition>;

export function getStudioTool(id: StudioToolId): StudioToolDefinition {
  return DESIGN_TOOLS[id];
}

export function isStudioToolAvailable(tool: StudioToolDefinition, state: StudioState): boolean {
  return tool.selectionMode.includes(state.selection.type);
}

export function getAvailableStudioTools(state: StudioState): StudioToolDefinition[] {
  return Object.values(DESIGN_TOOLS).filter((tool) => isStudioToolAvailable(tool, state));
}
