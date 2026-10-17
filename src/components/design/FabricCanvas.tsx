'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/stores';

interface FabricCanvasProps {
  width?: number;
  height?: number;
  templateUrl?: string;
}

export function FabricCanvas({
  width = 2048,
  height = 2048,
  templateUrl = '/data/templates/shirt_uv.png' // Default template
}: FabricCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const { 
    brushConfig, 
    selectedTool,
    renderStage,
    setFinalTexture,
    fabricCanvasState,
    setFabricCanvasState
  } = useEditorStore();

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'white',
      isDrawingMode: selectedTool === 'brush' || selectedTool === 'eraser',
    });

    fabricRef.current = canvas;

    // Pro Upgrade: Advanced Brush Smoothing
    const brush = new fabric.PencilBrush(canvas);
    brush.color = brushConfig.color;
    brush.width = brushConfig.size;
    brush.decimate = 2; // High-end path simplification
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    canvas.freeDrawingBrush = brush;

    // Load existing state or default template
    if (fabricCanvasState) {
      canvas.loadFromJSON(fabricCanvasState, () => {
        canvas.renderAll();
      });
    } else {
      // Load Template Image or Draw Silhouette
      const actualTemplate = templateUrl.includes('shirt') ? '/templates/makehuman/female/shirt-template-simple.svg' : templateUrl;

      fabric.loadSVGFromURL(actualTemplate, (objects, options) => {
        if (!fabricRef.current) return;
        const obj = fabric.util.groupSVGElements(objects, options);
        obj.set({
          selectable: false,
          evented: false,
          opacity: 0.1,
        });
        canvas.add(obj);
        obj.center();
        obj.scaleToWidth(width * 0.8);
        canvas.renderAll();
      });

      // Pro: Draw Gown Fallback if needed
      if (templateUrl.includes('gown')) {
        const gown = new fabric.Path('M 500 100 L 700 100 L 850 800 L 350 800 Z', {
          fill: 'transparent',
          stroke: '#ccc',
          strokeWidth: 2,
          selectable: false,
          opacity: 0.2
        });
        canvas.add(gown);
        gown.center();
        gown.scaleToHeight(height * 0.8);
      }
    }

    // Sync state changes to store
    const syncState = () => {
      setFabricCanvasState(canvas.toJSON());
    };

    canvas.on('path:created', syncState);
    canvas.on('object:modified', syncState);
    canvas.on('object:added', syncState);
    canvas.on('object:removed', syncState);

    return () => {
      canvas.off('path:created', syncState);
      canvas.off('object:modified', syncState);
      canvas.off('object:added', syncState);
      canvas.off('object:removed', syncState);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [width, height, templateUrl]); // Do NOT include fabricCanvasState here to avoid infinite loops

  // Sync brush config and tool
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = selectedTool === 'brush' || selectedTool === 'eraser';

    if (canvas.freeDrawingBrush) {
      const brush = canvas.freeDrawingBrush as fabric.PencilBrush;
      brush.color = brushConfig.color;
      brush.width = brushConfig.size;

      if (selectedTool === 'eraser') {
        // @ts-ignore
        canvas.freeDrawingBrush.globalCompositeOperation = 'destination-out';
      } else {
        // @ts-ignore
        canvas.freeDrawingBrush.globalCompositeOperation = 'source-over';
      }
    }
  }, [brushConfig, selectedTool]);

  // Handle Manual Export on Stage Change
  useEffect(() => {
    if (renderStage === 2 && fabricRef.current) {
      const dataUrl = fabricRef.current.toDataURL({
        format: 'png',
        quality: 1,
      });
      setFinalTexture(dataUrl);
    }
  }, [renderStage, setFinalTexture]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-[#111] overflow-hidden p-8 relative">
      {/* Precision Guides (Rulers) */}
      <div className="absolute top-0 left-0 w-full h-6 bg-[#1A1A1A] border-b border-white/5 flex items-end px-8">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-l border-white/10 h-2 text-[8px] text-white/20 pl-1 uppercase font-bold tracking-tighter">
            {i * 10}%
          </div>
        ))}
      </div>
      <div className="absolute top-0 left-0 h-full w-6 bg-[#1A1A1A] border-r border-white/5 flex flex-col items-end py-8">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="flex-1 border-t border-white/10 w-2 text-[8px] text-white/20 pr-1 uppercase font-bold tracking-tighter [writing-mode:vertical-lr]">
            {i * 10}%
          </div>
        ))}
      </div>

      {/* The Workspace */}
      <div className="shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-white relative group" style={{ width: 'min(90%, 800px)', aspectRatio: '1/1' }}>
        {/* UV Grid Overlay (Visual Only) */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-10">
           <div className="w-full h-full bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </div>
  );
}
