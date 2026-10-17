'use client';

import { useState, useEffect } from 'react';
import { usePivotStore } from '@/stores/pivotStore';

export function PivotAIDesigner() {
  const activePart = usePivotStore(state => state.activePart);
  const setPartTexture = usePivotStore(state => state.setPartTexture);
  
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (taskId && isGenerating) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/ai?provider=meshy&taskId=${taskId}`);
          const data = await res.json();

          if (data.status === 'SUCCEEDED' || data.status === 'COMPLETED') {
            setIsGenerating(false);
            setTaskId(null);
            setProgress(100);
            
            setPartTexture(activePart || 'torso', data.result.base_color);
          } else if (data.status === 'FAILED') {
            setIsGenerating(false);
            setTaskId(null);
            alert('Generation failed');
          } else if (data.progress) {
            setProgress(data.progress);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [taskId, isGenerating, activePart, setPartTexture]);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setProgress(0);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'meshy',
          type: 'texture',
          prompt,
        }),
      });

      const data = await res.json();
      if (data.result || data.id) {
        setTaskId(data.result || data.id);
      } else {
        throw new Error('Failed to start generation');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to start generation');
      setIsGenerating(false);
    }
  };

  return (
    <div className="absolute top-24 left-8 z-20 w-64 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 bg-[#EA931D] rounded-full" />
        <h3 className="text-white font-bold text-xs uppercase tracking-widest">AI Material Studio</h3>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="e.g. Vintage floral silk..."
        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-[#EA931D] transition-colors min-h-[80px]"
      />

      <button
        onClick={handleGenerate}
        disabled={isGenerating || !prompt}
        className="w-full mt-3 py-2 bg-[#EA931D] text-black font-bold text-xs rounded-xl hover:bg-[#F5A623] transition-all disabled:opacity-50"
      >
        {isGenerating ? `Generating (${progress}%)...` : 'Generate Texture'}
      </button>

      {activePart && (
        <p className="mt-2 text-[10px] text-white/40 text-center italic">
          Applying to: {activePart}
        </p>
      )}
    </div>
  );
}
