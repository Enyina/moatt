'use client';

import React from 'react';
import { MannequinViewer } from './three/MannequinViewer';
import { BODY_TYPE_CONFIGS } from '@/lib/models';

interface BodyTypePreviewProps {
  bodyTypeId: string;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
}

export function BodyTypePreview({ bodyTypeId, onSelect, isSelected }: BodyTypePreviewProps) {
  const config = BODY_TYPE_CONFIGS[bodyTypeId];
  
  if (!config) return null;

  return (
    <div 
      className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        isSelected ? 'border-[#EA931D] bg-[#EA931D]/10' : 'border-white/10 bg-white/5 hover:border-white/30'
      }`}
      onClick={() => onSelect?.(bodyTypeId)}
    >
      <div className="aspect-[3/4] w-full relative">
        <MannequinViewer 
          bodyTypeId={bodyTypeId}
          poseId="standing-default"
          className="w-full h-full pointer-events-none" // Disable interaction for preview
        />
        
        {/* Hover info */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-medium text-sm">{config.name}</p>
          <p className="text-white/60 text-xs line-clamp-1">{config.description}</p>
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 w-6 h-6 bg-[#EA931D] rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )}
    </div>
  );
}

export function BodyTypeSelector() {
  // This can be a separate component that uses BodyTypePreview in a grid
  return null; 
}
