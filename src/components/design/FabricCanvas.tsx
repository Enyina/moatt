'use client';

import { useEffect, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/stores';

interface FabricCanvasProps {
  onTextureUpdate: (dataUrl: string) => void;
  width?: number;
  height?: number;
}

export function FabricCanvas({
  onTextureUpdate,
  width = 2048,
  height = 2048
}: FabricCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  const { 
    brushConfig, 
    lastUV, 
    selectedTool, 
    shapeStartUV, 
    shapePreviewUV 
  } = useEditorStore();

  // Initialize Canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: 'transparent',
      isDrawingMode: true,
    });

    fabricRef.current = canvas;

    // Ensure brush is properly initialized
    canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);

    // Configure brush
    const brush = canvas.freeDrawingBrush as fabric.PencilBrush;
    brush.color = brushConfig.color;
    brush.width = brushConfig.size;

    // Update texture on changes
    const updateTexture = () => {
      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
      });
      onTextureUpdate(dataUrl);
    };

    canvas.on('mouse:up', updateTexture);
    canvas.on('object:modified', updateTexture);
    canvas.on('object:added', updateTexture);

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [width, height, onTextureUpdate]);

  // Sync brush config and tool
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Wait a tick for brush to be initialized
    const timeoutId = setTimeout(() => {
      if (!canvas.freeDrawingBrush) {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      }

      const brush = canvas.freeDrawingBrush as fabric.PencilBrush;
      if (brush) {
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
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [brushConfig, selectedTool]);

  // Handle 3D Raycasting (Painting from 3D View)
  const lastPointRef = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !lastUV) return;

    const { uv, isFirst, isEnd } = lastUV;
    const x = uv.x * width;
    const y = (1 - uv.y) * height;

    const brush = canvas.freeDrawingBrush;
    if (!brush) return;

    if (isFirst) {
      // @ts-ignore
      brush.onMouseDown({ x, y }, { e: {} });
      lastPointRef.current = { x, y };
    } else if (isEnd) {
      if (lastPointRef.current) {
        // @ts-ignore
        brush.onMouseMove({ x, y }, { e: {} });
      }
      // @ts-ignore
      brush.onMouseUp({ e: {} });
      lastPointRef.current = null;
      
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1 });
      onTextureUpdate(dataUrl);
    } else {
      if (lastPointRef.current) {
        const prev = lastPointRef.current;
        const dist = Math.sqrt(Math.pow(x - prev.x, 2) + Math.pow(y - prev.y, 2));
        
        if (dist > 10) {
          const steps = 5;
          for (let i = 1; i < steps; i++) {
            const ix = prev.x + (x - prev.x) * (i / steps);
            const iy = prev.y + (y - prev.y) * (i / steps);
            // @ts-ignore
            brush.onMouseMove({ x: ix, y: iy }, { e: {} });
          }
        }
      }

      // @ts-ignore
      brush.onMouseMove({ x, y }, { e: {} });
      lastPointRef.current = { x, y };
      
      const dataUrl = canvas.toDataURL({ format: 'png', quality: 0.5 });
      onTextureUpdate(dataUrl);
    }
  }, [lastUV, width, height, onTextureUpdate]);

  // Handle Shape Creation
  const shapePreviewRef = useRef<fabric.Object | null>(null);

  const isPainting = useEditorStore(state => state.isPainting);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    if (selectedTool !== 'shape') {
      if (shapePreviewRef.current) {
        canvas.remove(shapePreviewRef.current);
        shapePreviewRef.current = null;
      }
      return;
    }

    if (isPainting && shapeStartUV && shapePreviewUV) {
      const startX = shapeStartUV.x * width;
      const startY = (1 - shapeStartUV.y) * height;
      const endX = shapePreviewUV.x * width;
      const endY = (1 - shapePreviewUV.y) * height;

      if (!shapePreviewRef.current) {
        const rect = new fabric.Rect({
          left: Math.min(startX, endX),
          top: Math.min(startY, endY),
          width: Math.abs(endX - startX),
          height: Math.abs(endY - startY),
          fill: 'transparent',
          stroke: '#EA931D',
          strokeWidth: 4,
          selectable: false,
          strokeDashArray: [10, 5]
        });
        canvas.add(rect);
        shapePreviewRef.current = rect;
      } else {
        const rect = shapePreviewRef.current as fabric.Rect;
        rect.set({
          left: Math.min(startX, endX),
          top: Math.min(startY, endY),
          width: Math.abs(endX - startX),
          height: Math.abs(endY - startY)
        });
        canvas.renderAll();
      }
    } else if (!isPainting && shapePreviewRef.current) {
      const rect = shapePreviewRef.current as fabric.Rect;
      rect.set({ 
        selectable: true,
        strokeDashArray: [], 
        strokeWidth: 2,
        stroke: brushConfig.color
      });
      shapePreviewRef.current = null;
      
      const dataUrl = canvas.toDataURL({ format: 'png' });
      onTextureUpdate(dataUrl);
    }
  }, [shapeStartUV, shapePreviewUV, isPainting, selectedTool, brushConfig, width, height, onTextureUpdate]);

  return (
    <div ref={containerRef} className="hidden pointer-events-none">
      <canvas ref={canvasRef} />
    </div>
  );
}
