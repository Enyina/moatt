'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { MannequinViewer } from './three/MannequinViewer';
import { Studio3D } from './three/Studio3D';
import { ToolSidebar } from './design/ToolSidebar';
import { FabricCanvas } from './design/FabricCanvas';
import { FabricGallery } from './design/FabricGallery';
import { LayersPanel } from './design/LayersPanel';
import { PropertyPanel } from './design/PropertyPanel';
import { useEditorStore, useWardrobeStore } from '@/stores';
import { getFabricMaterial, type FabricMaterial } from '@/lib/fabrics';
import type { GarmentType } from '@/lib/types';
import { useGarmentStore } from '@/stores/garmentStore';
import Link from 'next/link';

const USE_NEW_STUDIO = true; // Feature flag for Phase 1 validation


interface StudioEditorProps {
  templateType?: 'shirt' | 'pants' | 'dress';
  initialBodyTypeId?: string;
  initialClothingType?: GarmentType;
  modelUrl?: string;
  designId?: string;
}

const normalizeTemplateType = (templateType: StudioEditorProps['templateType']): GarmentType => {
  if (templateType === 'pants') return 'trouser';
  if (templateType === 'dress') return 'gown';
  return 'shirt';
};

function syncProceduralGarment(type: GarmentType): void {
  useGarmentStore.getState().setActiveGarmentFromDefinition(type);
}

