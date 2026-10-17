'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useEditorStore } from '@/stores';
import { DecalInstance, GarmentType, MeasurementKey, MeshMeta, MeshRegion } from '@/lib/types';
import { GARMENT_DEFINITIONS } from '@/lib/constants/products';
import { FABRIC_PRESETS, FABRIC_PRESET_LIST } from '@/lib/constants/fabricPresets';
import { LIGHTING_PRESETS, LIGHTING_PRESET_LIST } from '@/lib/constants/lightingPresets';
import { GarmentControlsPanel } from './GarmentControlsPanel';
import { useGarmentStore } from '@/stores/garmentStore';

type ClassNameValue = string | false | null | undefined;

function cn(...inputs: ClassNameValue[]): string {
  return inputs.filter(Boolean).join(' ');
}

function formatSchemaLabel(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const POSITION_AXES: { label: 'X' | 'Y' | 'Z'; index: 0 | 1 | 2 }[] = [
  { label: 'X', index: 0 },
  { label: 'Y', index: 1 },
  { label: 'Z', index: 2 },
];

const GARMENT_TYPES = Object.keys(GARMENT_DEFINITIONS) as GarmentType[];
const MEASUREMENT_LIMITS: Record<MeasurementKey, { max: number; min: number; step: number; unit: string }> = {
  bust: { min: 20, max: 80, step: 0.5, unit: 'in' },
  chest: { min: 20, max: 80, step: 0.5, unit: 'in' },
  hip: { min: 20, max: 90, step: 0.5, unit: 'in' },
  inseam: { min: 10, max: 50, step: 0.5, unit: 'in' },
  length: { min: 10, max: 80, step: 0.5, unit: 'in' },
  neck: { min: 8, max: 24, step: 0.25, unit: 'in' },
  shoulder: { min: 8, max: 30, step: 0.5, unit: 'in' },
  sleeve: { min: 0, max: 40, step: 0.5, unit: 'in' },
  thigh: { min: 10, max: 40, step: 0.5, unit: 'in' },
  waist: { min: 18, max: 80, step: 0.5, unit: 'in' },
};

/**
 * PROPERTY PANEL
 * A schema-driven UI renderer that groups garment parts by region.
 * No hardcoding—directly projects the ProductState metadata.
 */
export function PropertyPanel() {
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [persistenceMessage, setPersistenceMessage] = useState<string | null>(null);
  const { 
    product, 
    selection, 
    selectTarget, 
    updateMaterial, 
    updateDecalInstance, 
    removeDecalInstance,
    setDecal,
    activeDecalUrl,
    selectedClothingType,
    selectedGarmentDefinition,
    selectedStyleOptions,
    measurementValues,
    exportDesignDocument,
    importDesignDocument,
    setPreviewThumbnail,
    setClothingType,
    setMeasurementValue,
    setStyleOption,
    activeLightingPresetId,
    setActiveLightingPresetId,
  } = useEditorStore();

  const activeGarment = useGarmentStore((state) => state.activeGarment);
  const garmentInstances = useGarmentStore((state) => state.garmentInstances);
  const activeGarmentInstanceId = useGarmentStore((state) => state.activeGarmentInstanceId);
  const setActiveGarmentInstance = useGarmentStore((state) => state.setActiveGarmentInstance);
  const setActiveGarmentFromDefinition = useGarmentStore((state) => state.setActiveGarmentFromDefinition);

  const [activeTab, setActiveTab] = useState<'garment' | 'material' | 'layers' | 'studio'>('garment');

  // 1. Group Meshes by Region (Auto-Generated from Schema)
  const groupedMeshes = useMemo(() => {
    const groups: Partial<Record<MeshRegion, { id: string; meta: MeshMeta }[]>> = {};
    
    Object.entries(product.meshes).forEach(([id, data]) => {
      const region = data.meta.region;
      const group = groups[region] ?? [];
      group.push({ id, meta: data.meta });
      groups[region] = group;
    });
    
    return groups;
  }, [product.meshes]);

  const handleMeshClick = (meshId: string) => {
    selectTarget({ type: 'mesh', targetId: meshId });
  };

  const handleColorChange = (slotId: string, color: string) => {
    updateMaterial(slotId, { baseColor: color });
  };

  const handleFabricPresetChange = (slotId: string, presetId: string) => {
    const preset = FABRIC_PRESETS[presetId];
    if (!preset) return;
    
    const currentMaterial = product.materials[slotId];
    if (!currentMaterial) return;

    updateMaterial(slotId, {
      fabricPresetId: preset.id,
      roughness: preset.roughness,
      metalness: preset.metalness,
      normalScale: preset.normalScale,
      textureRepeat: preset.textureRepeat,
      baseColor: currentMaterial.baseColor ?? preset.baseColor,
      maps: {
        ...currentMaterial.maps,
        normalMap: preset.normalMapUrl,
        roughnessMap: preset.roughnessMapUrl,
        baseColorMap: currentMaterial.maps?.baseColorMap,
      }
    });
  };

  const handleDecalPositionChange = (
    decal: DecalInstance,
    axisIndex: 0 | 1 | 2,
    value: number
  ) => {
    const nextPosition: [number, number, number] = [...decal.anchor.position];
    nextPosition[axisIndex] = value;

    updateDecalInstance(decal.id, {
      anchor: {
        ...decal.anchor,
        position: nextPosition,
      },
    });
  };

  const capturePreviewImage = (): string | null => {
    const canvas = document.querySelector('canvas');

    if (!(canvas instanceof HTMLCanvasElement)) {
      setPersistenceMessage('Preview canvas was not available.');
      return null;
    }

    try {
      const previewImage = canvas.toDataURL('image/png');
      setPreviewThumbnail(previewImage);
      setPersistenceMessage('Preview captured.');
      return previewImage;
    } catch {
      setPersistenceMessage('Preview capture failed.');
      return null;
    }
  };

  const handleExportDesign = () => {
    const previewImage = capturePreviewImage();
    const project = exportDesignDocument(selectedGarmentDefinition.label, previewImage);
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = `${selectedClothingType}-project.moatt.json`;
    link.click();
    URL.revokeObjectURL(objectUrl);
    setPersistenceMessage('Design exported.');
  };

  const handleImportDesign = async (file: File | undefined) => {
    if (!file) return;

    try {
      const fileText = await file.text();
      const designDocument: unknown = JSON.parse(fileText);
      const result = importDesignDocument(designDocument);

      setPersistenceMessage(result.ok
        ? result.warnings[0] ?? 'Design imported.'
        : result.warnings[0] ?? 'Design import failed.');
    } catch {
      setPersistenceMessage('Design file could not be read.');
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex h-full w-[360px] flex-col overflow-y-auto border-l border-white/10 bg-[var(--background)]/92 shadow-[-12px_0_36px_rgba(0,0,0,0.18)] backdrop-blur-xl">
      {/* TABS HEADER */}
      <div className="flex border-b border-white/10 shrink-0">
        <button 
          onClick={() => setActiveTab('garment')}
          className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors", activeTab === 'garment' ? "text-[#EA931D] border-b-2 border-[#EA931D] bg-[#EA931D]/5" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
        >
          Garment
        </button>
        <button 
          onClick={() => setActiveTab('material')}
          className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors", activeTab === 'material' ? "text-[#EA931D] border-b-2 border-[#EA931D] bg-[#EA931D]/5" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
        >
          Material
        </button>
        <button 
          onClick={() => setActiveTab('layers')}
          className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors", activeTab === 'layers' ? "text-[#EA931D] border-b-2 border-[#EA931D] bg-[#EA931D]/5" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
        >
          Layers
        </button>
        <button 
          onClick={() => setActiveTab('studio')}
          className={cn("flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors", activeTab === 'studio' ? "text-[#EA931D] border-b-2 border-[#EA931D] bg-[#EA931D]/5" : "text-white/40 hover:text-white/80 hover:bg-white/5")}
        >
          Studio
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'garment' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#EA931D]/75">
                  Atelier Setup
                </p>
            <h2 className="mt-1 text-lg font-black leading-tight text-white">
              {selectedGarmentDefinition.label}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-white/35">
              Configure measurements, finish, graphics, and garment panels.
            </p>
          </div>
          <button 
            onClick={() => setDecal(activeDecalUrl ? null : '/decals/logo_placeholder.png')}
            className={cn(
              "w-full rounded-lg border px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all",
              activeDecalUrl 
                ? "border-[#EA931D] bg-[#EA931D] text-white shadow-lg shadow-[#EA931D]/20" 
                : "border-white/10 bg-white/[0.045] text-white/60 hover:border-white/20 hover:text-white"
            )}
          >
            {activeDecalUrl ? 'STAMPING...' : 'ADD GRAPHIC'}
          </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleExportDesign}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white/50 transition-colors hover:border-white/20 hover:text-white"
              >
                Export
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white/50 transition-colors hover:border-white/20 hover:text-white"
              >
                Import
              </button>
              <button
                type="button"
                onClick={capturePreviewImage}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-white/50 transition-colors hover:border-white/20 hover:text-white"
              >
                Capture
              </button>
              <input
                ref={importInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  void handleImportDesign(event.target.files?.[0]);
                }}
              />
            </div>
            {persistenceMessage && (
              <p className="rounded-lg border border-[#EA931D]/20 bg-[#EA931D]/10 px-3 py-2 text-[10px] leading-relaxed text-white/50">
                {persistenceMessage}
              </p>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                  Outfit Stack
                </label>
                <span className="text-[10px] text-white/25">
                  {garmentInstances.length} item{garmentInstances.length === 1 ? '' : 's'}
                </span>
              </div>
              <div className="space-y-1.5">
                {garmentInstances.map((garment) => (
                  <button
                    key={garment.id}
                    type="button"
                    onClick={() => {
                      setClothingType(garment.type);
                      setActiveGarmentInstance(garment.id);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors',
                      activeGarmentInstanceId === garment.id
                        ? 'border-[#EA931D]/60 bg-[#EA931D]/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white'
                    )}
                  >
                    <span className="font-semibold">{garment.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-white/30">{garment.type}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                Garment Type
              </label>
              <select
                value={selectedClothingType}
                onChange={(event) => {
                  const type = event.target.value as GarmentType;
                  setClothingType(type);
                  setActiveGarmentFromDefinition(type);
                }}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-white outline-none transition-colors focus:border-[#EA931D]"
              >
                {GARMENT_TYPES.map((type) => (
                  <option
                    key={type}
                    value={type}
                    disabled={GARMENT_DEFINITIONS[type].status !== 'available'}
                    className="bg-[#111] text-white"
                  >
                    {GARMENT_DEFINITIONS[type].label}
                    {GARMENT_DEFINITIONS[type].status === 'coming_soon' ? ' (Coming Soon)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {activeGarment ? (
              <>
                <GarmentControlsPanel />
                {Object.entries(selectedGarmentDefinition.styleOptions).length > 0 && (
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                        Style
                      </h3>
                      <p className="mt-1 text-[11px] leading-relaxed text-white/25">
                        Choose the tailoring details for this garment.
                      </p>
                    </div>
                    {Object.entries(selectedGarmentDefinition.styleOptions).map(([optionName, values]) => (
                      <div key={optionName} className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                          {formatSchemaLabel(optionName)}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {values?.map((value: string) => {
                            const isImplemented =
                              optionName !== 'closure' ||
                              ['buttons', 'back zip', 'side zip', 'zip fly', 'pullover'].includes(value);

                            return (
                              <button
                                key={value}
                                type="button"
                                disabled={!isImplemented}
                                onClick={() => setStyleOption(optionName, value)}
                                className={cn(
                                  "rounded-md border px-2.5 py-1.5 text-[10px] font-semibold capitalize transition-all",
                                  selectedStyleOptions[optionName] === value
                                    ? "border-[#EA931D]/70 bg-[#EA931D]/10 text-[#F1B35A]"
                                    : isImplemented
                                      ? "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white"
                                      : "border-white/5 bg-transparent text-white/20 cursor-not-allowed"
                                )}
                              >
                                {value}
                                {!isImplemented && <span className="ml-1 text-[8px] opacity-50">(Soon)</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                    Measurements
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/25">
                    Tailor inputs drive proportional preview only.
                  </p>
                </div>
                <span className="text-[10px] text-white/25">
                  inches
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedGarmentDefinition.requiredMeasurements.map((measurement) => (
                  <div key={measurement} className="rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2.5 transition-colors focus-within:border-[#EA931D]/50 focus-within:bg-white/[0.055]">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-white/35">
                      {formatSchemaLabel(measurement)}
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        min={MEASUREMENT_LIMITS[measurement].min}
                        max={MEASUREMENT_LIMITS[measurement].max}
                        step={MEASUREMENT_LIMITS[measurement].step}
                        value={measurementValues[measurement] ?? ''}
                        onChange={(event) => {
                          const nextValue = event.target.value === ''
                            ? null
                            : Number(event.target.value);
                          setMeasurementValue(
                            measurement,
                            Number.isFinite(nextValue) ? nextValue : null
                          );
                        }}
                        className="moatt-number-input w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/15"
                        placeholder="Required"
                      />
                      <span className="text-[10px] text-white/30">
                        {MEASUREMENT_LIMITS[measurement].unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {Object.entries(selectedGarmentDefinition.styleOptions).length > 0 && (
              <div className="space-y-3">
                <div>
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                    Style
                  </h3>
                  <p className="mt-1 text-[11px] leading-relaxed text-white/25">
                    Choose the tailoring details for this garment.
                  </p>
                </div>
                {Object.entries(selectedGarmentDefinition.styleOptions).map(([optionName, values]) => (
                  <div key={optionName} className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      {formatSchemaLabel(optionName)}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {values?.map((value: string) => {
                        const isImplemented = 
                          optionName !== 'closure' || 
                          ['buttons', 'back zip', 'side zip', 'zip fly', 'pullover'].includes(value);

                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={!isImplemented}
                            onClick={() => setStyleOption(optionName, value)}
                            className={cn(
                              "rounded-md border px-2.5 py-1.5 text-[10px] font-semibold capitalize transition-all",
                              selectedStyleOptions[optionName] === value
                                ? "border-[#EA931D]/70 bg-[#EA931D]/10 text-[#F1B35A]"
                                : isImplemented 
                                  ? "border-white/10 bg-white/[0.03] text-white/50 hover:border-white/20 hover:text-white"
                                  : "border-white/5 bg-transparent text-white/20 cursor-not-allowed"
                            )}
                          >
                            {value}
                            {!isImplemented && <span className="ml-1 text-[8px] opacity-50">(Soon)</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
              </>
            )}
            </div>
          </div>
        )}

        {activeTab === 'material' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* DECAL EDITOR (Shows when a decal is selected) */}
            {selection.type === 'decal' && (
            <div className="p-4 rounded-2xl bg-[#EA931D]/5 border border-[#EA931D]/20 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-[#EA931D] uppercase tracking-wider">
                  Graphic Properties
                </h3>
                <button 
                  onClick={() => removeDecalInstance(selection.targetId)}
                  className="text-white/20 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              {(() => {
                const decal = product.decals.find(d => d.id === selection.targetId);
                if (!decal) return null;

                return (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-white/40">Scale</label>
                        <span className="text-[10px] text-white/80">{decal.scale.toFixed(2)}x</span>
                      </div>
                      <input 
                        type="range" min="0.05" max="1.5" step="0.01" value={decal.scale}
                        onChange={(e) => updateDecalInstance(decal.id, { scale: parseFloat(e.target.value) })}
                        className="w-full accent-[#EA931D]"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-white/40">Rotation</label>
                        <span className="text-[10px] text-white/80">{Math.round(decal.rotation * (180/Math.PI))}°</span>
                      </div>
                      <input 
                        type="range" min={-Math.PI} max={Math.PI} step={0.01} value={decal.rotation}
                        onChange={(e) => updateDecalInstance(decal.id, { rotation: parseFloat(e.target.value) })}
                        className="w-full accent-[#EA931D]"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-white/40">Position</label>
                        <span className="text-[10px] text-white/80">Mesh Local</span>
                      </div>
                      {POSITION_AXES.map((axis) => (
                        <div key={axis.label} className="grid grid-cols-[1rem_1fr_3.5rem] items-center gap-2">
                          <span className="text-[10px] font-bold text-white/30">{axis.label}</span>
                          <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.001"
                            value={decal.anchor.position[axis.index]}
                            onChange={(e) => handleDecalPositionChange(
                              decal,
                              axis.index,
                              parseFloat(e.target.value)
                            )}
                            className="w-full accent-[#EA931D]"
                          />
                          <span className="text-right text-[10px] tabular-nums text-white/60">
                            {decal.anchor.position[axis.index].toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold uppercase text-white/40">Opacity</label>
                        <span className="text-[10px] text-white/80">{Math.round(decal.opacity * 100)}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="1" step="0.01" value={decal.opacity}
                        onChange={(e) => updateDecalInstance(decal.id, { opacity: parseFloat(e.target.value) })}
                        className="w-full accent-[#EA931D]"
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* MESH STRUCTURE */}
          {selection.type !== 'decal' && Object.entries(groupedMeshes).map(([region, meshes]) => (
            <div key={region} className="space-y-4">
              <h3 className="px-1 text-[10px] font-bold uppercase tracking-widest text-white/35">
                {region}
              </h3>
              
              <div className="space-y-2">
                {meshes.map(({ id, meta }) => {
                  const isSelected = selection.type === 'mesh' && selection.targetId === id;
                  const materialSlotId = product.meshes[id].materialSlotId;
                  const material = product.materials[materialSlotId];

                  return (
                    <div
                      key={id}
                      onClick={() => handleMeshClick(id)}
                      className={cn(
                        "group relative flex cursor-pointer flex-col rounded-xl border p-3 transition-all duration-300",
                        isSelected 
                          ? "border-[#EA931D]/50 bg-[#EA931D]/10 shadow-lg shadow-black/20" 
                          : "border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.05]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={cn(
                          "text-sm font-medium transition-colors",
                          isSelected ? "text-white" : "text-white/60 group-hover:text-white/80"
                        )}>
                          {meta.label}
                        </span>
                        
                        {/* Material Preview Dot */}
                        <div 
                          className="h-4 w-4 rounded-md border border-white/15 shadow-inner" 
                          style={{ backgroundColor: material?.baseColor || '#fff' }}
                        />
                      </div>

                      {/* Contextual Controls (Only show when selected) */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-white/40">Color</label>
                            <div className="flex flex-wrap gap-2">
                              {['#ffffff', '#1A1A1A', '#EA931D', '#3B82F6', '#EF4444', '#10B981'].map((c) => (
                                <button
                                  key={c}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleColorChange(materialSlotId, c);
                                  }}
                                  className={cn(
                                    "h-7 w-7 rounded-md border border-white/15 transition-transform active:scale-90",
                                    material.baseColor === c && "ring-2 ring-[#EA931D] ring-offset-2 ring-offset-black"
                                  )}
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-white/40 uppercase font-bold">Fabric Preset</span>
                            </div>
                            <select
                              value={material.fabricPresetId || ''}
                              onChange={(e) => handleFabricPresetChange(materialSlotId, e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-xs font-medium text-white outline-none focus:border-[#EA931D] transition-colors"
                            >
                              <option value="" disabled>Select Fabric...</option>
                              {FABRIC_PRESET_LIST.map((preset) => (
                                <option key={preset.id} value={preset.id}>{preset.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {selection.type === 'none' && Object.keys(groupedMeshes).length === 0 && (
            <div className="p-8 text-center border-t border-white/5">
              <p className="text-xs text-white/30 leading-relaxed italic">
                No meshes found for this garment.
              </p>
            </div>
          )}
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {selectedGarmentDefinition.decalZones.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35">
                  Decal Zones
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedGarmentDefinition.decalZones.map((decalZone) => (
                    <span
                      key={decalZone.id}
                      className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/50"
                    >
                      {decalZone.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                Placed Graphics ({product.decals.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.decals.map((decal) => (
                  <div 
                    key={decal.id}
                    onClick={() => selectTarget({ type: 'decal', targetId: decal.id })}
                    className={cn(
                      "w-12 h-12 rounded-lg border flex items-center justify-center p-2 transition-all cursor-pointer",
                      selection.type === 'decal' && selection.targetId === decal.id
                        ? "bg-white/10 border-[#EA931D] shadow-lg shadow-[#EA931D]/10"
                        : "bg-white/5 border-white/10 hover:border-white/20"
                    )}
                  >
                    <img src={decal.image} className="max-w-full max-h-full object-contain opacity-60" alt="" />
                  </div>
                ))}
                {product.decals.length === 0 && (
                  <div className="w-full py-4 text-center">
                    <span className="text-[10px] text-white/10 italic">No graphics added yet</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'studio' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="mb-6 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#EA931D]/75">
                  Environment
                </p>
                <h2 className="mt-1 text-lg font-black leading-tight text-white">
                  Studio Lighting
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-white/35">
                  Select High Dynamic Range environments to view realistic fabric response and reflections.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50">
                Lighting Preset
              </label>
              <div className="grid gap-2">
                {LIGHTING_PRESET_LIST.map((preset) => {
                  const isSelected = activeLightingPresetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setActiveLightingPresetId(preset.id)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-all",
                        isSelected
                          ? "border-[#EA931D]/50 bg-[#EA931D]/10"
                          : "border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-[#EA931D]" />}
                        <span className={cn("text-xs font-bold", isSelected ? "text-[#EA931D]" : "text-white/80")}>
                          {preset.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-white/40">{preset.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
