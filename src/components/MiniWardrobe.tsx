'use client';

import { useEffect } from 'react';
import { useWardrobeStore, useUIStore } from '@/stores';

/**
 * MiniWardrobe - Hybrid Flow 4.5
 * Floating widget for quick wardrobe access from design editor
 */
export function MiniWardrobe() {
  const { 
    recentItems, 
    isMiniDrawerOpen, 
    openMiniDrawer, 
    closeMiniDrawer,
    selectItem,
    selectedItem,
    loadRecentItems,
  } = useWardrobeStore();

  const { showToast } = useUIStore();

  // Load recent items when drawer opens
  useEffect(() => {
    if (isMiniDrawerOpen) {
      loadRecentItems(3);
    }
  }, [isMiniDrawerOpen, loadRecentItems]);

  const handleItemClick = (item: typeof recentItems[0]) => {
    selectItem(item);
    showToast(`Selected: ${item.name}`, 'success', 2000);
    closeMiniDrawer();
  };

  const handleOpenFullWardrobe = () => {
    // Navigate to full wardrobe page
    window.location.href = '/wardrobe';
  };

  return (
    <>
      {/* Toggle Button (always visible) */}
      <button
        onClick={openMiniDrawer}
        className={`fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          isMiniDrawerOpen 
            ? 'bg-[#EA931D] text-black scale-110' 
            : 'bg-[#1A1A2E] text-white hover:bg-[#16213E] border border-[#EA931D]/30'
        }`}
        aria-label="Open mini wardrobe"
      >
        <svg 
          className="w-6 h-6" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" 
          />
        </svg>
      </button>

      {/* Expanded Drawer */}
      {isMiniDrawerOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={closeMiniDrawer}
          />

          {/* Drawer Panel */}
          <div className="fixed bottom-24 right-6 z-50 w-72 bg-[#1A1A2E] rounded-2xl shadow-2xl border border-[#EA931D]/30 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-bold flex items-center gap-2">
                <svg className="w-5 h-5 text-[#EA931D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Quick Wardrobe
              </h3>
              <button
                onClick={closeMiniDrawer}
                className="text-[#A0A0B0] hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Recent Items */}
            <div className="p-4">
              {recentItems.length === 0 ? (
                <div className="text-center py-6">
                  <svg className="w-12 h-12 text-[#A0A0B0] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[#A0A0B0] text-sm">No recent items</p>
                  <p className="text-[#666] text-xs mt-1">Upload designs to see them here</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {recentItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        selectedItem?.id === item.id
                          ? 'border-[#EA931D] ring-2 ring-[#EA931D]/30'
                          : 'border-transparent hover:border-[#EA931D]/50'
                      }`}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback for missing images
                          (e.target as HTMLImageElement).src = '/data/pattern-placeholder.svg';
                        }}
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-2">
                        <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity truncate">
                          {item.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Drag hint */}
              {recentItems.length > 0 && (
                <p className="text-[#666] text-xs text-center mt-3">
                  Click to apply to design
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-black/20">
              <button
                onClick={handleOpenFullWardrobe}
                className="w-full py-2.5 bg-[#16213E] text-white text-sm font-medium rounded-xl hover:bg-[#1F1F3D] transition-colors flex items-center justify-center gap-2"
              >
                <span>Open Full Wardrobe</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
