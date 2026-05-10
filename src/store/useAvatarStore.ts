'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { 
  AvatarState, 
  WardrobeItem, 
  Pose, 
  MannequinModel, 
  Accessory, 
  UIState,
  AvatarStoreState, 
  AvatarStoreActions,
  DEFAULT_AVATAR_STATE,
  DEFAULT_EXPORT_OPTIONS,
  ExportOptions,
  ExportResult,
  Vector3
} from '@/lib/types';

// Helper function to generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Helper function to create timestamps
const now = () => new Date().toISOString();

// Local storage fallback
const localStorageStorage = {
  getItem: (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // Silently fail if localStorage is full/disabled
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // Silently fail
    }
  }
};

// Server API functions
const wardrobeAPI = {
  async load(): Promise<WardrobeItem[]> {
    try {
      const response = await fetch('/api/wardrobe');
      if (!response.ok) throw new Error('Failed to load wardrobe');
      const data = await response.json();
      return data.success ? data.data || [] : [];
    } catch (error) {
      console.warn('Server wardrobe unavailable, using localStorage:', error);
      return [];
    }
  },

  async save(item: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WardrobeItem> {
    try {
      const response = await fetch('/api/wardrobe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (!response.ok) throw new Error('Failed to save to wardrobe');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      return data.data;
    } catch (error) {
      console.warn('Server save failed, using localStorage:', error);
      throw error;
    }
  },

  async update(id: string, updates: Partial<WardrobeItem>): Promise<WardrobeItem> {
    try {
      const response = await fetch(`/api/wardrobe/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update wardrobe item');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Update failed');
      return data.data;
    } catch (error) {
      console.warn('Server update failed, using localStorage:', error);
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/wardrobe/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete wardrobe item');
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Delete failed');
    } catch (error) {
      console.warn('Server delete failed, using localStorage:', error);
      throw error;
    }
  }
};

// Create the store
export const useAvatarStore = create<AvatarStoreState & AvatarStoreActions>()(
  persist(
    (set, get) => ({
      // Initial state
      currentAvatar: {
        ...DEFAULT_AVATAR_STATE,
        id: generateId(),
        createdAt: now(),
        updatedAt: now()
      },
      wardrobeItems: [],
      isLoadingWardrobe: false,
      availablePoses: [],
      availableMannequins: [],
      availableAccessories: [],
      ui: {
        activePanel: 'wardrobe',
        selectedAccessoryType: null,
        isPlaying: false,
        isLoading: false,
        error: null
      },
      settings: {
        autoSave: true,
        exportQuality: DEFAULT_EXPORT_OPTIONS,
        preferredBodyType: 'female-standard'
      },

      // Avatar manipulation
      setAvatar: (updates) => {
        set((state) => ({
          currentAvatar: {
            ...state.currentAvatar,
            ...updates,
            updatedAt: now()
          }
        }));
      },

      resetAvatar: () => {
        set({
          currentAvatar: {
            ...DEFAULT_AVATAR_STATE,
            id: generateId(),
            createdAt: now(),
            updatedAt: now()
          }
        });
      },

      loadAvatar: async (avatarId) => {
        const { wardrobeItems } = get();
        const item = wardrobeItems.find(item => item.id === avatarId);
        if (item) {
          set({
            currentAvatar: item.avatarState
          });
        } else {
          set((state) => ({
            ui: { ...state.ui, error: `Avatar ${avatarId} not found` }
          }));
        }
      },

      // Clothing
      setClothingTexture: (texture) => {
        set((state) => ({
          currentAvatar: {
            ...state.currentAvatar,
            clothingTexture: texture,
            updatedAt: now()
          }
        }));
      },

      clearClothingTexture: () => {
        set((state) => ({
          currentAvatar: {
            ...state.currentAvatar,
            clothingTexture: '',
            updatedAt: now()
          }
        }));
      },

      // Pose management
      setPose: (poseId) => {
        set((state) => ({
          currentAvatar: {
            ...state.currentAvatar,
            poseId,
            updatedAt: now()
          }
        }));
      },

      applyPose: (pose) => {
        const { currentAvatar } = get();
        set({
          currentAvatar: {
            ...currentAvatar,
            poseId: pose.id,
            updatedAt: now()
          }
        });
      },

      // Accessory management
      addAccessory: (accessory) => {
        const newAccessory: Accessory = {
          id: generateId(),
          name: accessory.name || 'New Accessory',
          type: accessory.type || 'custom',
          modelUrl: accessory.modelUrl || '',
          isVisible: true,
          position: accessory.position || { x: 0, y: 0, z: 0 },
          rotation: accessory.rotation || { x: 0, y: 0, z: 0 },
          scale: accessory.scale || { x: 1, y: 1, z: 1 },
          ...accessory,
        };
        
        set((state) => ({
          currentAvatar: {
            ...state.currentAvatar,
            accessories: [...state.currentAvatar.accessories, newAccessory],
            updatedAt: now()
          }
        }));
      },

      updateAccessory: (id, updates) => {
        set((state) => ({
          currentAvatar: {
            ...state.currentAvatar,
            accessories: state.currentAvatar.accessories.map(acc =>
              acc.id === id ? { ...acc, ...updates } : acc
            ),
            updatedAt: now()
          }
        }));
      },

      removeAccessory: (id) => {
        set((state) => ({
          currentAvatar: {
            ...state.currentAvatar,
            accessories: state.currentAvatar.accessories.filter(acc => acc.id !== id),
            updatedAt: now()
          }
        }));
      },

      toggleAccessoryVisibility: (id) => {
        set((state) => ({
          currentAvatar: {
            ...state.currentAvatar,
            accessories: state.currentAvatar.accessories.map(acc =>
              acc.id === id ? { ...acc, isVisible: !acc.isVisible } : acc
            ),
            updatedAt: now()
          }
        }));
      },

      // Wardrobe management
      loadWardrobe: async () => {
        set((state) => ({
          ui: { ...state.ui, isLoading: true, error: null }
        }));

        try {
          // Try server first
          let items = await wardrobeAPI.load();
          
          // Fallback to localStorage
          if (items.length === 0) {
            const stored = localStorageStorage.getItem('wardrobe-items');
            if (stored) {
              items = JSON.parse(stored);
            }
          }

          set({ wardrobeItems: items });
        } catch (error) {
          set((state) => ({
            ui: { ...state.ui, error: `Failed to load wardrobe: ${error}` }
          }));
        } finally {
          set((state) => ({
            ui: { ...state.ui, isLoading: false }
          }));
        }
      },

      saveToWardrobe: async (name, options = {}) => {
        const { currentAvatar } = get();
        
        try {
          const wardrobeItem: Omit<WardrobeItem, 'id' | 'createdAt' | 'updatedAt'> = {
            name,
            avatarState: currentAvatar,
            tags: options.tags || [],
            isFavorite: false
          };

          // Try server first
          try {
            const savedItem = await wardrobeAPI.save(wardrobeItem);
            set((state) => ({
              wardrobeItems: [...state.wardrobeItems, savedItem]
            }));
          } catch {
            // Fallback to localStorage
            const fallbackItem: WardrobeItem = {
              ...wardrobeItem,
              id: generateId(),
              createdAt: now(),
              updatedAt: now()
            };
            
            const { wardrobeItems } = get();
            const updatedItems = [...wardrobeItems, fallbackItem];
            set({ wardrobeItems: updatedItems });
            localStorageStorage.setItem('wardrobe-items', JSON.stringify(updatedItems));
          }
        } catch (error) {
          set((state) => ({
            ui: { ...state.ui, error: `Failed to save to wardrobe: ${error}` }
          }));
        }
      },

      updateWardrobeItem: async (id, updates) => {
        try {
          // Try server first
          try {
            const updatedItem = await wardrobeAPI.update(id, updates);
            set((state) => ({
              wardrobeItems: state.wardrobeItems.map(item =>
                item.id === id ? updatedItem : item
              )
            }));
          } catch {
            // Fallback to localStorage
            const { wardrobeItems } = get();
            const updatedItems = wardrobeItems.map(item =>
              item.id === id ? { ...item, ...updates, updatedAt: now() } : item
            );
            set({ wardrobeItems: updatedItems });
            localStorageStorage.setItem('wardrobe-items', JSON.stringify(updatedItems));
          }
        } catch (error) {
          set((state) => ({
            ui: { ...state.ui, error: `Failed to update wardrobe item: ${error}` }
          }));
        }
      },

      deleteWardrobeItem: async (id) => {
        try {
          // Try server first
          try {
            await wardrobeAPI.delete(id);
          } catch {
            // Fallback to localStorage
            const { wardrobeItems } = get();
            const updatedItems = wardrobeItems.filter(item => item.id !== id);
            set({ wardrobeItems: updatedItems });
            localStorageStorage.setItem('wardrobe-items', JSON.stringify(updatedItems));
          }
          
          set((state) => ({
            wardrobeItems: state.wardrobeItems.filter(item => item.id !== id)
          }));
        } catch (error) {
          set((state) => ({
            ui: { ...state.ui, error: `Failed to delete wardrobe item: ${error}` }
          }));
        }
      },

      // Data loading
      loadAvailablePoses: async () => {
        try {
          const response = await fetch('/api/poses');
          if (response.ok) {
            const data = await response.json();
            set({ availablePoses: data.success ? data.data || [] : [] });
          }
        } catch (error) {
          console.warn('Failed to load poses:', error);
        }
      },

      loadAvailableMannequins: async () => {
        try {
          const response = await fetch('/api/mannequins');
          if (response.ok) {
            const data = await response.json();
            set({ availableMannequins: data.success ? data.data || [] : [] });
          }
        } catch (error) {
          console.warn('Failed to load mannequins:', error);
        }
      },

      loadAvailableAccessories: async () => {
        try {
          const response = await fetch('/api/accessories');
          if (response.ok) {
            const data = await response.json();
            set({ availableAccessories: data.success ? data.data || [] : [] });
          }
        } catch (error) {
          console.warn('Failed to load accessories:', error);
        }
      },

      // UI actions
      setActivePanel: (panel) => {
        set((state) => ({
          ui: { ...state.ui, activePanel: panel }
        }));
      },

      setSelectedAccessoryType: (type) => {
        set((state) => ({
          ui: { ...state.ui, selectedAccessoryType: type }
        }));
      },

      setError: (error) => {
        set((state) => ({
          ui: { ...state.ui, error }
        }));
      },

      setLoading: (loading) => {
        set((state) => ({
          ui: { ...state.ui, isLoading: loading }
        }));
      },

      // Export
      exportAvatar: async (options): Promise<ExportResult> => {
        try {
          const { currentAvatar } = get();
          
          // This will be implemented with Three.js GLTFExporter
          const response = await fetch('/api/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              avatar: currentAvatar,
              options
            })
          });

          if (!response.ok) {
            throw new Error('Export failed');
          }

          const data = await response.json();
          return data.success ? data : { success: false, error: data.error, filename: `avatar-${Date.now()}.glb` };
        } catch (error) {
          return {
            success: false,
            error: `Export failed: ${error}`,
            filename: `avatar-${Date.now()}.glb`
          };
        }
      },

      // Settings
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }));
      }
    }),
    {
      name: 'avatar-store',
      storage: createJSONStorage(() => localStorageStorage),
      partialize: (state) => ({
        // Only persist these parts to localStorage
        currentAvatar: state.currentAvatar,
        settings: state.settings,
        ui: {
          activePanel: state.ui.activePanel,
          selectedAccessoryType: state.ui.selectedAccessoryType
        }
      })
    }
  )
);
