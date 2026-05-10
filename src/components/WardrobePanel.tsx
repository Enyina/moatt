'use client';

import { useState, useEffect } from 'react';
import { useAvatarStore } from '@/store/useAvatarStore';
import { WardrobeItem } from '@/lib/types';

export function WardrobePanel() {
  const [newOutfitName, setNewOutfitName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPublic, setIsPublic] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  
  const {
    currentAvatar,
    wardrobeItems,
    isLoadingWardrobe,
    loadWardrobe,
    saveToWardrobe,
    loadAvatar,
    deleteWardrobeItem,
    updateWardrobeItem,
    ui
  } = useAvatarStore();

  // Load wardrobe on mount
  useEffect(() => {
    loadWardrobe();
  }, [loadWardrobe]);

  const handleSaveOutfit = async () => {
    if (!newOutfitName.trim()) return;

    setIsSaving(true);
    try {
      await saveToWardrobe(newOutfitName.trim(), {
        tags: selectedTags,
        isPublic
      });
      
      // Reset form
      setNewOutfitName('');
      setSelectedTags([]);
      setIsPublic(false);
      setShowSaveForm(false);
    } catch (error) {
      console.error('Failed to save outfit:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadOutfit = async (item: WardrobeItem) => {
    await loadAvatar(item.id);
  };

  const handleDeleteOutfit = async (itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this outfit?')) return;
    
    try {
      await deleteWardrobeItem(itemId);
    } catch (error) {
      console.error('Failed to delete outfit:', error);
    }
  };

  const handleToggleFavorite = async (item: WardrobeItem, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await updateWardrobeItem(item.id, {
        isFavorite: !item.isFavorite
      });
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag.trim())) {
      setSelectedTags([...selectedTags, tag.trim()]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag((e.target as HTMLInputElement).value);
      (e.target as HTMLInputElement).value = '';
    }
  };

  // Sort items: favorites first, then by date
  const sortedItems = [...wardrobeItems].sort((a, b) => {
    if (a.isFavorite && !b.isFavorite) return -1;
    if (!a.isFavorite && b.isFavorite) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  return (
    <div className="bg-[#171717] rounded-2xl p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">My Wardrobe</h2>
          <button
            onClick={() => setShowSaveForm(!showSaveForm)}
            className="bg-[#EA931D] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#EA931D]/90 transition-colors"
          >
            {showSaveForm ? 'Cancel' : 'Save Current'}
          </button>
        </div>

        {/* Save Form */}
        {showSaveForm && (
          <div className="bg-[#0E0E0E] rounded-xl p-4 space-y-4">
            <div>
              <label className="block text-white text-sm font-medium mb-2">Outfit Name</label>
              <input
                type="text"
                value={newOutfitName}
                onChange={(e) => setNewOutfitName(e.target.value)}
                placeholder="Enter outfit name..."
                className="w-full bg-[#171717] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-3 text-white placeholder-[#4C4B4B] focus:outline-none focus:border-[#EA931D]"
                onKeyPress={(e) => e.key === 'Enter' && handleSaveOutfit()}
              />
            </div>

            <div>
              <label className="block text-white text-sm font-medium mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#EA931D] text-black px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hover:bg-black/20 rounded-full p-0.5"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tags (press Enter)..."
                className="w-full bg-[#171717] border border-[rgba(255,255,255,0.1)] rounded-lg py-2 px-3 text-white placeholder-[#4C4B4B] focus:outline-none focus:border-[#EA931D]"
                onKeyDown={handleTagInput}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-white text-sm">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-gray-300 bg-[#171717] text-[#EA931D] focus:ring-[#EA931D]"
                />
                Make public
              </label>
              
              <button
                onClick={handleSaveOutfit}
                disabled={!newOutfitName.trim() || isSaving}
                className="bg-[#EA931D] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#EA931D]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : 'Save Outfit'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wardrobe Items */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingWardrobe ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-[#EA931D] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-[#CCCCCC] text-sm">Loading wardrobe...</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#0E0E0E] rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-[#4C4B4B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-[#CCCCCC] text-sm mb-2">No outfits saved yet</p>
            <p className="text-[#4C4B4B] text-xs">Create and save your first outfit to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleLoadOutfit(item)}
                className="bg-[#0E0E0E] rounded-xl p-4 hover:bg-[#1a1a1a] transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-white font-medium">{item.name}</h3>
                      {item.isFavorite && (
                        <svg className="w-4 h-4 text-[#EA931D]" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034c-.784-.57-1.838-.197-1.539.69l1.07 3.292a1 1 0 01-1.45 1.184L10 13.06l-2.8 2.034c-.784.57-1.838.197-1.539-.69l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      )}
                      {item.isPublic && (
                        <span className="text-xs px-2 py-0.5 bg-[rgba(234,147,29,0.2)] text-[#EA931D] rounded">
                          Public
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {item.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-[rgba(255,255,255,0.1)] text-[#CCCCCC] rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <p className="text-[#4C4B4B] text-xs">
                      Updated {new Date(item.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleToggleFavorite(item, e)}
                      className="p-2 hover:bg-[rgba(255,255,255,0.1)] rounded-lg transition-colors"
                      title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <svg className="w-4 h-4 text-[#CCCCCC]" fill={item.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.784.57-1.838.197-1.539-.69l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={(e) => handleDeleteOutfit(item.id, e)}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete outfit"
                    >
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#4C4B4B]">
            {wardrobeItems.length} {wardrobeItems.length === 1 ? 'outfit' : 'outfits'} saved
          </span>
          <span className="text-[#4C4B4B]">
            {sortedItems.filter(item => item.isFavorite).length} favorites
          </span>
        </div>
      </div>
    </div>
  );
}
