'use client';

import React from 'react';
import { useEditorStore } from '@/stores';

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function ToolButton({ icon, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all duration-200 group relative ${
        active 
          ? 'bg-[#EA931D] text-white shadow-[0_0_20px_rgba(234,147,29,0.3)]' 
          : 'bg-[#1A1A1A] text-[#888] hover:bg-[#222] hover:text-white border border-white/5'
      }`}
      title={label}
    >
      {icon}
      {active && (
        <div className="absolute -right-1 -top-1 w-3 h-3 bg-white rounded-full border-2 border-[#EA931D]" />
      )}
    </button>
  );
}

export function ToolSidebar() {
  const { selectedTool, setTool, brushConfig, setBrushConfig } = useEditorStore();

  return (
    <div className="w-20 h-full bg-[#0F0F0F] border-r border-white/5 flex flex-col items-center py-6 gap-4 z-50">
      <div className="mb-6">
        <div className="w-10 h-10 bg-[#EA931D] rounded-xl flex items-center justify-center font-bold text-xl italic tracking-tighter">
          M
        </div>
      </div>

      <ToolButton
        label="Select & Orbit"
        active={selectedTool === 'select'}
        onClick={() => setTool('select')}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
          </svg>
        }
      />

      <div className="w-8 h-px bg-white/5 my-2" />

      <ToolButton
        label="Brush Tool"
        active={selectedTool === 'brush'}
        onClick={() => setTool('brush')}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
      />

      <ToolButton
        label="Eraser Tool"
        active={selectedTool === 'eraser'}
        onClick={() => setTool('eraser')}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        }
      />

      <ToolButton
        label="Shape Tool"
        active={selectedTool === 'shape'}
        onClick={() => setTool('shape')}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" />
          </svg>
        }
      />

      <div className="w-8 h-px bg-white/5 my-2" />

      <ToolButton
        label="Pen Tool"
        active={selectedTool === 'pen'}
        onClick={() => setTool('pen')}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        }
      />

      <div className="w-8 h-px bg-white/5 my-2" />

      {/* Decal Stamping Tool */}
      <div className="relative group">
        <ToolButton
          label="Decal Tool"
          active={selectedTool === 'decal'}
          onClick={() => {
            const input = document.getElementById('decal-upload') as HTMLInputElement;
            input?.click();
          }}
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <input 
          id="decal-upload"
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              const url = URL.createObjectURL(file);
              useEditorStore.getState().setDecal(url);
            }
          }}
        />
      </div>

      <div className="flex-1" />

      {/* History Controls */}
      <div className="flex flex-col gap-2 pb-6">
        <button 
          onClick={() => (window as any).gpuUndo?.()}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1A1A1A] hover:bg-[#222] text-[#888] hover:text-white border border-white/5 transition-all group"
          title="Undo (Cmd+Z)"
        >
          <svg className="w-5 h-5 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button 
          onClick={() => (window as any).gpuClear?.()}
          className="w-12 h-12 flex items-center justify-center rounded-xl bg-[#1A1A1A] hover:bg-red-500/10 text-[#888] hover:text-red-500 border border-white/5 transition-all group"
          title="Clear All"
        >
          <svg className="w-5 h-5 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
