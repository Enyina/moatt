'use client';

import { MannequinViewer } from './three/MannequinViewer';
import { FABRIC_MATERIALS, getFabricMaterial, type FabricMaterial } from '@/lib/fabrics';
import { useState } from 'react';

export function ClothingDemo() {
  const [selectedFabric, setSelectedFabric] = useState<FabricMaterial | undefined>();
  const [clothingType, setClothingType] = useState<'shirt' | 'pants' | 'dress'>('shirt');
  const [clothingTexture, setClothingTexture] = useState<string | undefined>();

  return (
    <div className="w-full h-screen flex bg-black">
      {/* Left Panel - Tools & Fabrics */}
      <div className="w-80 bg-[#1A1A2E] p-4 overflow-y-auto">
        <h2 className="text-white font-bold mb-4">Clothing Demo</h2>
        
        {/* Clothing Type Selection */}
        <div className="mb-6">
          <h3 className="text-[#A0A0B0] text-sm font-medium mb-2">Clothing Type</h3>
          <div className="flex gap-2">
            {(['shirt', 'pants', 'dress'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setClothingType(type)}
                className={`px-3 py-2 rounded text-sm capitalize transition-colors ${
                  clothingType === type
                    ? 'bg-[#EA931D] text-black'
                    : 'bg-[#0F0F1A] text-[#A0A0B0] hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Fabric Selection */}
        <div className="mb-6">
          <h3 className="text-[#A0A0B0] text-sm font-medium mb-2">Fabric Material</h3>
          <div className="space-y-2">
            {FABRIC_MATERIALS.slice(0, 6).map((fabric) => (
              <button
                key={fabric.id}
                onClick={() => setSelectedFabric(fabric)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedFabric?.id === fabric.id
                    ? 'border-[#EA931D] bg-[#EA931D]/10'
                    : 'border-white/20 hover:border-white/40 bg-[#0F0F1A]'
                }`}
              >
                <div className="text-white text-sm font-medium">{fabric.name}</div>
                <div className="text-[#666666] text-xs capitalize">{fabric.category}</div>
                <div className="text-[#888888] text-xs mt-1">
                  Roughness: {fabric.roughness} | Metalness: {fabric.metalness}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Texture */}
        <div className="mb-6">
          <h3 className="text-[#A0A0B0] text-sm font-medium mb-2">Custom Texture</h3>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = URL.createObjectURL(file);
                setClothingTexture(url);
              }
            }}
            className="w-full text-xs text-[#A0A0B0] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-medium file:bg-[#EA931D] file:text-black hover:file:bg-[#D4850F]"
          />
        </div>

        {/* Current Settings */}
        <div className="bg-[#0F0F1A] rounded-lg p-3">
          <h3 className="text-[#A0A0B0] text-sm font-medium mb-2">Current Settings</h3>
          <div className="space-y-1 text-xs">
            <div className="text-white">
              Type: <span className="text-[#EA931D] capitalize">{clothingType}</span>
            </div>
            <div className="text-white">
              Fabric: <span className="text-[#EA931D]">{selectedFabric?.name || 'None'}</span>
            </div>
            <div className="text-white">
              Texture: <span className="text-[#EA931D]">{clothingTexture ? 'Custom' : 'None'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - 3D Viewer */}
      <div className="flex-1 relative">
        <MannequinViewer
          className="absolute inset-0"
          clothingType={clothingType}
          fabricMaterial={selectedFabric}
          clothingTexture={clothingTexture}
        />
        
        {/* Info Overlay */}
        <div className="absolute top-4 right-4 bg-black/80 backdrop-blur p-3 rounded-lg">
          <h3 className="text-white font-bold text-sm mb-1">Multi-Mesh Clothing System</h3>
          <p className="text-[#A0A0B0] text-xs">
            ✓ Separate clothing meshes<br/>
            ✓ Fabric material properties<br/>
            ✓ Texture painting support<br/>
            ✓ Proper UV mapping
          </p>
        </div>
      </div>
    </div>
  );
}
