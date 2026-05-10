/**
 * Design Store - All user designs and current design management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  saveAnonymousDesign, 
  updateAnonymousDesign,
  AnonymousDesign 
} from '@/lib/anonymous-transfer';
import { incrementDesignsCount } from '@/lib/user-detection';

export interface Design {
  id: string;
  name: string;
  userId: string | null; // null for anonymous designs
  templateId: string;
  templateCategory: 'men' | 'women' | 'children';
  thumbnail: string | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DesignState {
  // Design lists
  recentDesigns: Design[];
  savedDesigns: Design[];
  currentDesign: Design | null;
  
  // Loading states
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  setCurrentDesign: (design: Design | null) => void;
  createDesign: (templateId: string, templateCategory: string, isAnonymous?: boolean) => Promise<string>;
  saveDesign: (designData: Partial<Design>) => Promise<boolean>;
  addDesign: (design: Partial<Design> & { id: string; name: string; type?: string }) => void;
  loadRecentDesigns: () => Promise<void>;
  loadSavedDesigns: () => Promise<void>;
  deleteDesign: (designId: string) => Promise<boolean>;
  duplicateDesign: (designId: string) => Promise<string | null>;
  clearError: () => void;
}

export const useDesignStore = create<DesignState>()(
  persist(
    (set, get) => ({
      // Initial state
      recentDesigns: [],
      savedDesigns: [],
      currentDesign: null,
      isLoading: false,
      isSaving: false,
      error: null,

      // Set current design
      setCurrentDesign: (design) => {
        set({ currentDesign: design, error: null });
      },

      // Create new design (anonymous or authenticated)
      createDesign: async (templateId, templateCategory, isAnonymous = false) => {
        set({ isLoading: true, error: null });
        
        const newDesign: Design = {
          id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: 'Untitled Design',
          userId: null,
          templateId,
          templateCategory: templateCategory as 'men' | 'women' | 'children',
          thumbnail: null,
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        if (isAnonymous) {
          // Save to anonymous storage
          const anonDesign: Omit<AnonymousDesign, 'id' | 'createdAt' | 'updatedAt'> = {
            name: newDesign.name,
            templateId: newDesign.templateId,
            templateCategory: newDesign.templateCategory,
            thumbnailDataUrl: null,
            designData: {
              brushStrokes: [],
              appliedTextures: [],
              colorPalette: [],
            },
          };
          
          const anonId = saveAnonymousDesign(anonDesign);
          newDesign.id = anonId;
          
          set(state => ({
            recentDesigns: [newDesign, ...state.recentDesigns].slice(0, 5),
            currentDesign: newDesign,
            isLoading: false,
          }));
          
          return anonId;
        }

        // Authenticated - save to backend
        try {
          const response = await fetch('/api/designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDesign),
          });
          
          if (!response.ok) {
            throw new Error('Failed to create design');
          }
          
          const savedDesign = await response.json();
          incrementDesignsCount();
          
          set(state => ({
            recentDesigns: [savedDesign, ...state.recentDesigns].slice(0, 5),
            savedDesigns: [savedDesign, ...state.savedDesigns],
            currentDesign: savedDesign,
            isLoading: false,
          }));
          
          return savedDesign.id;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create design',
            isLoading: false,
          });
          throw error;
        }
      },

      // Add design to recent designs (used by DesignEditor after export)
      addDesign: (design) => {
        // Handle 'type' property passed by DesignEditor (maps to templateCategory/templateId)
        const templateCategory = (design as unknown as { type?: string }).type === 'shirt'
          ? 'women'
          : (design.templateCategory as 'men' | 'women' | 'children') || 'women';

        const newDesign: Design = {
          ...design,
          id: design.id,
          name: design.name,
          userId: design.userId ?? null,
          templateId: design.templateId || (design as unknown as { type?: string }).type || 'default',
          templateCategory: design.templateCategory || templateCategory,
          thumbnail: design.thumbnail ?? null,
          isPublic: design.isPublic ?? false,
          createdAt: design.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set(state => ({
          recentDesigns: [newDesign, ...state.recentDesigns].slice(0, 10),
          currentDesign: newDesign,
        }));
      },

      // Save/update design
      saveDesign: async (designData) => {
        const { currentDesign } = get();
        if (!currentDesign) return false;

        set({ isSaving: true, error: null });

        const updatedDesign = {
          ...currentDesign,
          ...designData,
          updatedAt: new Date().toISOString(),
        };

        // If anonymous, update in localStorage
        if (currentDesign.userId === null && currentDesign.id.startsWith('anon_')) {
          const success = updateAnonymousDesign(currentDesign.id, {
            name: updatedDesign.name,
            thumbnailDataUrl: updatedDesign.thumbnail,
          });
          
          if (success) {
            set({
              currentDesign: updatedDesign,
              isSaving: false,
            });
          }
          
          return success;
        }

        // Authenticated - update backend
        try {
          const response = await fetch(`/api/designs/${currentDesign.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedDesign),
          });
          
          if (!response.ok) {
            throw new Error('Failed to save design');
          }
          
          set({
            currentDesign: updatedDesign,
            isSaving: false,
          });
          
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to save design',
            isSaving: false,
          });
          return false;
        }
      },

      // Load recent designs (from backend or localStorage)
      loadRecentDesigns: async () => {
        set({ isLoading: true, error: null });
        
        try {
          // Try loading from backend first
          const response = await fetch('/api/designs?limit=5');
          
          if (response.ok) {
            const designs = await response.json();
            set({
              recentDesigns: designs,
              isLoading: false,
            });
            return;
          }
        } catch {
          // Backend not available, try localStorage
        }
        
        // Fallback to anonymous designs from localStorage
        const { getAnonymousDesigns } = await import('@/lib/anonymous-transfer');
        const anonDesigns = getAnonymousDesigns();
        
        const designs: Design[] = anonDesigns.map(ad => ({
          id: ad.id,
          name: ad.name,
          userId: null,
          templateId: ad.templateId,
          templateCategory: ad.templateCategory as 'men' | 'women' | 'children',
          thumbnail: ad.thumbnailDataUrl,
          isPublic: false,
          createdAt: new Date(ad.createdAt).toISOString(),
          updatedAt: new Date(ad.updatedAt).toISOString(),
        }));
        
        set({
          recentDesigns: designs,
          isLoading: false,
        });
      },

      // Load all saved designs
      loadSavedDesigns: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch('/api/designs');
          
          if (!response.ok) {
            throw new Error('Failed to load designs');
          }
          
          const designs = await response.json();
          set({
            savedDesigns: designs,
            isLoading: false,
          });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to load designs',
            isLoading: false,
          });
        }
      },

      // Delete design
      deleteDesign: async (designId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await fetch(`/api/designs/${designId}`, {
            method: 'DELETE',
          });
          
          if (!response.ok) {
            throw new Error('Failed to delete design');
          }
          
          set(state => ({
            savedDesigns: state.savedDesigns.filter(d => d.id !== designId),
            recentDesigns: state.recentDesigns.filter(d => d.id !== designId),
            isLoading: false,
          }));
          
          return true;
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete design',
            isLoading: false,
          });
          return false;
        }
      },

      // Duplicate design
      duplicateDesign: async (designId) => {
        const design = get().savedDesigns.find(d => d.id === designId) ||
                       get().recentDesigns.find(d => d.id === designId);
        
        if (!design) return null;
        
        const newDesign = {
          ...design,
          id: `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: `${design.name} (Copy)`,
          isPublic: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        try {
          const response = await fetch('/api/designs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newDesign),
          });
          
          if (!response.ok) {
            throw new Error('Failed to duplicate design');
          }
          
          const saved = await response.json();
          
          set(state => ({
            savedDesigns: [saved, ...state.savedDesigns],
          }));
          
          return saved.id;
        } catch {
          return null;
        }
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'moatt-design-storage',
      partialize: (state) => ({
        recentDesigns: state.recentDesigns,
        savedDesigns: state.savedDesigns,
        // Don't persist currentDesign - restore per session
      }),
    }
  )
);
