'use client';

import React, { useMemo, useRef, useState } from 'react';
import { GARMENT_DEFINITIONS } from '../../lib/constants/products';
import { getGarmentDefinition } from '../../lib/platform/garmentPlatform';
import { DESIGN_TOOLS, getAvailableStudioTools } from '../core/designTools';
import {
  addStudioDecal,
  applySavedStudioGarment,
  applySavedStudioLook,
  addGarmentToStudio,
  createSavedStudioGarment,
  createSavedStudioLook,
  createInitialStudioState,
  duplicateStudioGarment,
  removeStudioGarment,
  selectStudioTarget,
  setStudioMannequin,
  setStudioTool,
  toggleStudioGarmentVisibility,
  updateStudioGarmentMaterial,
  updateStudioGarmentParams,
  updateStudioGarmentStyleOption,
} from '../core/studioState';
import {
  createMoattStudioDesignDocument,
  createStudioConceptPdfBlob,
  createStudioStateFromMoattDesignDocument,
} from '../core/studioExport';
import type { SavedStudioGarment, SavedStudioLook, StudioState, StudioToolId } from '../core/types';
import type { DecalZone, GarmentType, MeasurementKey } from '../../lib/types';
import { BabylonStudioViewport } from '../engine/BabylonStudioViewport';
import { StudioTextureCanvas } from './StudioTextureCanvas';

const GARMENT_OPTIONS = Object.values(GARMENT_DEFINITIONS).filter((garment) => garment.status === 'available');
const SHAPE_CONTROLS = ['torsoLength', 'torsoWidth', 'looseness', 'sleeveLength', 'neckWidth', 'neckDropFront'] as const;
const MEASUREMENT_CONTROLS: MeasurementKey[] = ['chest', 'waist', 'hip', 'shoulder', 'sleeve', 'inseam', 'length'];
const SAVED_LOOKS_KEY = 'moatt.studio.savedLooks';
const SAVED_GARMENTS_KEY = 'moatt.studio.savedGarments';
const COLOR_SWATCHES = ['#E7E1D5', '#EA931D', '#2255AA', '#5E8C61', '#2F3437', '#B63F35'];

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

function formatLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ToolButton({
  active,
  disabled,
  label,
  onClick,
  shortcut,
}: {
  active: boolean;
  disabled?: boolean;
  label: string;
  onClick: () => void;
  shortcut?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        'flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-bold transition-colors',
        active
          ? 'border-[#EA931D]/70 bg-[#EA931D] text-white'
          : 'border-white/10 bg-white/[0.04] text-white/45 hover:border-white/20 hover:text-white',
        disabled && 'cursor-not-allowed border-white/5 bg-transparent text-white/15 hover:text-white/15',
      )}
    >
      {label.slice(0, 1)}
    </button>
  );
}

function getActiveGarment(state: StudioState) {
  return state.outfit.garmentInstances.find((garment) => garment.id === state.outfit.activeGarmentInstanceId) ?? null;
}

function readSavedList<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed as T[] : [];
  } catch {
    return [];
  }
}

function writeSavedList<T>(key: string, value: T[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function downloadText(content: string, filename: string, type = 'application/json') {
  downloadBlob(new Blob([content], { type }), filename);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata = '', base64 = ''] = dataUrl.split(',');
  const mime = metadata.match(/^data:([^;]+)/)?.[1] ?? 'application/octet-stream';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function captureStudioViewport(type: 'image/png' | 'image/jpeg', quality?: number): string | null {
  const canvas = document.querySelector<HTMLCanvasElement>('canvas[data-studio-viewport="true"]');
  if (!canvas) return null;
  return canvas.toDataURL(type, quality);
}

function filenamePart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'moatt-design';
}

function readJsonFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(JSON.parse(String(reader.result ?? '')));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file.'));
    reader.readAsText(file);
  });
}

function zoneAnchor(zone: DecalZone) {
  const isBack = zone.meshId.includes('back');
  return {
    type: 'mesh' as const,
    meshId: zone.meshId,
    position: [0, 0, 0] as [number, number, number],
    normal: [0, 0, isBack ? -1 : 1] as [number, number, number],
  };
}

