import React, { useCallback, useEffect, useState } from 'react';
import { useGarmentStore, GARMENT_PRESETS } from '@/stores/garmentStore';

function formatLabel(key: string) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

export function GarmentControlsPanel() {
  const activeGarment = useGarmentStore(state => state.activeGarment);
  const updateGarmentParams = useGarmentStore(state => state.updateGarmentParams);
  const applyPreset = useGarmentStore(state => state.applyPreset);

  // Local state for debouncing
  const [localParams, setLocalParams] = useState(activeGarment?.params || {});

  useEffect(() => {
    if (activeGarment) {
      setLocalParams(activeGarment.params || {});
    }
  }, [activeGarment?.type, activeGarment?.params]);

  const handleSliderChange = useCallback((key: string, value: number) => {
    setLocalParams(prev => ({ ...(prev || {}), [key]: value }));
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      updateGarmentParams(localParams);
    }, 75); // 75ms debounce as requested

    return () => clearTimeout(handler);
  }, [localParams, updateGarmentParams]);

  if (!activeGarment?.params) {
    return (
      <div className="rounded-xl border border-white/10 p-4 text-xs text-white/60">
        No parametric controls available for this garment yet.
      </div>
    );
  }

  const presets = GARMENT_PRESETS[activeGarment.type as keyof typeof GARMENT_PRESETS] ?? {};
  const paramEntries = Object.entries(localParams ?? {});

  if (paramEntries.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 p-4 text-xs text-white/60">
        No parametric controls available for this garment yet.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="space-y-3">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35">Presets</h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(presets).length > 0 ? (
            Object.entries(presets).map(([name, presetParams]) => (
              <button
                key={name}
                onClick={() => {
                  applyPreset(presetParams as any);
                  setLocalParams(presetParams);
                }}
                className="rounded-md border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold capitalize transition-all hover:border-white/20 hover:text-white text-white/50"
              >
                {name}
              </button>
            ))
          ) : (
            <p className="text-xs text-white/35">No presets available for this garment yet.</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/35">Parameters</h3>
        
        {paramEntries.map(([key, value]) => {
          // Define sensible limits
          let min = 0.1;
          let max = 2.0;
          let step = 0.01;

          if (key === 'thickness') {
            min = 0.01;
            max = 0.1;
          } else if (key.includes('Radius')) {
            min = 0.02;
            max = 0.4;
          } else if (key.includes('Length') || key.includes('Width') || key.includes('Height') || key.includes('Depth')) {
            min = 0.1;
            max = 1.5;
          } else if (key === 'looseness') {
            min = 0.8;
            max = 1.6;
          }

          return (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-[10px] font-bold uppercase text-white/40">{formatLabel(key)}</label>
                <span className="text-[10px] text-white/80 tabular-nums">{(value as number).toFixed(2)}</span>
              </div>
              <input 
                type="range" 
                min={min} 
                max={max} 
                step={step} 
                value={value as number}
                onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
                className="w-full accent-[#EA931D]"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
