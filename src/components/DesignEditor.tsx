'use client';

import { useState, useCallback, useEffect, useRef, Suspense } from 'react';
import { MannequinViewer } from './three/MannequinViewer';
import { ToolSidebar } from './design/ToolSidebar';
import { FabricGallery } from './design/FabricGallery';
import { LayersPanel } from './design/LayersPanel';
import { useEditorStore } from '@/stores';
import { getFabricMaterial, type FabricMaterial } from '@/lib/fabrics';
import Link from 'next/link';

interface StudioEditorProps {
  templateType?: 'shirt' | 'pants' | 'dress';
  modelUrl?: string;
  designId?: string;
}

export function DesignEditor({
  templateType = 'shirt',
  modelUrl: initialModelUrl,
  designId,
}: StudioEditorProps) {
  const [clothingTexture, setClothingTexture] = useState<string | undefined>();
  const [selectedFabric, setSelectedFabric] = useState<FabricMaterial | undefined>();
  const [designName, setDesignName] = useState('Untitled Design');
  const [bodyTypeId, setBodyTypeId] = useState('female-standard');
  const [poseId, setPoseId] = useState('standing-default');
  
  const { 
    activeFabricId, 
    setActiveFabric,
    layers,
    addLayer,
  } = useEditorStore();

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

      {/* 2. Center: 3D Viewport */}
      <div className="flex-1 relative bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] flex flex-col items-center justify-center">
        
        {/* Floating Top Controls */}
        <div className="absolute top-6 left-6 flex items-center gap-2 z-50">
          <Link 
            href="/templates" 
            className="w-10 h-10 bg-[#222222]/80 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-[#333333] transition-colors border border-white/5"
            title="Back to Templates"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 0118 0z" />
            </svg>
          </Link>
          <button 
            onClick={() => {
              if (!clothingTexture) {
                alert('Please draw something on the shirt before exporting!');
                return;
              }
              const link = document.createElement('a');
              link.download = `moatt-design-${Date.now()}.png`;
              link.href = activeTexture;
              link.click();
            }}
            className="w-10 h-10 bg-[#222222]/80 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-[#333333] transition-colors border border-white/5"
            title="Export Design"
          >
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>

        {/* Center Top Body/Pose Selectors */}
        <div className="absolute top-6 flex items-center gap-3 z-40">
           <div className="bg-[#1A1A1A]/80 backdrop-blur-md rounded-xl border border-white/5 px-4 py-2 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-[#888] uppercase tracking-widest font-bold">Mannequin</span>
                <select 
                  className="bg-transparent text-xs text-white outline-none cursor-pointer hover:text-[#EA931D] transition-colors"
                  value={bodyTypeId}
                  onChange={(e) => setBodyTypeId(e.target.value)}
                >
                  <option value="female-standard">Female Standard</option>
                  <option value="male-standard">Male Standard</option>
                  <option value="child-toddler">Child Toddler</option>
                  <option value="child-teen">Teenager</option>
                </select>
              </div>
              <div className="w-px h-8 bg-white/5" />
              <div className="flex flex-col">
                <span className="text-[10px] text-[#888] uppercase tracking-widest font-bold">Pose</span>
                <select 
                  className="bg-transparent text-xs text-white outline-none cursor-pointer hover:text-[#EA931D] transition-colors"
                  value={poseId}
                  onChange={(e) => setPoseId(e.target.value)}
                >
                  <option value="standing-default">Standing Default</option>
                  <option value="t-pose">T-Pose</option>
                  <option value="pose-a">Fashion Pose A</option>
                </select>
              </div>
           </div>
        </div>

        {/* 3D Mannequin Viewport */}
        <div className="w-full h-full relative">
          <MannequinViewer
            className="w-full h-full"
            clothingTexture={layers.find(l => l.visible)?.textureUrl || ''}
            clothingType={templateType as any}
            fabricMaterial={selectedFabric}
            bodyTypeId={bodyTypeId}
            poseId={poseId}
          />
          
          {/* Rotation Guide Ring - Visual Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[450px] h-[450px] border border-white/5 rounded-full relative">
               <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                 <svg width="24" height="12" viewBox="0 0 24 12" fill="none" className="text-white/20">
                    <path d="M12 0L24 12H0L12 0Z" fill="currentColor"/>
                 </svg>
               </div>
            </div>
          </div>
        </div>

        {/* Center Bottom Indicator */}
        <div className="absolute bottom-8 flex flex-col items-center gap-2">
           <div className="flex items-center gap-4 bg-[#1A1A1A]/50 backdrop-blur-sm px-6 py-2 rounded-full border border-white/5">
              <span className="text-xs font-bold text-[#EA931D] tracking-widest uppercase">Perspective Mode</span>
              <div className="w-1 h-1 bg-[#EA931D] rounded-full" />
              <span className="text-xs font-medium text-white/50">{designName}</span>
           </div>
           {/* Animated Arrows */}
           <div className="flex gap-12 text-white/10">
              <svg width="40" height="12" viewBox="0 0 40 12" fill="currentColor">
                <path d="M0 6L10 0V12L0 6Z" />
                <rect x="10" y="5" width="30" height="2" />
              </svg>
              <svg width="40" height="12" viewBox="0 0 40 12" fill="currentColor" className="rotate-180">
                <path d="M0 6L10 0V12L0 6Z" />
                <rect x="10" y="5" width="30" height="2" />
              </svg>
           </div>
        </div>
      </div>

      {/* 3. Right Sidebars: Layers & Fabrics */}
      <div className="flex h-full border-l border-white/5">
        <LayersPanel />
        <FabricGallery 
          onSelect={handleFabricSelect}
          selectedFabric={selectedFabric}
        />
      </div>
    </div>
  );
}
