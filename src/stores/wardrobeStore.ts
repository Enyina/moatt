/**
 * Wardrobe Store - User uploads and asset management
 * Handles custom designs, fabrics, and textures
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WardrobeCategory = 'fabric' | 'pattern' | 'texture' | 'image';

export interface WardrobeItem {
  id: string;
  name: string;
  imageUrl: string;
  category: WardrobeCategory;
  tags: string[];
  createdAt: string;
  isDefault: boolean; // System provided vs user uploaded
}

interface WardrobeState {
  // Items
  items: WardrobeItem[];
  recentItems: WardrobeItem[];
  
  // Filters
  selectedCategory: WardrobeCategory | 'all';
  searchQuery: string;
  
  // Upload state
  isUploading: boolean;
  uploadProgress: number;
  
  // Selection (for applying to design)
  selectedItem: WardrobeItem | null;
  
  // Mini wardrobe drawer state (Flow 4.5)
  isMiniDrawerOpen: boolean;
  
  // Loading
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setSelectedCategory: (category: WardrobeCategory | 'all') => void;
  setSearchQuery: (query: string) => void;
  
  // Data loading
  loadItems: () => Promise<void>;
  loadRecentItems: (limit?: number) => Promise<void>;
  
  // Upload
  uploadItem: (file: File, category: WardrobeCategory, name?: string) => Promise<WardrobeItem | null>;
  
  // Selection
  selectItem: (item: WardrobeItem | null) => void;
  
  // Mini drawer
  toggleMiniDrawer: () => void;
  openMiniDrawer: () => void;
  closeMiniDrawer: () => void;
  
  // CRUD
  deleteItem: (itemId: string) => Promise<boolean>;
  updateItem: (itemId: string, updates: Partial<WardrobeItem>) => Promise<boolean>;
  saveDesignFromDataUrl: (dataUrl: string, name: string) => Promise<WardrobeItem>;
  
  // Error handling
  clearError: () => void;
}

// Default system items
const DEFAULT_ITEMS: WardrobeItem[] = [
  {
    id: 'default_1',
    name: 'Denim Blue',
    imageUrl: '/data/patterns/denim.jpg',
    category: 'fabric',
    tags: ['denim', 'blue', 'casual'],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'default_2',
    name: 'Silk White',
    imageUrl: '/data/patterns/silk.jpg',
    category: 'fabric',
    tags: ['silk', 'white', 'elegant'],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
  {
    id: 'default_3',
    name: 'Cotton Stripes',
    imageUrl: '/data/patterns/stripes.jpg',
    category: 'pattern',
    tags: ['stripes', 'cotton', 'classic'],
    createdAt: new Date().toISOString(),
    isDefault: true,
  },
];

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: DEFAULT_ITEMS,
      recentItems: DEFAULT_ITEMS.slice(0, 3),
      
      selectedCategory: 'all',
      searchQuery: '',
      
      isUploading: false,
      uploadProgress: 0,
      
      selectedItem: null,
      
      isMiniDrawerOpen: false,
      
      isLoading: false,
      error: null,

      // Filter actions
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),

      // Load all items
      loadItems: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/wardrobe');
          
          if (!response.ok) {
            throw new Error('Failed to load wardrobe items');
          }
          
          const items = await response.json();
          
          // Merge with defaults
          const allItems = [...DEFAULT_ITEMS, ...items.filter((i: WardrobeItem) => !i.isDefault)];
          
          set({
            items: allItems,
            isLoading: false,
          });
        } catch (error) {
          // Keep defaults on error
          set({
            error: error instanceof Error ? error.message : 'Failed to load items',
            isLoading: false,
          });
        }
      },

      // Load recent items (for mini drawer)
      loadRecentItems: async (limit = 3) => {
        const { items } = get();
        
        // Sort by createdAt desc, take limit
        const sorted = [...items]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, limit);
        
        set({ recentItems: sorted });
      },

      // Upload new item
      uploadItem: async (file, category, name) => {
        set({ isUploading: true, uploadProgress: 0, error: null });
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        if (name) formData.append('name', name);
        
        try {
          // Simulate progress
          const progressInterval = setInterval(() => {
            set(state => ({
              uploadProgress: Math.min(state.uploadProgress + 10, 90),
            }));
          }, 100);
          
          const response = await fetch('/api/wardrobe', {
            method: 'POST',
            body: formData,
          });
          
          clearInterval(progressInterval);
          
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          
          const newItem = await response.json();
          
          set(state => ({
            items: [newItem, ...state.items],
            recentItems: [newItem, ...state.recentItems].slice(0, 5),
            isUploading: false,
            uploadProgress: 100,
          }));
          
          return newItem;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Upload failed',
            isUploading: false,
            uploadProgress: 0,
          });
          return null;
        }
      },

      // Selection
      selectItem: (item) => set({ selectedItem: item }),

      // Mini drawer controls
      toggleMiniDrawer: () => set(state => ({ isMiniDrawerOpen: !state.isMiniDrawerOpen })),
      
      openMiniDrawer: () => {
        get().loadRecentItems(3);
        set({ isMiniDrawerOpen: true });
      },
      
      closeMiniDrawer: () => set({ isMiniDrawerOpen: false }),

      // Delete item
      deleteItem: async (itemId) => {
        try {
          const response = await fetch(`/api/wardrobe/${itemId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete item');
          }
          
          set(state => ({
            items: state.items.filter(i => i.id !== itemId),
            recentItems: state.recentItems.filter(i => i.id !== itemId),
          }));
          
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Delete failed',
          });
          return false;
        }
      },

      // Update item
      updateItem: async (itemId, updates) => {
        try {
          const response = await fetch(`/api/wardrobe/${itemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update item');
          }
          
          const updated = await response.json();
          
          set(state => ({
            items: state.items.map(i => i.id === itemId ? updated : i),
            recentItems: state.recentItems.map(i => i.id === itemId ? updated : i),
          }));
          
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Update failed',
          });
          return false;
        }
      },

      saveDesignFromDataUrl: async (dataUrl, name) => {
        const newItem: WardrobeItem = {
          id: `design_${Date.now()}`,
          name,
          imageUrl: dataUrl,
          category: 'texture',
          tags: ['custom', 'design'],
          createdAt: new Date().toISOString(),
          isDefault: false,
        };

        set(state => ({
          items: [newItem, ...state.items],
          recentItems: [newItem, ...state.recentItems].slice(0, 5),
        }));

        return newItem;
      },

      // Clear error
      clearError: () => set({ error: null }),
    }),
    {
      name: 'moatt-wardrobe-storage',
      partialize: (state) => ({
        items: state.items.filter(i => !i.isDefault), // Don't persist defaults
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);
