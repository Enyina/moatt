'use client';

import { useState, useEffect } from 'react';
import { useAvatarStore } from '@/store/useAvatarStore';
import { Template3DPreview } from '@/components/Template3DPreview';
import { MannequinModel, MannequinCategory } from '@/lib/types';
import { getAllBodyTypes } from '@/lib/models';

const categories: { value: MannequinCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'children', label: 'Children' },
  { value: 'unisex', label: 'Unisex' }
];

export function MannequinLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<MannequinCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    currentAvatar,
    availableMannequins,
    setAvatar,
    loadAvailableMannequins
  } = useAvatarStore();

  // Load available mannequins on mount
  useEffect(() => {
    loadAvailableMannequins();
  }, [loadAvailableMannequins]);

  // Filter mannequins based on category and search
  const filteredMannequins = availableMannequins.filter(mannequin => {
    const matchesCategory = selectedCategory === 'all' || mannequin.category === selectedCategory;
    const matchesSearch = mannequin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (mannequin.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchesCategory && matchesSearch;
  });

  // Get body types as fallback if no mannequins are loaded
  const fallbackMannequins = getAllBodyTypes().map(bodyType => ({
    id: bodyType.id,
    name: bodyType.name,
    category: bodyType.category,
    modelUrl: bodyType.modelPath,
    thumbnailUrl: `/models/makehuman/${bodyType.id}-thumb.jpg`,
    bodyType: bodyType.id,
    gender: bodyType.category === 'women' ? 'female' as const : 
              bodyType.category === 'men' ? 'male' as const : 'unisex' as const,
    ageGroup: bodyType.category === 'children' ? 'child' as const : 'adult' as const,
    description: bodyType.description
  }));

  const displayMannequins = availableMannequins.length > 0 ? filteredMannequins : fallbackMannequins.filter(mannequin => {
    const matchesCategory = selectedCategory === 'all' || mannequin.category === selectedCategory;
    const matchesSearch = mannequin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (mannequin.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    return matchesCategory && matchesSearch;
  });

  const handleSelectMannequin = (mannequin: MannequinModel) => {
    setAvatar({
      modelUrl: mannequin.modelUrl,
      bodyTypeId: mannequin.bodyType
    });
  };

  const isSelected = (mannequin: MannequinModel) => {
    return currentAvatar.modelUrl === mannequin.modelUrl || 
           currentAvatar.bodyTypeId === mannequin.bodyType;
  };

  return (
    <div className="bg-[#171717] rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Choose Mannequin</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search mannequins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0E0E0E] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-4 pl-10 text-white placeholder-[#4C4B4B] focus:outline-none focus:border-[#EA931D] text-sm"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4C4B4B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                selectedCategory === cat.value
                  ? 'bg-[#EA931D] text-black'
                  : 'bg-[#0E0E0E] text-[#CCCCCC] hover:text-white border border-[rgba(255,255,255,0.1)]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mannequin Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {displayMannequins.map((mannequin) => (
            <button
              key={mannequin.id}
              onClick={() => handleSelectMannequin(mannequin)}
              className={`relative bg-[#0E0E0E] rounded-xl p-3 hover:bg-[#1a1a1a] transition-all text-left group ${
                isSelected(mannequin) ? 'ring-2 ring-[#EA931D]' : ''
              }`}
            >
              {/* Selected indicator */}
              {isSelected(mannequin) && (
                <div className="absolute top-2 right-2 bg-[#EA931D] text-black rounded-full p-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* 3D Preview */}
              <div className="aspect-square bg-[#000] rounded-lg mb-3 overflow-hidden">
                <Template3DPreview
                  category={mannequin.category}
                  bodyTypeId={mannequin.bodyType}
                  className="w-full h-full"
                />
              </div>

              {/* Info */}
              <div className="space-y-1">
                <h3 className="text-white font-medium text-sm">{mannequin.name}</h3>
                <p className="text-[#4C4B4B] text-xs capitalize">{mannequin.category}</p>
                {mannequin.description && (
                  <p className="text-[#666] text-xs line-clamp-2">{mannequin.description}</p>
                )}
                
                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-xs px-2 py-0.5 bg-[rgba(234,147,29,0.2)] text-[#EA931D] rounded">
                    {mannequin.gender}
                  </span>
                  <span className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.1)] text-[#CCCCCC] rounded">
                    {mannequin.ageGroup}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {displayMannequins.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#CCCCCC] text-sm">No mannequins found</p>
            <p className="text-[#4C4B4B] text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Current Selection Info */}
      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Current Selection</p>
            <p className="text-[#4C4B4B] text-xs">
              {availableMannequins.find(m => m.bodyType === currentAvatar.bodyTypeId)?.name || 
               fallbackMannequins.find(m => m.bodyType === currentAvatar.bodyTypeId)?.name || 
               'Default Mannequin'}
            </p>
          </div>
          <button
            onClick={() => setAvatar({ modelUrl: '', bodyTypeId: 'female-standard' })}
            className="text-xs text-[#EA931D] hover:text-[#EA931D]/80 transition-colors"
          >
            Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
}
