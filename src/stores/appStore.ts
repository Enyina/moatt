import { create } from 'zustand';
import type { Template, Design, Category } from '@/types';

interface AppState {
  selectedTemplate: Template | null;
  currentDesign: Design | null;
  category: Category;
  recentDesigns: Design[];
  templates: Template[];
  
  setSelectedTemplate: (template: Template | null) => void;
  setCurrentDesign: (design: Design | null) => void;
  setCategory: (category: Category) => void;
  setRecentDesigns: (designs: Design[]) => void;
  setTemplates: (templates: Template[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  selectedTemplate: null,
  currentDesign: null,
  category: 'all',
  recentDesigns: [],
  templates: [],

  setSelectedTemplate: (template) => set({ selectedTemplate: template }),
  setCurrentDesign: (design) => set({ currentDesign: design }),
  setCategory: (category) => set({ category }),
  setRecentDesigns: (designs) => set({ recentDesigns: designs }),
  setTemplates: (templates) => set({ templates }),
}));