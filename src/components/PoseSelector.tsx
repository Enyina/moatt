'use client';

import { useState, useEffect } from 'react';
import { useAvatarStore } from '@/store/useAvatarStore';
import { Pose, PoseCategory } from '@/lib/types';
import { getAllPoses, getPosesByCategory } from '@/lib/poses';

const categories: { value: PoseCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'standing', label: 'Standing' },
  { value: 'walking', label: 'Walking' },
  { value: 'sitting', label: 'Sitting' },
  { value: 'running', label: 'Running' },
  { value: 'dancing', label: 'Dancing' },
  { value: 'custom', label: 'Fashion' }
];

export function PoseSelector() {
  const [selectedCategory, setSelectedCategory] = useState<PoseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  
  const {
    currentAvatar,
    availablePoses,
    setPose,
    applyPose,
    loadAvailablePoses
  } = useAvatarStore();

  // Load poses on mount
  useEffect(() => {
    loadAvailablePoses();
  }, [loadAvailablePoses]);

  // Get poses (fallback to local definitions if API not loaded)
  const allPoses = availablePoses.length > 0 ? availablePoses : getAllPoses();
  
  // Filter poses based on category and search
  const filteredPoses = allPoses.filter(pose => {
    const matchesCategory = selectedCategory === 'all' || pose.category === selectedCategory;
    const matchesSearch = pose.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectPose = async (pose: Pose) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    try {
      // Apply pose with animation
      await applyPose(pose);
      setPose(pose.id);
    } catch (error) {
      console.error('Failed to apply pose:', error);
    } finally {
      // Add a small delay for visual feedback
      setTimeout(() => setIsAnimating(false), 500);
    }
  };

  const isSelected = (pose: Pose) => {
    return currentAvatar.poseId === pose.id;
  };

  const getPoseIcon = (category: any) => {
    const icons: Record<string, string> = {
      standing: '🧍',
      walking: '🚶',
      sitting: '🪑',
      running: '🏃',
      dancing: '💃',
      custom: '✨'
    };
    return icons[category as string] || '🧍';
  };

  return (
    <div className="bg-[#171717] rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">Choose Pose</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search poses..."
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
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                selectedCategory === cat.value
                  ? 'bg-[#EA931D] text-black'
                  : 'bg-[#0E0E0E] text-[#CCCCCC] hover:text-white border border-[rgba(255,255,255,0.1)]'
              }`}
            >
              {cat.value !== 'all' && getPoseIcon(cat.value)}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pose Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          {filteredPoses.map((pose) => (
            <button
              key={pose.id}
              onClick={() => handleSelectPose(pose)}
              disabled={isAnimating}
              className={`relative bg-[#0E0E0E] rounded-xl p-4 hover:bg-[#1a1a1a] transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed ${
                isSelected(pose) ? 'ring-2 ring-[#EA931D]' : ''
              }`}
            >
              {/* Selected indicator */}
              {isSelected(pose) && (
                <div className="absolute top-2 right-2 bg-[#EA931D] text-black rounded-full p-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {/* Category Icon */}
              <div className="text-2xl mb-3 text-center">
                {getPoseIcon(pose.category)}
              </div>

              {/* Pose Info */}
              <div className="space-y-1">
                <h3 className="text-white font-medium text-sm">{pose.name}</h3>
                <p className="text-[#4C4B4B] text-xs capitalize">{pose.category}</p>
                
                {/* Tags */}
                {pose.tags && pose.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {pose.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-[rgba(234,147,29,0.2)] text-[#EA931D] rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {pose.tags.length > 2 && (
                      <span className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.1)] text-[#CCCCCC] rounded">
                        +{pose.tags.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Hover animation indicator */}
              {!isSelected(pose) && !isAnimating && (
                <div className="absolute inset-0 bg-[#EA931D]/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl pointer-events-none" />
              )}
            </button>
          ))}
        </div>

        {filteredPoses.length === 0 && (
          <div className="text-center py-8">
            <p className="text-[#CCCCCC] text-sm">No poses found</p>
            <p className="text-[#4C4B4B] text-xs mt-1">Try adjusting your search or filters</p>
          </div>
        )}
      </div>

      {/* Current Selection Info */}
      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white text-sm font-medium">Current Pose</p>
            <p className="text-[#4C4B4B] text-xs">
              {allPoses.find(p => p.id === currentAvatar.poseId)?.name || 'Default Pose'}
            </p>
          </div>
          
          {/* Animation Status */}
          {isAnimating && (
            <div className="flex items-center gap-2">
              <div className="animate-spin w-3 h-3 border border-[#EA931D] border-t-transparent rounded-full"></div>
              <span className="text-[#EA931D] text-xs">Applying...</span>
            </div>
          )}
        </div>
      </div>

      {/* Pose Tips */}
      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="bg-[rgba(234,147,29,0.1)] rounded-lg p-3">
          <h4 className="text-[#EA931D] text-xs font-medium mb-1">💡 Pro Tip</h4>
          <p className="text-[#CCCCCC] text-xs">
            Poses are automatically applied to your current mannequin. Some poses may look different depending on the body type selected.
          </p>
        </div>
      </div>
    </div>
  );
}
