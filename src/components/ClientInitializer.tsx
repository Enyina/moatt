'use client';

import { useEffect } from 'react';
import { initializeUserStore, initializeTheme } from '@/stores';

/**
 * ClientInitializer - Handles client-side store initialization
 * Must be used within the body of the root layout
 */
export function ClientInitializer() {
  useEffect(() => {
    // Initialize user status (new vs returning detection)
    initializeUserStore();
    
    // Initialize theme
    initializeTheme();
  }, []);

  return null;
}
