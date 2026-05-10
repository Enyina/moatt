'use client';

import { useState } from 'react';
import { FABRIC_MATERIALS, FabricMaterial } from '@/lib/fabrics';
import { useEditorStore } from '@/stores';

interface FabricGalleryProps {
  onSelect: (fabric: FabricMaterial) => void;
  selectedFabric?: FabricMaterial;
}

export function FabricGallery({ onSelect, selectedFabric }: FabricGalleryProps) {
  const [search, setSearch] = useState('');
  const { brushConfig, setBrushConfig } = useEditorStore();

  const filteredFabrics = FABRIC_MATERIALS.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-80 bg-[#111111]/95 backdrop-blur-lg border-l border-white/5 flex flex-col h-full overflow-hidden z-40">
      {/* User Profile Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-2 bg-[#222222] rounded-full px-3 py-1.5 cursor-pointer hover:bg-[#333333]">
          <div className="w-6 h-6 rounded-full bg-[#EA931D] flex items-center justify-center text-[10px] font-bold">JD</div>
          <svg className="w-3 h-3 text-[#888]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <button className="bg-[#EA931D] text-black px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-[#D4850F] transition-colors">
          Share Project
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {/* Fill Section */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Fill</h3>
            <button className="text-[#888] hover:text-white">+</button>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <input 
                type="color" 
                value={brushConfig.color}
                onChange={(e) => setBrushConfig({ color: e.target.value })}
                className="w-10 h-10 rounded-lg bg-transparent cursor-pointer border border-white/10"
              />
              <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/20 group-hover:border-white/40 transition-colors" />
            </div>
            <div className="bg-[#222222] rounded-lg px-3 py-2 flex-1 flex items-center justify-between">
              <span className="text-xs text-white font-mono uppercase">{brushConfig.color}</span>
            </div>
          </div>

          <div className="mt-4">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] text-[#888] uppercase tracking-wider">Brush Size</span>
               <span className="text-xs text-white">{brushConfig.size}px</span>
             </div>
             <input 
               type="range" 
               min="1" 
               max="100" 
               value={brushConfig.size}
               onChange={(e) => setBrushConfig({ size: parseInt(e.target.value) })}
               className="w-full accent-[#EA931D] h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
             />
          </div>

          <div className="mt-4">
             <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] text-[#888] uppercase tracking-wider">Opacity</span>
               <span className="text-xs text-white">{brushConfig.opacity}%</span>
             </div>
             <input 
               type="range" 
               min="1" 
               max="100" 
               value={brushConfig.opacity}
               onChange={(e) => setBrushConfig({ opacity: parseInt(e.target.value) })}
               className="w-full accent-[#EA931D] h-1 bg-[#222] rounded-lg appearance-none cursor-pointer"
             />
          </div>
        </div>

        {/* Border Section */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-white">Border</h3>
            <button className="text-[#888] hover:text-white">+</button>
          </div>
        </div>

        {/* Texture Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">Choose A Texture</h3>
            <button className="text-[#EA931D] text-xs font-medium hover:underline">Browse</button>
          </div>

          <div className="relative mb-6">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search Texture Type"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#1A1A1A] border border-white/5 rounded-lg py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#555] outline-none focus:border-white/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredFabrics.map((fabric) => (
              <button
                key={fabric.id}
                onClick={() => onSelect(fabric)}
                className={`relative group rounded-xl overflow-hidden aspect-[16/9] border-2 transition-all ${
                  selectedFabric?.id === fabric.id ? 'border-[#EA931D]' : 'border-transparent'
                }`}
              >
                {/* Fallback image if texture not loaded */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#222] to-[#111]" />
                {fabric.baseTexture && (
                   <img 
                    src={fabric.baseTexture} 
                    alt={fabric.name} 
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                )}
                {/* Visual texture using CSS for now if no image */}
                {!fabric.baseTexture && (
                  <div className={`absolute inset-0 opacity-20 ${
                    fabric.category === 'denim' ? 'bg-[url("https://www.transparenttextures.com/patterns/denim.png")]' :
                    fabric.category === 'cotton' ? 'bg-[url("https://www.transparenttextures.com/patterns/white-linen.png")]' :
                    'bg-[url("https://www.transparenttextures.com/patterns/silk.png")]'
                  }`} />
                )}
                
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-white text-xs font-bold">{fabric.name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
