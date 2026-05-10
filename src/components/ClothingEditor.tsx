'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { fabric } from 'fabric';
import { useEditorStore } from '@/stores';

interface ClothingEditorProps {
  templateUrl: string;
  backgroundUrl?: string; // optional preset material image
  onExport: (dataUrl: string) => void;
  onAutoSave?: (dataUrl: string) => void; // For auto-save
  width?: number;
  height?: number;
  autoPreviewDelay?: number; // ms before auto-export
}

export function ClothingEditor({
  templateUrl,
  onExport,
  onAutoSave,
  width = 2048,
  height = 2048,
  autoPreviewDelay = 500, // 500ms debounce
}: ClothingEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const { brushConfig, setBrushConfig } = useEditorStore();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastExportRef = useRef<string>('');

  // Initialize Fabric canvas
  useEffect(() => {
    console.log('[ClothingEditor] useEffect triggered - canvasRef:', !!canvasRef.current, 'templateUrl:', templateUrl);

    // Early return if canvas ref is not available
    if (!canvasRef.current) {
      console.log('[ClothingEditor] No canvas ref, returning');
      return;
    }

    // Create Fabric canvas
    console.log('[ClothingEditor] Creating Fabric canvas...');
    const canvas = new fabric.Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#f0f0f0',
      isDrawingMode: true,
    });

    fabricRef.current = canvas;
    console.log('[ClothingEditor] Fabric canvas created');

    // Configure brush
    const brush = canvas.freeDrawingBrush as fabric.PencilBrush;
    brush.color = brushConfig.color;
    brush.width = brushConfig.size;

    // Load template image as background with fallback
    let loaded = false;
    const loadTemplate = () => {
      fabric.Image.fromURL(templateUrl, (img) => {
        if (!img.width || !img.height) {
          console.warn('Template failed to load, using fallback');
          createFallbackTemplate(canvas);
          return;
        }

        img.set({
          selectable: false,
          evented: false,
          opacity: 0.3,
        });
        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
          scaleX: width / img.width!,
          scaleY: height / img.height!,
        });
        loaded = true;
        setIsLoading(false);
      }, {
        crossOrigin: 'anonymous'
      });
    };

    console.log('[ClothingEditor] Starting template load:', templateUrl);

    // Timeout fallback if loading takes too long
    const timeoutId = setTimeout(() => {
      if (!loaded) {
        console.warn('[ClothingEditor] Template loading timeout, using fallback');
        loaded = true;
        createFallbackTemplate(canvas);
      }
    }, 2000);

    // Try to load, fallback if fails
    try {
      loadTemplate();
    } catch (err) {
      console.error('[ClothingEditor] Template load error:', err);
      loaded = true;
      clearTimeout(timeoutId);
      createFallbackTemplate(canvas);
    }

    // AUTO-PREVIEW: Listen for drawing events
    canvas.on('mouse:down', () => {
      setIsDrawing(true);
    });

    canvas.on('mouse:up', () => {
      setIsDrawing(false);
      triggerAutoExport();
    });

    // Also trigger on object modifications
    canvas.on('object:modified', () => {
      triggerAutoExport();
    });

    canvas.on('object:added', () => {
      triggerAutoExport();
    });

    return () => {
      clearTimeout(timeoutId);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [width, height]); // Removed templateUrl from deps to prevent re-init on template change (handle via clear/reload)

  // Fallback template creator (draws a simple shirt outline)
  const createFallbackTemplate = (canvas: fabric.Canvas) => {
    console.log('[ClothingEditor] Creating fallback template');
    const centerX = width / 2;
    const centerY = height / 2;

    // Shirt outline group
    const shirtGroup = new fabric.Group([
      // Front panel
      new fabric.Rect({
        left: centerX - 200,
        top: centerY - 250,
        width: 400,
        height: 500,
        fill: 'transparent',
        stroke: '#999',
        strokeWidth: 3,
        strokeDashArray: [10, 10],
      }),
      // Label
      new fabric.Text('SHIRT TEMPLATE (FRONT)', {
        left: centerX,
        top: centerY + 280,
        fontSize: 36,
        fill: '#999',
        textAlign: 'center',
        originX: 'center',
      }),
    ], {
      selectable: false,
      evented: false,
    });

    canvas.add(shirtGroup);
    canvas.renderAll();
    setIsLoading(false); // CRITICAL: Stop loading spinner
  };

  // Debounced auto-export function
  const triggerAutoExport = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const canvas = fabricRef.current;
      if (!canvas) return;

      // Get current design without background
      const bgImage = canvas.backgroundImage;
      canvas.setBackgroundImage(null as any, canvas.renderAll.bind(canvas));

      const dataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });

      // Restore background
      if (bgImage) {
        canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
      }

      // Only export if changed
      if (dataUrl !== lastExportRef.current) {
        lastExportRef.current = dataUrl;
        onAutoSave?.(dataUrl);
      }
    }, autoPreviewDelay);
  }, [autoPreviewDelay, onAutoSave]);

  // Update brush when config changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const brush = canvas.freeDrawingBrush as fabric.PencilBrush;
    if (brush) {
      brush.color = brushConfig.color;
      brush.width = brushConfig.size;
    }
  }, [brushConfig]);

  // SYNC: Listen for 3D clicks/moves from the model viewer
  const lastUV = useEditorStore(state => state.lastUV);
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !lastUV) return;

    const { uv, isFirst } = lastUV;

    // Map UV (0-1) to Canvas pixels (0-2048)
    // NOTE: Texture mapping might need flipping if UVs don't match exactly
    const x = uv.x * width;
    const y = (1 - uv.y) * height; // Fabric.js (0,0) is top-left, 3D UV (0,0) is bottom-left usually

    if (isFirst) {
      // Start a new path manually
      (canvas.freeDrawingBrush as any).onMouseDown({ x, y }, { e: {} });
    } else {
      // Continue the path
      (canvas.freeDrawingBrush as any).onMouseMove({ x, y }, { e: {} });
    }

    // Trigger preview update after a short delay if we stop
    if (!isFirst) {
      triggerAutoExport();
    }

    // If it was the last point (conceptually), we'd call onMouseUp, 
    // but since we don't have isLast, we'll just let the debounced export handle it.
  }, [lastUV, width, height, triggerAutoExport]);

  // Handle template changes separately to avoid canvas re-init
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !templateUrl) return;

    console.log('[ClothingEditor] Template URL changed, reloading background:', templateUrl);
    setIsLoading(true);

    fabric.Image.fromURL(templateUrl, (img) => {
      img.set({
        selectable: false,
        evented: false,
        opacity: 0.3,
      });
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas), {
        scaleX: width / img.width!,
        scaleY: height / img.height!,
      });
      setIsLoading(false);
    }, {
      crossOrigin: 'anonymous'
    });
  }, [templateUrl, width, height]);

  // Export function
  const handleExport = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Temporarily hide background template for export
    const bgImage = canvas.backgroundImage;
    canvas.setBackgroundImage(null as any, canvas.renderAll.bind(canvas));

    // Export with transparent background
    const dataUrl = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1,
    });

    // Restore background
    if (bgImage) {
      canvas.setBackgroundImage(bgImage, canvas.renderAll.bind(canvas));
    }

    onExport(dataUrl);
  }, [onExport]);

  // Undo function
  const handleUndo = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const objects = canvas.getObjects();
    if (objects.length > 0) {
      const lastObject = objects[objects.length - 1];
      canvas.remove(lastObject);
      canvas.renderAll();
      triggerAutoExport();
    }
  }, [triggerAutoExport]);

  // Clear canvas
  const handleClear = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Remove all objects except background
    const objects = canvas.getObjects();
    objects.forEach(obj => {
      if (obj !== canvas.backgroundImage) {
        canvas.remove(obj);
      }
    });

    canvas.renderAll();
    triggerAutoExport();
  }, [triggerAutoExport]);

  // Toggle drawing mode
  const setDrawingMode = useCallback((isDrawing: boolean) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.isDrawingMode = isDrawing;
  }, []);

  // Add shape
  const addShape = useCallback((type: 'rect' | 'circle') => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;

    let shape: fabric.Object;
    if (type === 'rect') {
      shape = new fabric.Rect({
        left: width / 2 - 50,
        top: height / 2 - 50,
        width: 100,
        height: 100,
        fill: brushConfig.color,
        opacity: brushConfig.opacity / 100,
      });
    } else {
      shape = new fabric.Circle({
        left: width / 2 - 50,
        top: height / 2 - 50,
        radius: 50,
        fill: brushConfig.color,
        opacity: brushConfig.opacity / 100,
      });
    }

    canvas.add(shape);
    canvas.setActiveObject(shape);
    canvas.renderAll();
    triggerAutoExport();
  }, [brushConfig.color, brushConfig.opacity, width, height, triggerAutoExport]);

  // Add text
  const addText = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    canvas.isDrawingMode = false;

    const text = new fabric.Text('Your Text', {
      left: width / 2,
      top: height / 2,
      fill: brushConfig.color,
      fontSize: 40,
      fontFamily: 'Arial',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    triggerAutoExport();
  }, [brushConfig.color, width, height, triggerAutoExport]);

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-[#1A1A2E] rounded-lg">
        {/* Drawing Mode Toggle */}
        <button
          onClick={() => setDrawingMode(true)}
          className="p-2 rounded hover:bg-white/10 text-white"
          title="Brush"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>

        <button
          onClick={() => setDrawingMode(false)}
          className="p-2 rounded hover:bg-white/10 text-white"
          title="Select"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/20 mx-2" />

        {/* Shapes */}
        <button
          onClick={() => addShape('rect')}
          className="p-2 rounded hover:bg-white/10 text-white"
          title="Rectangle"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth={2} />
          </svg>
        </button>

        <button
          onClick={() => addShape('circle')}
          className="p-2 rounded hover:bg-white/10 text-white"
          title="Circle"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="9" strokeWidth={2} />
          </svg>
        </button>

        <button
          onClick={addText}
          className="p-2 rounded hover:bg-white/10 text-white"
          title="Text"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        <div className="w-px h-6 bg-white/20 mx-2" />

        {/* Actions */}
        <button
          onClick={handleUndo}
          className="p-2 rounded hover:bg-white/10 text-white"
          title="Undo"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>

        <button
          onClick={handleClear}
          className="p-2 rounded hover:bg-red-500/20 text-red-400"
          title="Clear"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>

        <div className="flex-1" />

        {/* Auto-save indicator */}
        {isDrawing && (
          <div className="flex items-center gap-2 text-[#EA931D] text-sm">
            <div className="w-2 h-2 bg-[#EA931D] rounded-full animate-pulse" />
            Drawing...
          </div>
        )}

        {/* Export Button (Manual override) */}
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-[#EA931D] text-black font-bold rounded-lg hover:bg-[#D4850F] transition-colors"
        >
          Force Update
        </button>
      </div>

      {/* Canvas Container - Scaled down for UI */}
      <div className="relative bg-[#1A1A2E] rounded-lg overflow-hidden" style={{ width: 512, height: 512 }}>
        <canvas
          ref={canvasRef}
          className="touch-none"
          style={{
            width: 512,
            height: 512,
          }}
        />

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A2E]/80 z-10">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-[#EA931D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-[#A0A0B0] text-sm">Loading template...</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-2 right-2 text-xs text-[#666] bg-black/50 px-2 py-1 rounded">
          2048×2048 (scaled)
        </div>
      </div>

      {/* Instructions */}
      <p className="text-[#A0A0B0] text-sm mt-3">
        Draw on the template. Preview updates automatically after you stop drawing.
      </p>
    </div>
  );
}
