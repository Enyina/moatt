'use client';

import { useState, useEffect } from 'react';
import { useEditorStore } from '@/stores';

interface AIDesignerProps {
  onTextureGenerated: (url: string) => void;
  onModelGenerated: (url: string) => void;
}

export function AIDesigner({ onTextureGenerated, onModelGenerated }: AIDesignerProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [provider, setProvider] = useState<'meshy' | 'tripo'>('meshy');
  const [progress, setProgress] = useState(0);

  // Poll for status if we have a taskId
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (taskId && isGenerating) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/ai?provider=${provider}&taskId=${taskId}`);
          const data = await res.json();

          if (data.status === 'SUCCEEDED' || data.status === 'COMPLETED') {
            setIsGenerating(false);
            setTaskId(null);
            setProgress(100);
            
            if (provider === 'meshy') {
              onTextureGenerated(data.result.base_color);
            } else {
              onModelGenerated(data.result.model_url);
            }
          } else if (data.status === 'FAILED') {
            setIsGenerating(false);
            setTaskId(null);
            alert('Generation failed: ' + (data.error || 'Unknown error'));
          } else if (data.progress) {
            setProgress(data.progress);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [taskId, isGenerating, provider, onTextureGenerated, onModelGenerated]);

  const handleGenerate = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    setProgress(0);

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          type: provider === 'meshy' ? 'texture' : 'task',
          prompt,
        }),
      });

      const data = await res.json();
      if (data.result) {
        setTaskId(data.result);
      } else if (data.id) {
        setTaskId(data.id);
      } else {
        throw new Error(data.error || 'Failed to start generation');
      }
    } catch (err: any) {
      alert(err.message);
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 bg-[#1A1A2E] rounded-lg border border-white/5">
      <h3 className="text-[#EA931D] font-bold mb-3 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        AI Studio
      </h3>

      <div className="space-y-4">
        {/* Provider Toggle */}
        <div className="flex bg-[#0E0E0E] rounded-lg p-1 text-xs">
          <button
            onClick={() => setProvider('meshy')}
            className={`flex-1 py-1.5 rounded ${provider === 'meshy' ? 'bg-[#EA931D] text-black' : 'text-[#A0A0B0]'}`}
          >
            Texture (Meshy)
          </button>
          <button
            onClick={() => setProvider('tripo')}
            className={`flex-1 py-1.5 rounded ${provider === 'tripo' ? 'bg-[#EA931D] text-black' : 'text-[#A0A0B0]'}`}
          >
            Garment (Tripo)
          </button>
        </div>

        <div>
          <label className="text-xs text-[#A0A0B0] block mb-1">
            {provider === 'meshy' ? 'Describe the pattern/material' : 'Describe the clothing item'}
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={provider === 'meshy' ? 'e.g. Blue silk with gold floral embroidery' : 'e.g. A futuristic leather jacket with neon pipes'}
            className="w-full bg-[#0E0E0E] text-white border border-white/10 rounded-lg p-2 text-sm focus:ring-1 focus:ring-[#EA931D] outline-none min-h-[80px]"
            disabled={isGenerating}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt}
          className={`w-full py-2 rounded-lg font-bold transition-all ${
            isGenerating 
              ? 'bg-white/10 text-white/50 cursor-not-allowed' 
              : 'bg-[#EA931D] text-black hover:scale-[1.02] active:scale-[0.98]'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Generating ({progress}%)
            </span>
          ) : (
            'Generate with AI'
          )}
        </button>

        {isGenerating && (
          <p className="text-[10px] text-[#A0A0B0] text-center">
            AI generation usually takes 30-60 seconds.
          </p>
        )}
      </div>
    </div>
  );
}