export function DesignEditor({
  templateType = 'shirt',
  initialBodyTypeId = 'female-standard',
  initialClothingType,
  modelUrl: initialModelUrl,
  designId,
}: StudioEditorProps) {
  const [clothingTexture, setClothingTexture] = useState<string | undefined>();
  const [selectedFabric, setSelectedFabric] = useState<FabricMaterial | undefined>();
  const [designName, setDesignName] = useState('Untitled Design');
  const [bodyTypeId, setBodyTypeId] = useState(initialBodyTypeId);
  const [poseId, setPoseId] = useState('standing-default');
  const initializedRouteKey = useRef<string | null>(null);
  
  const { 
    activeFabricId, 
    setActiveFabric,
    layers,
    addLayer,
    renderStage,
    setRenderStage,
    viewMode,
    setViewMode,
    finalTexture,
    selectedBodyType,
    selectedClothingType,
    setBodyType,
    setClothingType,
  } = useEditorStore();

  const { saveDesignFromDataUrl } = useWardrobeStore();

  const handleSave = async () => {
    if (!finalTexture) return;
    
    try {
      await saveDesignFromDataUrl(finalTexture, designName);
      alert('Design saved to your wardrobe successfully!');
      // Optional: Redirect or Reset
      setRenderStage(1);
    } catch (error) {
      alert('Failed to save design. Please try again.');
    }
  };

  // Initialize with a default layer if empty
  useEffect(() => {
    if (layers.length === 0) {
      addLayer({
        name: 'Base Layer',
        type: 'fabric',
        textureUrl: '',
        visible: true,
        opacity: 1
      });
    }
  }, [layers.length, addLayer]);

  useEffect(() => {
    const clothingType = initialClothingType || normalizeTemplateType(templateType);
    const routeKey = `${initialBodyTypeId}:${clothingType}`;

    if (initializedRouteKey.current === routeKey) return;

    setBodyType(initialBodyTypeId);
    setBodyTypeId(initialBodyTypeId);
    setClothingType(clothingType);
    syncProceduralGarment(clothingType);
    initializedRouteKey.current = routeKey;
  }, [initialBodyTypeId, initialClothingType, setBodyType, setClothingType, templateType]);

  useEffect(() => {
    setBodyTypeId(selectedBodyType);
  }, [selectedBodyType]);

  // Sync selected fabric with store
  useEffect(() => {
    if (activeFabricId) {
      const fabric = getFabricMaterial(activeFabricId);
      setSelectedFabric(fabric);
    }
  }, [activeFabricId]);

  const handleFabricSelect = (fabric: FabricMaterial) => {
    setActiveFabric(fabric.id);
    setSelectedFabric(fabric);
  };

  return (
    <div className="h-screen w-full flex overflow-hidden bg-[#0F0F0F] text-white font-sans selection:bg-[#EA931D]/30">

      {/* 1. Left Sidebar: Drawing Tools */}
      <ToolSidebar />

      {/* 2. Center Workspace */}
      <div className={`flex-1 relative flex flex-col ${renderStage === 1 || USE_NEW_STUDIO ? 'z-30' : 'z-10'}`}>
        {USE_NEW_STUDIO ? (
          <Studio3D modelUrl={initialModelUrl} bodyTypeId={bodyTypeId} />
        ) : (
          <>
            <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
              <Link 
                href="/templates" 
                className="w-10 h-10 bg-black/10 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-black/20 transition-colors border border-black/5"
              >
                <svg className="w-5 h-5 text-black/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 0118 0z" />
                </svg>
              </Link>
              <div className="bg-black/10 backdrop-blur-md rounded-xl border border-black/5 px-4 py-2 flex items-center gap-2">
                <span className="text-[10px] font-bold text-black/40 uppercase tracking-widest">Drafting Mode</span>
                <div className="w-1.5 h-1.5 bg-[#EA931D] rounded-full animate-pulse" />
              </div>
            </div>

            <FabricCanvas 
              templateUrl={selectedClothingType} 
            />
          </>
        )}

        {/* Floating Action Bar */}
        {!USE_NEW_STUDIO && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 p-2 flex items-center gap-2 shadow-2xl">
              <button 
                onClick={() => setRenderStage(2)}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${renderStage === 1 ? 'bg-[#EA931D] text-white shadow-[0_0_20px_rgba(234,147,29,0.4)]' : 'bg-white/5 text-white/40 hover:text-white'}`}
              >
                1. RENDER ITEM
              </button>
              <div className="w-px h-6 bg-white/10" />
              <button 
                onClick={() => {
                  setRenderStage(3);
                  setViewMode('full');
                }}
                disabled={renderStage < 2}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${renderStage === 2 ? 'bg-[#EA931D] text-white shadow-[0_0_20px_rgba(234,147,29,0.4)]' : 'bg-white/5 text-white/40'}`}
              >
                2. WEAR ON MODEL
              </button>
              <div className="w-px h-6 bg-white/10" />
              <button 
                onClick={handleSave}
                disabled={renderStage < 3}
                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${renderStage === 3 ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/5 text-white/40'}`}
              >
                3. SAVE TO WARDROBE
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Sidebar: Conditional Legacy Viewer */}
      {!USE_NEW_STUDIO && (
        <div className={`w-[450px] h-full border-l border-white/5 bg-[#0F0F0F] relative ${renderStage > 1 ? 'z-30' : 'z-10'}`}>
          <div className="absolute top-6 left-6 z-40 bg-black/40 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-2">
            <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
              {renderStage === 2 ? 'Isolated Preview' : 'Final Fit'}
            </span>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          </div>

          <MannequinViewer
            className="w-full h-full"
            clothingTexture={finalTexture || ''}
            bodyTypeId={bodyTypeId}
            poseId={poseId}
          />

          {/* Stage Reset Button */}
          <button 
            onClick={() => {
              setRenderStage(1);
              setViewMode('item');
            }}
            className="absolute bottom-10 right-10 z-40 bg-[#1A1A1A] hover:bg-[#222] text-white/40 hover:text-white p-3 rounded-xl border border-white/5 transition-all"
            title="Back to Drafting"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5L6 10l5 5M6 10h11a4 4 0 014 4v1" />
            </svg>
          </button>
        </div>
      )}


      {/* 4. Far Right: Controls Panel */}
      <div className="flex h-full border-l border-white/5">
        {USE_NEW_STUDIO ? (
          <PropertyPanel />
        ) : (
          <>
            <LayersPanel />
            <FabricGallery 
              onSelect={handleFabricSelect}
              selectedFabric={selectedFabric}
            />
          </>
        )}
      </div>
    </div>
  );
}
