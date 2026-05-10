'use client';

import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useEditorStore } from '@/stores';

interface GPUPaintEngineProps {
  width?: number;
  height?: number;
  baseTexture?: THREE.Texture | string | null;
  onTextureUpdate: (texture: THREE.Texture) => void;
}

const MAX_HISTORY = 10;

export function GPUPaintEngine({ width = 2048, height = 2048, baseTexture, onTextureUpdate }: GPUPaintEngineProps) {
  const { gl } = useThree();
  const { lastUV, isPainting, selectedTool, brushConfig, activeDecalUrl } = useEditorStore();
  
  // 1. Double Buffering (Ping-Pong) - [A3] Pattern
  const [targetA, targetB] = useMemo(() => {
    const createTarget = () => new THREE.WebGLRenderTarget(width, height, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });
    return [createTarget(), createTarget()];
  }, [width, height]);

  const currentTarget = useRef(targetA);
  const nextTarget = useRef(targetB);
  const prevUV = useRef<{ x: number, y: number } | null>(null);
  const decalTexture = useRef<THREE.Texture | null>(null);

  // 2. History Stack
  const history = useRef<THREE.WebGLRenderTarget[]>([]);
  const historyIndex = useRef(-1);

  // 3. Shaders
  const paintMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uBaseTexture: { value: null },
        uColor: { value: new THREE.Color('#EA931D') },
        uBrushPos: { value: new THREE.Vector2(0, 0) },
        uRadius: { value: 0.01 },
        uHardness: { value: 0.8 },
        uOpacity: { value: 1.0 },
        uIsEraser: { value: false },
        uDistortion: { value: 1.0 },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uBaseTexture;
        uniform vec3 uColor;
        uniform vec2 uBrushPos;
        uniform float uRadius;
        uniform float uHardness;
        uniform float uOpacity;
        uniform bool uIsEraser;
        uniform float uDistortion;

        void main() {
          vec4 baseColor = texture2D(uBaseTexture, vUv);
          float dist = distance(vUv, uBrushPos) / uDistortion;
          float edge = uRadius * (1.0 - uHardness);
          float alpha = 1.0 - smoothstep(uRadius - edge, uRadius, dist);
          if (uIsEraser) {
            gl_FragColor = vec4(baseColor.rgb, baseColor.a * (1.0 - alpha * uOpacity));
          } else {
            vec4 brushColor = vec4(uColor, alpha * uOpacity);
            gl_FragColor = mix(baseColor, brushColor, alpha * uOpacity);
          }
        }
      `
    });
  }, []);

  const stampMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uBaseTexture: { value: null },
        uDecalTexture: { value: null },
        uBrushPos: { value: new THREE.Vector2(0, 0) },
        uSize: { value: 0.1 },
        uOpacity: { value: 1.0 },
        uRotation: { value: 0.0 },
      },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uBaseTexture;
        uniform sampler2D uDecalTexture;
        uniform vec2 uBrushPos;
        uniform float uSize;
        uniform float uOpacity;
        uniform float uRotation;

        vec2 rotate(vec2 v, float a) {
          float s = sin(a);
          float c = cos(a);
          mat2 m = mat2(c, -s, s, c);
          return m * v;
        }

        void main() {
          vec4 baseColor = texture2D(uBaseTexture, vUv);
          vec2 rel = (vUv - uBrushPos) / uSize + 0.5;
          rel = rotate(rel - 0.5, uRotation) + 0.5;

          if (rel.x >= 0.0 && rel.x <= 1.0 && rel.y >= 0.0 && rel.y <= 1.0) {
            vec4 decalColor = texture2D(uDecalTexture, rel);
            gl_FragColor = mix(baseColor, decalColor, decalColor.a * uOpacity);
          } else {
            gl_FragColor = baseColor;
          }
        }
      `
    });
  }, []);

  const compositeMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: { uBaseTexture: { value: null }, uPaintTexture: { value: null } },
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        varying vec2 vUv;
        uniform sampler2D uBaseTexture;
        uniform sampler2D uPaintTexture;
        void main() {
          vec4 base = texture2D(uBaseTexture, vUv);
          vec4 paint = texture2D(uPaintTexture, vUv);
          gl_FragColor = vec4(mix(base.rgb, paint.rgb, paint.a), base.a);
        }
      `
    });
  }, []);

  const snapshotMaterial = useMemo(() => new THREE.MeshBasicMaterial({ transparent: true }), []);
  const quadScene = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
    scene.add(quad);
    return { scene, camera, quad };
  }, []);

  const outputTarget = useMemo(() => new THREE.WebGLRenderTarget(width, height), [width, height]);

  // Load Decal
  useEffect(() => {
    if (!activeDecalUrl) return;
    const loader = new THREE.TextureLoader();
    loader.load(activeDecalUrl, (tex) => {
      tex.flipY = false;
      decalTexture.current = tex;
    });
  }, [activeDecalUrl]);

  // Load Base
  useEffect(() => {
    if (!baseTexture) return;
    const loader = new THREE.TextureLoader();
    const url = typeof baseTexture === 'string' ? baseTexture : '';
    if (url) {
      loader.load(url, (tex) => {
        tex.flipY = false;
        compositeMaterial.uniforms.uBaseTexture.value = tex;
      });
    } else if (baseTexture instanceof THREE.Texture) {
      compositeMaterial.uniforms.uBaseTexture.value = baseTexture;
    }
  }, [baseTexture, compositeMaterial]);

  const captureHistory = useCallback(() => {
    const snapshot = new THREE.WebGLRenderTarget(width, height);
    const oldTarget = gl.getRenderTarget();
    gl.setRenderTarget(snapshot);
    gl.clear();
    snapshotMaterial.map = currentTarget.current.texture;
    quadScene.quad.material = snapshotMaterial;
    gl.render(quadScene.scene, quadScene.camera);
    gl.setRenderTarget(oldTarget);
    history.current = history.current.slice(0, historyIndex.current + 1);
    history.current.push(snapshot);
    if (history.current.length > MAX_HISTORY) history.current.shift()?.dispose();
    historyIndex.current = history.current.length - 1;
  }, [gl, width, height, quadScene, snapshotMaterial]);

  // [A3] Stable Paint Loop
  useFrame(() => {
    const oldTarget = gl.getRenderTarget();

    if (isPainting && lastUV && selectedTool !== 'select') {
      if (selectedTool === 'decal' && decalTexture.current) {
        // Stamp Pass
        stampMaterial.uniforms.uBaseTexture.value = currentTarget.current.texture;
        stampMaterial.uniforms.uDecalTexture.value = decalTexture.current;
        stampMaterial.uniforms.uBrushPos.value.set(lastUV.uv.x, lastUV.uv.y);
        stampMaterial.uniforms.uSize.value = brushConfig.size / 500.0;
        stampMaterial.uniforms.uOpacity.value = brushConfig.opacity / 100.0;
        
        gl.setRenderTarget(nextTarget.current);
        quadScene.quad.material = stampMaterial;
        gl.render(quadScene.scene, quadScene.camera);
        const temp = currentTarget.current;
        currentTarget.current = nextTarget.current;
        nextTarget.current = temp;
      } else if (selectedTool !== 'decal') {
        // Brush Pass - [A4] Pattern (Interpolation)
        let distortionFactor = 1.0;
        if (lastUV.normal && lastUV.viewDir) {
          const normal = new THREE.Vector3(lastUV.normal.x, lastUV.normal.y, lastUV.normal.z);
          const viewDir = new THREE.Vector3(lastUV.viewDir.x, lastUV.viewDir.y, lastUV.viewDir.z);
          distortionFactor = Math.max(0.1, Math.abs(normal.dot(viewDir)));
        }

        // Higher step count for premium smoothness
        const dist = prevUV.current ? Math.sqrt(Math.pow(lastUV.uv.x - prevUV.current.x, 2) + Math.pow(lastUV.uv.y - prevUV.current.y, 2)) : 0;
        const steps = prevUV.current ? Math.ceil(dist * 500) : 1; 
        
        for (let i = 0; i <= steps; i++) {
          const t = i / Math.max(steps, 1);
          const x = prevUV.current ? prevUV.current.x + (lastUV.uv.x - prevUV.current.x) * t : lastUV.uv.x;
          const y = prevUV.current ? prevUV.current.y + (lastUV.uv.y - prevUV.current.y) * t : lastUV.uv.y;

          paintMaterial.uniforms.uBaseTexture.value = currentTarget.current.texture;
          paintMaterial.uniforms.uBrushPos.value.set(x, y);
          paintMaterial.uniforms.uColor.value.set(brushConfig.color);
          paintMaterial.uniforms.uRadius.value = (brushConfig.size / width) * 2.5; // Slightly larger for better fill
          paintMaterial.uniforms.uHardness.value = brushConfig.hardness / 100;
          paintMaterial.uniforms.uOpacity.value = brushConfig.opacity / 100;
          paintMaterial.uniforms.uDistortion.value = distortionFactor;

          gl.setRenderTarget(nextTarget.current);
          quadScene.quad.material = paintMaterial;
          gl.render(quadScene.scene, quadScene.camera);
          const temp = currentTarget.current;
          currentTarget.current = nextTarget.current;
          nextTarget.current = temp;
        }
      }

      if (lastUV.isEnd && prevUV.current) captureHistory();
      prevUV.current = { ...lastUV.uv };
    } else {
      prevUV.current = null;
    }

    if (compositeMaterial.uniforms.uBaseTexture.value) {
      compositeMaterial.uniforms.uPaintTexture.value = currentTarget.current.texture;
      gl.setRenderTarget(outputTarget);
      quadScene.quad.material = compositeMaterial;
      gl.render(quadScene.scene, quadScene.camera);
      onTextureUpdate(outputTarget.texture);
    }
    gl.setRenderTarget(oldTarget);
  });

  useEffect(() => {
    (window as any).gpuUndo = () => {
      if (historyIndex.current > 0) {
        historyIndex.current--;
        const snapshot = history.current[historyIndex.current];
        const oldTarget = gl.getRenderTarget();
        gl.setRenderTarget(currentTarget.current);
        snapshotMaterial.map = snapshot.texture;
        quadScene.quad.material = snapshotMaterial;
        gl.render(quadScene.scene, quadScene.camera);
        gl.setRenderTarget(oldTarget);
      }
    };
    (window as any).gpuClear = () => {
      const oldTarget = gl.getRenderTarget();
      gl.setRenderTarget(currentTarget.current);
      gl.clearColor(0,0,0,0);
      gl.clear();
      gl.setRenderTarget(oldTarget);
      history.current.forEach(t => t.dispose());
      history.current = [];
      historyIndex.current = -1;
    };
  }, [gl, quadScene, snapshotMaterial]);

  return null;
}
