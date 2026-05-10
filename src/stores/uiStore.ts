/**
 * UI Store - UI state management including hybrid widgets (Flow 4.5, 5.5)
 */

import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface QuickSettingsState {
  isOpen: boolean;
}

interface ExportModalState {
  isOpen: boolean;
  format: 'png' | 'pdf';
  resolution: '2k' | '4k' | '8k';
  delivery: 'now' | 'email';
  isProcessing: boolean;
  progress: number;
}

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration: number;
}

interface UIState {
  // Theme
  theme: Theme;
  
  // Navigation
  isMobileMenuOpen: boolean;
  currentSection: string;
  
  // Modals
  isAuthModalOpen: boolean;
  isOnboardingOpen: boolean;
  exportModal: ExportModalState;
  
  // Hybrid widgets (Flow 4.5, 5.5)
  quickSettings: QuickSettingsState;
  
  // Toast notifications
  toasts: Toast[];
  
  // Global loading
  isPageLoading: boolean;
  
  // Actions
  setTheme: (theme: Theme) => void;
  
  // Navigation
  toggleMobileMenu: () => void;
  closeMobileMenu: () => void;
  setCurrentSection: (section: string) => void;
  
  // Auth modal
  openAuthModal: () => void;
  closeAuthModal: () => void;
  
  // Onboarding
  openOnboarding: () => void;
  closeOnboarding: () => void;
  
  // Export modal
  openExportModal: (initialFormat?: 'png' | 'pdf') => void;
  closeExportModal: () => void;
  setExportFormat: (format: 'png' | 'pdf') => void;
  setExportResolution: (resolution: '2k' | '4k' | '8k') => void;
  setExportDelivery: (delivery: 'now' | 'email') => void;
  setExportProcessing: (isProcessing: boolean) => void;
  setExportProgress: (progress: number) => void;
  
  // Quick settings (Flow 5.5)
  openQuickSettings: () => void;
  closeQuickSettings: () => void;
  toggleQuickSettings: () => void;
  
  // Toast
  showToast: (message: string, type: Toast['type'], duration?: number) => void;
  dismissToast: (id: string) => void;
  
  // Page loading
  setPageLoading: (isLoading: boolean) => void;
}

const DEFAULT_EXPORT_MODAL: ExportModalState = {
  isOpen: false,
  format: 'png',
  resolution: '2k',
  delivery: 'now',
  isProcessing: false,
  progress: 0,
};

export const useUIStore = create<UIState>()((set, get) => ({
  // Initial state
  theme: 'system',
  
  isMobileMenuOpen: false,
  currentSection: 'home',
  
  isAuthModalOpen: false,
  isOnboardingOpen: false,
  exportModal: DEFAULT_EXPORT_MODAL,
  
  quickSettings: {
    isOpen: false,
  },
  
  toasts: [],
  
  isPageLoading: false,

  // Theme
  setTheme: (theme) => {
    set({ theme });
    
    // Apply theme to document
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.remove('light', 'dark');
        root.classList.add(systemTheme);
      } else {
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
      }
    }
  },

  // Navigation
  toggleMobileMenu: () => set(state => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  
  setCurrentSection: (section) => set({ currentSection: section }),

  // Auth modal
  openAuthModal: () => set({ isAuthModalOpen: true }),
  
  closeAuthModal: () => set({ isAuthModalOpen: false }),

  // Onboarding
  openOnboarding: () => set({ isOnboardingOpen: true }),
  
  closeOnboarding: () => set({ isOnboardingOpen: false }),

  // Export modal
  openExportModal: (initialFormat = 'png') => set({
    exportModal: {
      ...DEFAULT_EXPORT_MODAL,
      isOpen: true,
      format: initialFormat,
    }
  }),
  
  closeExportModal: () => set({
    exportModal: DEFAULT_EXPORT_MODAL,
  }),
  
  setExportFormat: (format) => set(state => ({
    exportModal: { ...state.exportModal, format },
  })),
  
  setExportResolution: (resolution) => set(state => ({
    exportModal: { 
      ...state.exportModal, 
      resolution,
      // Force email delivery for 8K
      delivery: resolution === '8k' ? 'email' : state.exportModal.delivery,
    },
  })),
  
  setExportDelivery: (delivery) => set(state => ({
    exportModal: { ...state.exportModal, delivery },
  })),
  
  setExportProcessing: (isProcessing) => set(state => ({
    exportModal: { ...state.exportModal, isProcessing },
  })),
  
  setExportProgress: (progress) => set(state => ({
    exportModal: { ...state.exportModal, progress },
  })),

  // Quick settings (Flow 5.5)
  openQuickSettings: () => set(state => ({
    quickSettings: { ...state.quickSettings, isOpen: true },
  })),
  
  closeQuickSettings: () => set(state => ({
    quickSettings: { ...state.quickSettings, isOpen: false },
  })),
  
  toggleQuickSettings: () => set(state => ({
    quickSettings: { 
      ...state.quickSettings, 
      isOpen: !state.quickSettings.isOpen 
    },
  })),

  // Toast notifications
  showToast: (message, type, duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const toast: Toast = { id, message, type, duration };
    
    set(state => ({
      toasts: [...state.toasts, toast],
    }));
    
    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => {
        get().dismissToast(id);
      }, duration);
    }
  },
  
  dismissToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),

  // Page loading
  setPageLoading: (isLoading) => set({ isPageLoading: isLoading }),
}));

// Initialize theme on mount
export function initializeTheme(): void {
  if (typeof window === 'undefined') return;
  
  const store = useUIStore.getState();
  store.setTheme(store.theme);
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', () => {
    if (store.theme === 'system') {
      store.setTheme('system');
    }
  });
}
