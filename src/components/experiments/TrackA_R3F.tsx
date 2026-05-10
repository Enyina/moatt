'use client';

import React, { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// --- CONFIGURATION ---
const TEXTURE_SIZE = 2048;

/**
 * TRACK A: R3F Minimal Stabilization Experiment
 * Focus: Stable input, accurate alignment, smooth performance.
 */

function MinimalPaintEngine({ isPainting, lastUV, onTextureUpdate }: { isPainting: boolean; lastUV: THREE.Vector2 | null; onTextureUpdate: (tex: THREE.Texture) => void }) {
  const { gl } = useThree();
  
  // A3. Paint Loop Stability (GPU-only pass)
  const [targetA, targetB] = useMemo(() => {
    const createTarget = () => new THREE.WebGLRenderTarget(TEXTURE_SIZE, TEXTURE_SIZE, {
      format: THREE.RGBAFormat,
      type: THREE.UnsignedByteType,
    });
    return [createTarget(), createTarget()];
  }, []);

  const currentTarget = useRef(targetA);
  const nextTarget = useRef(targetB);
  const prevUV = useRef<THREE.Vector2 | null>(null);

  // A4. Stroke Continuity Shader
  const paintMaterial = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      uBaseTexture: { value: null },
      uBrushPos: { value: new THREE.Vector2(0, 0) },
      uRadius: { value: 0.015 },
      uColor: { value: new THREE.Color('#EA931D') }
    },
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position, 1.0); }`,
    fragmentShader: `
      varying vec2 vUv;
      uniform sampler2D uBaseTexture;
      uniform vec2 uBrushPos;
      uniform float uRadius;
      uniform vec3 uColor;
      void main() {
        vec4 base = texture2D(uBaseTexture, vUv);
        float dist = distance(vUv, uBrushPos);
        float mask = 1.0 - smoothstep(uRadius * 0.8, uRadius, dist);
        gl_FragColor = mix(base, vec4(uColor, 1.0), mask);
      }
    `
  }), []);

  const quadScene = useMemo(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), paintMaterial);
    scene.add(quad);
    return { scene, camera };
  }, [paintMaterial]);

  useFrame(() => {
    if (isPainting && lastUV) {
      const oldTarget = gl.getRenderTarget();
      
      // A4. Stroke Continuity (Interpolation)
      const steps = prevUV.current ? Math.ceil(lastUV.distanceTo(prevUV.current) * 400) : 1;
      
      for (let i = 0; i <= steps; i++) {
        const t = i / Math.max(steps, 1);
        const lerpUV = prevUV.current ? prevUV.current.clone().lerp(lastUV, t) : lastUV;

        paintMaterial.uniforms.uBaseTexture.value = currentTarget.current.texture;
        paintMaterial.uniforms.uBrushPos.value.copy(lerpUV);

        gl.setRenderTarget(nextTarget.current);
        gl.render(quadScene.scene, quadScene.camera);

        const temp = currentTarget.current;
        currentTarget.current = nextTarget.current;
        nextTarget.current = temp;
      }

      onTextureUpdate(currentTarget.current.texture);
      prevUV.current = lastUV.clone();
      gl.setRenderTarget(oldTarget);
    } else {
      prevUV.current = null;
    }
  });

  return null;
}

function ExperimentMesh({ onUVUpdate, setIsPainting, texture }: { onUVUpdate: (uv: THREE.Vector2) => void; setIsPainting: (v: boolean) => void; texture: THREE.Texture | null }) {
  const material = useMemo(() => new THREE.MeshStandardMaterial({
    map: texture,
    color: texture ? '#fff' : '#444',
    roughness: 0.7,
  }), [texture]);

  return (
    <mesh
      position={[0, 1, 0]}
      onPointerDown={(e) => {
        // A1. Input Priority (Stop propagation before OrbitControls)
        e.stopPropagation();
        setIsPainting(true);
        if (e.uv) onUVUpdate(e.uv.clone());
      }}
      onPointerUp={() => setIsPainting(false)}
      onPointerMove={(e) => {
        if (e.uv) onUVUpdate(e.uv.clone());
      }}
      onPointerLeave={() => setIsPainting(false)}
    >
      <capsuleGeometry args={[0.6, 1.8, 8, 32]} />
      <primitive object={material} attach="material" />
    </mesh>
  );
}

export default function TrackA_R3F() {
  const [isPainting, setIsPainting] = useState(false);
  const [lastUV, setLastUV] = useState<THREE.Vector2 | null>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  return (
    <div className="w-full h-screen bg-black">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1.5, 4]} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        
        <Suspense fallback={null}>
          <ExperimentMesh 
            setIsPainting={setIsPainting} 
            onUVUpdate={setLastUV} 
            texture={texture}
          />
          
          <MinimalPaintEngine 
            isPainting={isPainting} 
            lastUV={lastUV} 
            onTextureUpdate={setTexture}
          />
        </Suspense>

        {/* A6. Orbit Control Gating (Minimal) */}
        <OrbitControls 
          enabled={!isPainting} 
          makeDefault 
          target={[0, 1, 0]}
        />
      </Canvas>
      
      <div className="absolute top-4 left-4 text-white font-mono text-xs bg-black/50 p-2 rounded">
        TRACK A: R3F STABILIZATION EXPERIMENT<br/>
        - [A1] Input Priority: ACTIVE<br/>
        - [A3] Paint Loop: SYNCED<br/>
        - [A4] Interpolation: ENABLED<br/>
        - Orbit locked during paint.
      </div>
    </div>
  );
}
