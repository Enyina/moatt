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
      className={`relative flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-200 group ${
        active 
          ? 'border-[#EA931D]/70 bg-[#EA931D] text-white shadow-[0_0_24px_rgba(234,147,29,0.28)]'
          : 'border-white/10 bg-white/[0.045] text-white/35 hover:border-white/20 hover:bg-white/[0.075] hover:text-white'
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
  const {
    selectedTool,
    setTool,
    configView,
    setInteractionMode,
    setDecal,
    activeDecalUrl
  } = useEditorStore();

  // For Phase 1 validation, we'll assume we're in the new system
  const isNewStudio = true;


  return (
    <div className="z-50 flex h-full w-20 flex-col items-center gap-4 border-r border-white/10 bg-[var(--background)]/95 py-6 shadow-[8px_0_30px_rgba(0,0,0,0.16)] backdrop-blur-xl">
      <div className="mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EA931D] text-xl font-bold italic tracking-tighter text-white shadow-[0_10px_24px_rgba(234,147,29,0.24)]">
          M
        </div>
      </div>

      {/* 1. Orbit & Select Mode */}
      <ToolButton
        label="Orbit & Select"
        active={configView.mode === 'edit' && !activeDecalUrl}
        onClick={() => {
          setInteractionMode('edit');
          setDecal(null);
        }}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
          </svg>
        }
      />

      <div className="w-8 h-px bg-white/5 my-2" />

      {/* 2. Decal Stamping Mode */}
      <div className="relative group">
        <ToolButton
          label="Add Graphic (Decal)"
          active={!!activeDecalUrl}
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
              setDecal(url);
              setInteractionMode('edit');
            }
          }}
        />
        {activeDecalUrl && (
          <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-[var(--background)] bg-[#EA931D] text-[10px] font-bold text-white">
            +
          </div>
        )}
      </div>

      <div className="w-8 h-px bg-white/5 my-2" />

      {/* 3. Preview Mode Toggle */}
      <ToolButton
        label="Cinematic Preview (Space)"
        active={configView.mode === 'preview'}
        onClick={() => setInteractionMode(configView.mode === 'preview' ? 'edit' : 'preview')}
        icon={
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        }
      />


      <div className="flex-1" />

      {/* History Controls */}
      <div className="flex flex-col gap-2 pb-6">
        <button 
          onClick={() => (window as any).gpuUndo?.()}
          className="group flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-white/35 transition-all hover:border-white/20 hover:bg-white/[0.075] hover:text-white"
          title="Undo (Cmd+Z)"
        >
          <svg className="w-5 h-5 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button 
          onClick={() => (window as any).gpuClear?.()}
          className="group flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.045] text-white/35 transition-all hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
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
