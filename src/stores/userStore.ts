/**
 * User Store - Authentication, profile, and user type management
 * Handles new vs returning user state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  UserStatus,
  UserType,
  detectUserStatus,
  recordVisit,
  completeOnboarding,
  hasAnonymousDesigns,
  getAnonymousDesignsCount,
} from '@/lib/user-detection';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: string;
}

interface UserState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // User type detection
  userStatus: UserStatus;
  
  // Anonymous transfer
  showTransferPrompt: boolean;
  pendingTransferCount: number;
  
  // Actions
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => void;
  refreshUserStatus: () => void;
  completeOnboarding: () => void;
  dismissTransferPrompt: () => void;
  acceptTransfer: () => Promise<{ success: boolean; error?: string }>;
  declineTransfer: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      userStatus: {
        type: 'new' as UserType,
        showOnboarding: true,
        hasSavedDesigns: false,
        daysSinceLastVisit: null,
      },
      showTransferPrompt: false,
      pendingTransferCount: 0,

      // Set user directly
      setUser: (user) => {
        set({ 
          user, 
          isAuthenticated: !!user,
          isLoading: false,
        });
      },

      // Login action - check for anonymous designs to transfer
      login: (user) => {
        const hasAnonymous = hasAnonymousDesigns();
        const anonCount = getAnonymousDesignsCount();
        
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          showTransferPrompt: hasAnonymous,
          pendingTransferCount: anonCount,
        });
        
        // Record visit on login
        recordVisit();
      },

      // Logout action
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          showTransferPrompt: false,
          pendingTransferCount: 0,
        });
      },

      // Refresh user status from localStorage
      refreshUserStatus: () => {
        const status = detectUserStatus();
        set({ userStatus: status });
      },

      // Mark onboarding as completed
      completeOnboarding: () => {
        completeOnboarding();
        get().refreshUserStatus();
      },

      // Dismiss transfer prompt without action
      dismissTransferPrompt: () => {
        set({ showTransferPrompt: false });
      },

      // Accept transfer - move anonymous designs to account
      acceptTransfer: async () => {
        const { user } = get();
        if (!user) {
          return { success: false, error: 'No authenticated user' };
        }

        set({ isLoading: true });
        
        try {
          const { transferAnonymousDesigns } = await import('@/lib/anonymous-transfer');
          const result = await transferAnonymousDesigns(user.id);
          
          if (result.success) {
            set({
              showTransferPrompt: false,
              pendingTransferCount: 0,
              isLoading: false,
            });
            // Refresh status to reflect new designs count
            get().refreshUserStatus();
            return { success: true };
          } else {
            set({ isLoading: false });
            return { 
              success: false, 
              error: result.errors.join(', ') 
            };
          }
        } catch (error) {
          set({ isLoading: false });
          return { 
            success: false, 
            error: error instanceof Error ? error.message : 'Transfer failed' 
          };
        }
      },

      // Decline transfer - clear anonymous designs
      declineTransfer: () => {
        import('@/lib/anonymous-transfer').then(({ clearAnonymousDesigns }) => {
          clearAnonymousDesigns();
        });
        set({
          showTransferPrompt: false,
          pendingTransferCount: 0,
        });
      },
    }),
    {
      name: 'moatt-user-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated,
        // Don't persist transient UI states
      }),
    }
  )
);

// Initialize user status on client side
export function initializeUserStore(): void {
  if (typeof window === 'undefined') return;
  
  const store = useUserStore.getState();
  store.refreshUserStatus();
  recordVisit();
}
