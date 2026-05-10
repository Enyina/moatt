/**
 * Anonymous design persistence and account transfer utilities
 * Handles saving designs for non-authenticated users and transferring on signup
 */

import { updateDesignsCount } from './user-detection';

export interface AnonymousDesign {
  id: string;
  name: string;
  templateId: string;
  templateCategory: string;
  thumbnailDataUrl: string | null;
  designData: {
    brushStrokes: BrushStroke[];
    appliedTextures: AppliedTexture[];
    colorPalette: string[];
  };
  createdAt: number;
  updatedAt: number;
}

export interface BrushStroke {
  id: string;
  points: { x: number; y: number; pressure?: number }[];
  color: string;
  size: number;
  opacity: number;
  timestamp: number;
}

export interface AppliedTexture {
  id: string;
  wardrobeItemId: string;
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  timestamp: number;
}

const STORAGE_KEY = 'moatt_anonymous_designs';
const MAX_ANONYMOUS_DESIGNS = 5;

/**
 * Save a design to anonymous storage
 * Limited to MAX_ANONYMOUS_DESIGNS most recent designs
 */
export function saveAnonymousDesign(design: Omit<AnonymousDesign, 'id' | 'createdAt' | 'updatedAt'>): string {
  if (typeof window === 'undefined') {
    throw new Error('Cannot save anonymous design on server');
  }

  const existing = getAnonymousDesigns();
  
  const newDesign: AnonymousDesign = {
    ...design,
    id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  // Add new design, keep only the most recent MAX_ANONYMOUS_DESIGNS
  const updated = [...existing, newDesign].slice(-MAX_ANONYMOUS_DESIGNS);
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  
  // Update designs count for returning user detection
  updateDesignsCount(updated.length);
  
  return newDesign.id;
}

/**
 * Get all anonymous designs
 */
export function getAnonymousDesigns(): AnonymousDesign[] {
  if (typeof window === 'undefined') return [];
  
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Update an existing anonymous design
 */
export function updateAnonymousDesign(
  designId: string, 
  updates: Partial<Omit<AnonymousDesign, 'id' | 'createdAt'>>
): boolean {
  if (typeof window === 'undefined') return false;
  
  const designs = getAnonymousDesigns();
  const index = designs.findIndex(d => d.id === designId);
  
  if (index === -1) return false;
  
  designs[index] = {
    ...designs[index],
    ...updates,
    updatedAt: Date.now(),
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  return true;
}

/**
 * Delete an anonymous design
 */
export function deleteAnonymousDesign(designId: string): boolean {
  if (typeof window === 'undefined') return false;
  
  const designs = getAnonymousDesigns();
  const filtered = designs.filter(d => d.id !== designId);
  
  if (filtered.length === designs.length) return false;
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  updateDesignsCount(filtered.length);
  
  return true;
}

/**
 * Transfer anonymous designs to authenticated account
 * Called after successful signup/login
 */
export async function transferAnonymousDesigns(userId: string): Promise<{
  success: boolean;
  transferredCount: number;
  errors: string[];
}> {
  const anonDesigns = getAnonymousDesigns();
  
  if (anonDesigns.length === 0) {
    return { success: true, transferredCount: 0, errors: [] };
  }
  
  const errors: string[] = [];
  let transferredCount = 0;
  
  try {
    // Batch transfer to backend
    const response = await fetch('/api/designs/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        designs: anonDesigns.map(d => ({
          name: d.name,
          templateId: d.templateId,
          templateCategory: d.templateCategory,
          thumbnailDataUrl: d.thumbnailDataUrl,
          designData: d.designData,
          createdAt: d.createdAt,
        })),
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Transfer failed: ${error}`);
    }
    
    const result = await response.json();
    transferredCount = result.transferredCount || anonDesigns.length;
    
    // Clear local storage after successful transfer
    localStorage.removeItem(STORAGE_KEY);
    
    // Update designs count to reflect server-side count
    // (The server should return the actual count)
    if (result.totalDesigns) {
      updateDesignsCount(result.totalDesigns);
    }
    
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error');
  }
  
  return {
    success: errors.length === 0,
    transferredCount,
    errors,
  };
}

/**
 * Check if transfer prompt should be shown
 * (User has anonymous designs and just authenticated)
 */
export function shouldShowTransferPrompt(): boolean {
  return getAnonymousDesigns().length > 0;
}

/**
 * Get transfer preview data for UI
 */
export function getTransferPreview(): {
  count: number;
  designs: { name: string; thumbnail: string | null; createdAt: number }[];
} {
  const designs = getAnonymousDesigns();
  return {
    count: designs.length,
    designs: designs.map(d => ({
      name: d.name,
      thumbnail: d.thumbnailDataUrl,
      createdAt: d.createdAt,
    })),
  };
}

/**
 * Clear all anonymous designs (user declined transfer)
 */
export function clearAnonymousDesigns(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