export function StudioShell() {
  const [studio, setStudio] = useState(() => createInitialStudioState({
    name: 'Moatt Studio Draft',
    garments: [{ type: 'shirt' }],
  }));
  const [savedLooks, setSavedLooks] = useState<SavedStudioLook[]>(() => readSavedList<SavedStudioLook>(SAVED_LOOKS_KEY));
  const [savedGarments, setSavedGarments] = useState<SavedStudioGarment[]>(() => readSavedList<SavedStudioGarment>(SAVED_GARMENTS_KEY));
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const activeGarment = getActiveGarment(studio);
  const activeDefinition = activeGarment ? getGarmentDefinition(activeGarment.type) : null;
  const activeMaterialSlotId = activeDefinition?.materialSlots[0]?.id ?? null;
  const activeMaterial = activeGarment && activeMaterialSlotId
    ? activeGarment.materials[activeMaterialSlotId] ?? activeDefinition?.materialSlots[0]
    : null;
  const availableTools = useMemo(() => getAvailableStudioTools(studio), [studio]);
  const availableToolIds = new Set(availableTools.map((tool) => tool.id));

  const setTool = (toolId: StudioToolId) => setStudio((state) => setStudioTool(state, toolId));
  const setActiveGarment = (garmentInstanceId: string) => {
    setStudio((state) => selectStudioTarget(state, { type: 'garment', garmentInstanceId }));
  };
  const saveGarment = () => {
    const saved = createSavedStudioGarment(studio);
    if (!saved) return;
    const next = [saved, ...savedGarments.filter((item) => item.id !== saved.id)].slice(0, 12);
    setSavedGarments(next);
    writeSavedList(SAVED_GARMENTS_KEY, next);
  };
  const saveLook = () => {
    const saved = createSavedStudioLook(studio);
    const next = [saved, ...savedLooks.filter((item) => item.id !== saved.id)].slice(0, 12);
    setSavedLooks(next);
    writeSavedList(SAVED_LOOKS_KEY, next);
  };
  const updateActiveTexture = (textureDataUrl: string, canvasState: unknown) => {
    if (!activeGarment || !activeMaterialSlotId) return;
    setStudio((state) => updateStudioGarmentMaterial(state, activeGarment.id, activeMaterialSlotId, {
      canvasState,
      maps: {
        baseColorMap: textureDataUrl,
      },
    }));
  };
  const exportPng = () => {
    const preview = captureStudioViewport('image/png');
    if (!preview) {
      setExportStatus({ type: 'error', message: 'Could not capture the studio preview.' });
      return;
    }
    downloadBlob(dataUrlToBlob(preview), `${filenamePart(studio.name)}.png`);
    setExportStatus({ type: 'success', message: 'PNG export downloaded.' });
  };
  const exportPdf = () => {
    const preview = captureStudioViewport('image/jpeg', 0.92);
    if (!preview) {
      setExportStatus({ type: 'error', message: 'Could not capture the studio preview.' });
      return;
    }
    downloadBlob(createStudioConceptPdfBlob({ studio, previewDataUrl: preview }), `${filenamePart(studio.name)}-concept-sheet.pdf`);
    setExportStatus({ type: 'success', message: 'PDF concept sheet downloaded.' });
  };
  const exportJson = () => {
    const preview = captureStudioViewport('image/png');
    const document = createMoattStudioDesignDocument(studio, preview);
    downloadText(JSON.stringify(document, null, 2), `${filenamePart(studio.name)}.moatt.json`);
    setExportStatus({ type: 'success', message: 'Moatt JSON export downloaded.' });
  };
  const importJson = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const parsed = await readJsonFile(file);
      setStudio(createStudioStateFromMoattDesignDocument(parsed));
      setExportStatus({ type: 'success', message: 'Moatt design reopened.' });
    } catch (error) {
      setExportStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Could not import this design file.',
      });
    }
  };

  return (
    <main className="flex h-screen min-h-0 bg-[#0d0d0d] text-white">
      <aside className="flex w-20 shrink-0 flex-col items-center gap-3 border-r border-white/10 bg-black/30 px-3 py-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[#EA931D] font-bold italic">
          M
        </div>
        {Object.values(DESIGN_TOOLS).map((tool) => (
          <ToolButton
            key={tool.id}
            active={studio.activeToolId === tool.id}
            disabled={!availableToolIds.has(tool.id)}
            label={tool.label}
            shortcut={tool.shortcut}
            onClick={() => setTool(tool.id)}
          />
        ))}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-white/10 px-5">
          <div>
            <h1 className="text-sm font-semibold">{studio.name}</h1>
            <p className="text-[11px] text-white/35">{studio.outfit.name}</p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/45">
            <span>{studio.mannequin.bodyTemplateId}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{studio.outfit.garmentInstances.length} garment{studio.outfit.garmentInstances.length === 1 ? '' : 's'}</span>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-[280px_minmax(0,1fr)_360px]">
          <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-white/[0.025] p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">Outfit</h2>
              <select
                value=""
                onChange={(event) => {
                  const type = event.target.value as GarmentType;
                  if (!type) return;
                  setStudio((state) => addGarmentToStudio(state, { type }));
                }}
                className="rounded-md border border-white/10 bg-[#151515] px-2 py-1 text-xs text-white/70"
              >
                <option value="">Add</option>
                {GARMENT_OPTIONS.map((garment) => (
                  <option key={garment.type} value={garment.type}>{garment.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {studio.outfit.garmentInstances.map((garment) => (
                <button
                  key={garment.id}
                  type="button"
                  onClick={() => setActiveGarment(garment.id)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors',
                    garment.id === studio.outfit.activeGarmentInstanceId
                      ? 'border-[#EA931D]/60 bg-[#EA931D]/10'
                      : 'border-white/10 bg-white/[0.035] hover:border-white/20',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-semibold">{garment.name}</span>
                    <span className={cn('text-[10px]', garment.visible ? 'text-emerald-300/70' : 'text-white/25')}>
                      {garment.visible ? 'Visible' : 'Hidden'}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-white/30">{garment.type}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="relative min-h-0 overflow-hidden bg-[radial-gradient(circle_at_50%_24%,rgba(234,147,29,0.12),transparent_30%),#101010]">
            <div className="absolute inset-0">
              <BabylonStudioViewport studio={studio} />
            </div>
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2 rounded-lg border border-white/10 bg-black/40 p-2 backdrop-blur">
              {(['front', 'side', 'back', 'three-quarter'] as const).map((view) => (
                <button
                  key={view}
                  type="button"
                  className={cn(
                    'rounded-md px-3 py-1.5 text-[11px] font-semibold capitalize',
                    studio.camera.view === view ? 'bg-white text-black' : 'bg-white/5 text-white/50',
                  )}
                  onClick={() => setStudio((state) => ({ ...state, camera: { ...state.camera, view }, updatedAt: new Date().toISOString() }))}
                >
                  {view.replace('-', ' ')}
                </button>
              ))}
            </div>
          </section>

          <aside className="min-h-0 overflow-y-auto border-l border-white/10 bg-[#111] p-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-white/40">
              {formatLabel(studio.activeToolId)}
            </h2>

            {studio.activeToolId === 'mannequin' && (
              <div className="mt-5 space-y-4">
                <label className="block text-xs text-white/45">
                  Body Template
                  <select
                    value={studio.mannequin.bodyTemplateId}
                    onChange={(event) => setStudio((state) => setStudioMannequin(state, { bodyTemplateId: event.target.value }))}
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                  >
                    <option value="female-standard">Female Standard</option>
                    <option value="male-standard">Male Standard</option>
                    <option value="female-plus">Female Plus</option>
                    <option value="male-athletic">Male Athletic</option>
                  </select>
                </label>
                {MEASUREMENT_CONTROLS.map((key) => (
                  <label key={key} className="block text-xs text-white/45">
                    {formatLabel(key)}
                    <input
                      type="number"
                      value={studio.mannequin.measurements[key] ?? ''}
                      onChange={(event) => setStudio((state) => setStudioMannequin(state, {
                        measurements: {
                          [key]: event.target.value === '' ? null : Number(event.target.value),
                        },
                      }))}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                    />
                  </label>
                ))}
              </div>
            )}

            {studio.activeToolId === 'shape' && activeGarment && (
              <div className="mt-5 space-y-4">
                <p className="text-xs text-white/35">{activeGarment.name}</p>
                {activeDefinition && Object.entries(activeDefinition.styleOptions).map(([optionId, values]) => (
                  <label key={optionId} className="block text-xs text-white/45">
                    {formatLabel(optionId)}
                    <select
                      value={activeGarment.styleOptions[optionId] ?? values?.[0] ?? ''}
                      onChange={(event) => setStudio((state) => updateStudioGarmentStyleOption(
                        state,
                        activeGarment.id,
                        optionId,
                        event.target.value,
                      ))}
                      className="mt-2 w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white"
                    >
                      {(values ?? []).map((value: string) => (
                        <option key={value} value={value}>{formatLabel(value)}</option>
                      ))}
                    </select>
                  </label>
                ))}
                {SHAPE_CONTROLS.map((key) => (
                  <label key={key} className="block text-xs text-white/45">
                    {formatLabel(key)}
                    <input
                      type="range"
                      min={key === 'looseness' ? 0.8 : 0.01}
                      max={key === 'looseness' ? 1.6 : 1.5}
                      step="0.01"
                      value={activeGarment.params[key] ?? 0.1}
                      onChange={(event) => setStudio((state) => updateStudioGarmentParams(
                        state,
                        activeGarment.id,
                        { [key]: Number(event.target.value) },
                      ))}
                      className="mt-2 w-full accent-[#EA931D]"
                    />
                  </label>
                ))}
              </div>
            )}

            {studio.activeToolId === 'outfit' && activeGarment && (
              <div className="mt-5 space-y-5">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="rounded-lg bg-white/10 px-3 py-2 text-xs" onClick={() => setStudio((state) => toggleStudioGarmentVisibility(state, activeGarment.id))}>Hide/Show</button>
                  <button type="button" className="rounded-lg bg-white/10 px-3 py-2 text-xs" onClick={() => setStudio((state) => duplicateStudioGarment(state, activeGarment.id))}>Duplicate</button>
                  <button type="button" className="col-span-2 rounded-lg bg-red-500/15 px-3 py-2 text-xs text-red-200" onClick={() => setStudio((state) => removeStudioGarment(state, activeGarment.id))}>Remove</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="rounded-lg bg-[#EA931D] px-3 py-2 text-xs font-semibold text-white" onClick={saveGarment}>Save Garment</button>
                  <button type="button" className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black" onClick={saveLook}>Save Look</button>
                </div>
                {savedGarments.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-white/35">Garments</h3>
                    <div className="space-y-2">
                      {savedGarments.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs text-white/70"
                          onClick={() => setStudio((state) => applySavedStudioGarment(state, item))}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {savedLooks.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-white/35">Looks</h3>
                    <div className="space-y-2">
                      {savedLooks.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs text-white/70"
                          onClick={() => setStudio((state) => applySavedStudioLook(state, item, { keepCurrentMannequin: true }))}
                        >
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {studio.activeToolId === 'fabric' && activeGarment && activeDefinition && (
              <div className="mt-5 space-y-5">
                {activeMaterial && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold">Texture Canvas</h3>
                        <p className="text-[11px] text-white/35">Drawn texture updates the 3D fabric.</p>
                      </div>
                      <span className="rounded-md bg-white/10 px-2 py-1 text-[10px] text-white/45">
                        {activeMaterial.maps?.baseColorMap ? 'Mapped' : 'Blank'}
                      </span>
                    </div>
                    <StudioTextureCanvas
                      key={`${activeGarment.id}-${activeMaterialSlotId}`}
                      brushColor={activeMaterial.baseColor ?? '#EA931D'}
                      initialState={activeMaterial.canvasState}
                      onTextureChange={updateActiveTexture}
                    />
                  </div>
                )}
                {activeDefinition.materialSlots.map((slot) => {
                  const material = activeGarment.materials[slot.id] ?? slot;
                  return (
                    <div key={slot.id} className="space-y-3">
                      <h3 className="text-sm font-semibold">{slot.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {COLOR_SWATCHES.map((color) => (
                          <button
                            key={color}
                            type="button"
                            aria-label={color}
                            title={color}
                            onClick={() => setStudio((state) => updateStudioGarmentMaterial(state, activeGarment.id, slot.id, { baseColor: color }))}
                            className="h-8 w-8 rounded-full border border-white/20"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        value={material.baseColor ?? slot.baseColor}
                        onChange={(event) => setStudio((state) => updateStudioGarmentMaterial(state, activeGarment.id, slot.id, { baseColor: event.target.value }))}
                        className="h-10 w-full rounded-lg border border-white/10 bg-white/[0.04]"
                      />
                      <label className="block text-xs text-white/45">
                        Roughness
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={material.roughness ?? slot.roughness}
                          onChange={(event) => setStudio((state) => updateStudioGarmentMaterial(state, activeGarment.id, slot.id, { roughness: Number(event.target.value) }))}
                          className="mt-2 w-full accent-[#EA931D]"
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}

            {studio.activeToolId === 'panel' && activeGarment && activeDefinition && (
              <div className="mt-5 space-y-2">
                {activeDefinition.panels.map((panel) => (
                  <button
                    key={panel.id}
                    type="button"
                    onClick={() => setStudio((state) => selectStudioTarget(state, {
                      type: 'panel',
                      garmentInstanceId: activeGarment.id,
                      panelId: panel.id,
                    }))}
                    className={cn(
                      'w-full rounded-lg border px-3 py-2 text-left text-xs',
                      studio.selection.type === 'panel' && studio.selection.panelId === panel.id
                        ? 'border-[#EA931D]/60 bg-[#EA931D]/10 text-white'
                        : 'border-white/10 bg-white/[0.035] text-white/55',
                    )}
                  >
                    {panel.label}
                  </button>
                ))}
              </div>
            )}

            {studio.activeToolId === 'graphic' && activeGarment && activeDefinition && (
              <div className="mt-5 space-y-5">
                <div className="space-y-2">
                  {activeDefinition.decalZones.map((zone) => (
                    <button
                      key={zone.id}
                      type="button"
                      className="w-full rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-left text-xs text-white/70"
                      onClick={() => setStudio((state) => addStudioDecal(state, activeGarment.id, {
                        image: 'studio-generated-mark',
                        anchor: zoneAnchor(zone),
                        scale: 0.22,
                        rotation: 0,
                        opacity: 0.92,
                      }))}
                    >
                      Add {zone.label}
                    </button>
                  ))}
                </div>
                {activeGarment.decals.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/35">Graphics</h3>
                    {activeGarment.decals.map((decal) => (
                      <div key={decal.id} className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs text-white/55">
                        {decal.anchor.meshId ?? decal.id}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {['select', 'preview', 'export'].includes(studio.activeToolId) && (
              <div className="mt-5 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="rounded-lg bg-[#EA931D] px-3 py-2 text-xs font-semibold text-white" onClick={saveLook}>Save Look</button>
                  <button type="button" className="rounded-lg bg-white/10 px-3 py-2 text-xs text-white" onClick={saveGarment} disabled={!activeGarment}>Save Garment</button>
                </div>
                <div className="space-y-3 rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-white/35">Export</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button type="button" className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black" onClick={exportPng}>PNG</button>
                    <button type="button" className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black" onClick={exportPdf}>PDF</button>
                    <button type="button" className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black" onClick={exportJson}>JSON</button>
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs text-white"
                    onClick={() => importInputRef.current?.click()}
                  >
                    Reopen Moatt JSON
                  </button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept="application/json,.json,.moatt.json"
                    className="hidden"
                    onChange={importJson}
                  />
                  {exportStatus && (
                    <p className={cn(
                      'rounded-md px-2 py-1 text-[11px]',
                      exportStatus.type === 'success'
                        ? 'bg-emerald-500/10 text-emerald-200'
                        : 'bg-red-500/10 text-red-200',
                    )}
                    >
                      {exportStatus.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
