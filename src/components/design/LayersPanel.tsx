'use client';

import React from 'react';
import { useEditorStore } from '@/stores';
import { ClothingLayer } from '@/lib/types';

export function LayersPanel() {
  const { layers, activeLayerId, setActiveLayer, updateLayer, removeLayer, addLayer } = useEditorStore();

  return (
    <div className="w-64 bg-[#111111]/95 border-l border-white/5 flex flex-col h-full z-40">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Layers</h3>
        <button 
          onClick={() => addLayer({ name: `Layer ${layers.length + 1}`, type: 'paint' })}
          className="text-[#EA931D] hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
        {[...layers].reverse().map((layer) => (
          <div 
            key={layer.id}
            onClick={() => setActiveLayer(layer.id)}
            className={`group flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer ${
              activeLayerId === layer.id 
                ? 'bg-[#EA931D] text-black shadow-lg' 
                : 'bg-white/5 text-[#888] hover:bg-white/10'
            }`}
          >
            {/* Visibility Toggle */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                updateLayer(layer.id, { visible: !layer.visible });
              }}
              className={`p-1 hover:bg-black/10 rounded transition-colors ${
                activeLayerId === layer.id ? 'text-black' : 'text-[#555] hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {layer.visible ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7 1.274-4.057 5.064-7 9.542-7 1.225 0 2.391.272 3.438.756M15 12a3 3 0 11-6 0 3 3 0 016 0zm6.364 1.364l-1.414-1.414m-4.95-4.95l-1.414-1.414" />
                )}
              </svg>
            </button>

            {/* Layer Icon based on type */}
            <div className="flex-shrink-0">
              {layer.type === 'paint' ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </div>

            <div className="flex-1 overflow-hidden">
              <span className={`text-xs font-bold truncate block ${activeLayerId === layer.id ? 'text-black' : 'text-white'}`}>
                {layer.name}
              </span>
              <span className={`text-[10px] block ${activeLayerId === layer.id ? 'text-black/60' : 'text-[#666]'}`}>
                {layer.opacity * 100}% • {layer.blendMode}
              </span>
            </div>

            {/* Delete Button (only if not base) */}
            {layer.id !== 'base-fabric' && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeLayer(layer.id);
                }}
                className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-black/10 rounded transition-all ${
                  activeLayerId === layer.id ? 'text-black' : 'text-red-500'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Layer Opacity Slider */}
      {activeLayerId && (
        <div className="p-4 border-t border-white/5 bg-black/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[#888] uppercase font-bold">Opacity</span>
            <span className="text-xs text-white">{Math.round((layers.find(l => l.id === activeLayerId)?.opacity || 1) * 100)}%</span>
          </div>
          <input 
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={layers.find(l => l.id === activeLayerId)?.opacity || 1}
            onChange={(e) => updateLayer(activeLayerId, { opacity: parseFloat(e.target.value) })}
            className="w-full accent-[#EA931D]"
          />
        </div>
      )}
    </div>
  );
}
