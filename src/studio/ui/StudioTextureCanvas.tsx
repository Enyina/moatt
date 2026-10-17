'use client';

import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface StudioTextureCanvasProps {
  brushColor: string;
  initialState?: unknown;
  onTextureChange: (textureDataUrl: string, canvasState: unknown) => void;
}

export function StudioTextureCanvas({
  brushColor,
  initialState,
  onTextureChange,
}: StudioTextureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);
  const onTextureChangeRef = useRef(onTextureChange);
  const initialBrushColorRef = useRef(brushColor);

  useEffect(() => {
    onTextureChangeRef.current = onTextureChange;
  }, [onTextureChange]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;

    const canvas = new fabric.Canvas(element, {
      width: 768,
      height: 768,
      backgroundColor: '#ffffff',
      isDrawingMode: true,
    });

    const brush = new fabric.PencilBrush(canvas);
    brush.color = initialBrushColorRef.current;
    brush.width = 18;
    brush.decimate = 2;
    brush.strokeLineCap = 'round';
    brush.strokeLineJoin = 'round';
    canvas.freeDrawingBrush = brush;
    fabricRef.current = canvas;

    const syncTexture = () => {
      const textureDataUrl = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1,
      });
      onTextureChangeRef.current(textureDataUrl, canvas.toJSON());
    };

    const loadFallbackTemplate = () => {
      const guide = new fabric.Rect({
        left: 96,
        top: 96,
        width: 576,
        height: 576,
        fill: 'transparent',
        stroke: '#d7d7d7',
        strokeDashArray: [14, 10],
        selectable: false,
        evented: false,
      });
      const label = new fabric.Text('Draw fabric or placement graphics here', {
        left: 384,
        top: 384,
        originX: 'center',
        originY: 'center',
        fill: '#9b9b9b',
        fontFamily: 'sans-serif',
        fontSize: 24,
        selectable: false,
        evented: false,
      });
      canvas.add(guide, label);
      canvas.renderAll();
      syncTexture();
    };

    if (initialState) {
      canvas.loadFromJSON(initialState, () => {
        canvas.renderAll();
        syncTexture();
      });
    } else {
      loadFallbackTemplate();
    }

    canvas.on('path:created', syncTexture);
    canvas.on('object:modified', syncTexture);
    canvas.on('object:removed', syncTexture);

    return () => {
      canvas.off('path:created', syncTexture);
      canvas.off('object:modified', syncTexture);
      canvas.off('object:removed', syncTexture);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, [initialState]);

  useEffect(() => {
    const brush = fabricRef.current?.freeDrawingBrush as fabric.PencilBrush | undefined;
    // Fabric owns this mutable brush object; updating it keeps the canvas instance stable.
    // eslint-disable-next-line react-hooks/immutability
    if (brush) brush.color = brushColor;
  }, [brushColor]);

  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-white">
      <canvas ref={canvasRef} className="block aspect-square w-full" />
    </div>
  );
}
