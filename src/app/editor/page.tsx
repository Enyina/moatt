'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { PivotAIDesigner } from '@/components/pivot/PivotAIDesigner';

// Dynamically import the Configurator to avoid SSR issues with Three.js
const Configurator = dynamic(() => import('@/components/pivot/Configurator'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#EA931D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#A0A0B0] font-mono text-sm tracking-widest">INITIALIZING PIVOT_ENGINE...</p>
      </div>
    </div>
  ),
});

export default function EditorPage() {
  return (
    <main className="w-full h-screen overflow-hidden">
      <Suspense fallback={null}>
        <Configurator />
      </Suspense>

      <PivotAIDesigner />

      {/* Minimal Header */}
      <div className="absolute top-6 left-8 z-10 flex items-center gap-3 pointer-events-none">
        <div className="w-2 h-2 bg-[#EA931D] rounded-full animate-pulse" />
        <h1 className="text-white font-black text-xl tracking-tighter uppercase">
          Moatt <span className="text-[#EA931D]">Pivot</span>
        </h1>
      </div>

      {/* Quick Action Bar (No-Code Style) */}
      <div className="absolute top-6 right-8 z-10 flex gap-2">
        <button className="px-4 py-2 bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 rounded-full text-white text-xs font-bold transition-all">
          EXPORT
        </button>
        <button className="px-4 py-2 bg-[#EA931D] text-black font-bold rounded-full text-xs hover:scale-105 transition-all">
          SHARE
        </button>
      </div>
    </main>
  );
}
