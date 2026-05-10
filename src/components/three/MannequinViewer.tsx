'use client';

import React, { useState, useCallback, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useLoader, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
import { useEditorStore } from '@/stores';
import { getModelPath, getBodyTypeConfig } from '@/lib/models';
import type { ClothingType, Accessory } from '@/lib/types';
import type { FabricMaterial } from '@/lib/fabrics';
import { GPUPaintEngine } from './GPUPaintEngine';

function LoadingFallback() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#222" wireframe />
      </mesh>
    </group>
  );
}

function ErrorBoundary({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) {
  return <Suspense fallback={fallback}>{children}</Suspense>;
}

/**
 * RealMannequin - Stabilized Track A Pattern
 * Updated: Supports dynamic focusing on click.
 */
function RealMannequin({ clothingTexture, bodyTypeId, poseId, onFocus }: { clothingTexture?: string | THREE.Texture; bodyTypeId?: string; poseId?: string; onFocus: (point: THREE.Vector3) => void }) {
  const { scene: rawScene } = useLoader(ColladaLoader, getModelPath(bodyTypeId || 'female-standard'));
  const { selectedTool, setIsPainting, drawFromUV, isPainting } = useEditorStore();

  const clothingTextureObj = useMemo(() => {
    if (!clothingTexture) return null;
    if (typeof clothingTexture !== 'string') return clothingTexture;
    const tex = new THREE.TextureLoader().load(clothingTexture);
    tex.flipY = false;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [clothingTexture]);

  const clothMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: clothingTextureObj,
      roughness: 0.8,
      metalness: 0.0,
      transparent: true,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -4,
      polygonOffsetUnits: -4,
    });
  }, [clothingTextureObj]);

  useEffect(() => {
    if (clothingTextureObj instanceof THREE.Texture) {
      clothMat.metalnessMap = clothingTextureObj;
      clothMat.metalness = 1.0;
      clothMat.roughness = 0.4;
      clothMat.needsUpdate = true;
    }
  }, [clothingTextureObj, clothMat]);

  const nodes = useMemo(() => {
    if (!rawScene) return { skin: null, clothing: null };
    const res: any = { skin: null, clothing: null };
    rawScene.traverse((child: any) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        if (name.includes('skin') || name.includes('body')) {
          res.skin = child;
        } else if (name.includes('cloth') || name.includes('shirt') || name.includes('pant')) {
          res.clothing = child;
        }
      }
    });
    return res;
  }, [rawScene]);

  useEffect(() => {
    if (nodes.clothing) nodes.clothing.material = clothMat;
    if (nodes.skin) nodes.skin.material = new THREE.MeshStandardMaterial({ color: '#888', roughness: 0.7 });
  }, [nodes, clothMat]);

  return (
    <primitive 
      object={rawScene} 
      onPointerDown={(e: any) => {
        if (selectedTool === 'select') {
          // Focus on point
          onFocus(e.point);
          return;
        }
        e.stopPropagation();
        const name = e.object.name.toLowerCase();
        if (name.includes('skin') || name.includes('body')) return;
        setIsPainting(true);
        if (e.uv && e.face) {
          drawFromUV(e.uv, true, false, { x: e.face.normal.x, y: e.face.normal.y, z: e.face.normal.z }, { x: e.ray.direction.x, y: e.ray.direction.y, z: e.ray.direction.z });
        }
      }}
      onPointerUp={(e: any) => {
        if (selectedTool === 'select') return;
        e.stopPropagation();
        setIsPainting(false);
      }}
      onPointerMove={(e: any) => {
        if (selectedTool === 'select' || !isPainting) return;
        e.stopPropagation();
        if (e.uv && e.face) {
          drawFromUV(e.uv, false, false, { x: e.face.normal.x, y: e.face.normal.y, z: e.face.normal.z }, { x: e.ray.direction.x, y: e.ray.direction.y, z: e.ray.direction.z });
        }
      }}
      onPointerLeave={() => setIsPainting(false)}
    />
  );
}

function GLBMannequin({ modelUrl, clothingTexture, targetMesh, onFocus }: { modelUrl: string; clothingTexture?: string | THREE.Texture; targetMesh?: string; onFocus: (point: THREE.Vector3) => void }) {
  const { scene } = useGLTF(modelUrl);
  const { selectedTool, setIsPainting, drawFromUV, isPainting } = useEditorStore();
  
  const tex = useMemo(() => {
    if (!clothingTexture) return null;
    if (typeof clothingTexture !== 'string') return clothingTexture;
    return clothingTexture;
  }, [clothingTexture]);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh && tex) {
         if (targetMesh === 'full' || child.name.toLowerCase().includes(targetMesh || '')) {
           child.material.map = tex;
           child.material.needsUpdate = true;
         }
      }
    });
  }, [scene, tex, targetMesh]);

  return (
    <primitive 
      object={scene}
      onPointerDown={(e: any) => {
        if (selectedTool === 'select') {
          onFocus(e.point);
          return;
        }
        e.stopPropagation();
        setIsPainting(true);
        if (e.uv) drawFromUV(e.uv, true);
      }}
      onPointerUp={() => setIsPainting(false)}
      onPointerMove={(e: any) => {
        if (!isPainting || selectedTool === 'select') return;
        e.stopPropagation();
        if (e.uv) drawFromUV(e.uv, false);
      }}
    />
  );
}

/**
 * CameraController - Internal component to lerp the camera target
 */
function CameraController({ targetPoint, orbitRef }: { targetPoint: THREE.Vector3 | null, orbitRef: React.RefObject<any> }) {
  useFrame((state, delta) => {
    if (targetPoint && orbitRef.current) {
      // Smoothly interpolate the orbit target
      orbitRef.current.target.lerp(targetPoint, delta * 5);
      orbitRef.current.update();
    }
  });
  return null;
}

export function MannequinViewer({ className, modelUrl, clothingTexture, targetMesh = 'torso', bodyTypeId = 'female-standard', poseId = 'standing-default' }: any) {
  const { selectedTool, isPainting, resetDrawingState } = useEditorStore();
  const orbitRef = useRef<any>(null);
  const [gpuTexture, setGpuTexture] = useState<THREE.Texture | null>(null);
  const [focusPoint, setFocusPoint] = useState<THREE.Vector3 | null>(null);

  useEffect(() => {
    resetDrawingState();
  }, [selectedTool, resetDrawingState]);

  useEffect(() => {
    if (orbitRef.current) {
      orbitRef.current.enableRotate = selectedTool === 'select' && !isPainting;
      orbitRef.current.enablePan = !isPainting;
      orbitRef.current.enableZoom = true;
    }
  }, [selectedTool, isPainting]);

  return (
    <div className={`w-full h-full min-h-screen ${className} relative cursor-default`}>
      <div className="absolute bottom-10 right-10 z-50 flex flex-col gap-2">
        <button 
          onClick={() => {
            orbitRef.current?.reset();
            // Reset to chest level
            setFocusPoint(new THREE.Vector3(0, 1, 0));
          }}
          className="w-12 h-12 bg-[#1A1A1A]/80 backdrop-blur-md rounded-xl flex items-center justify-center hover:bg-[#222] text-[#888] hover:text-white border border-white/5 transition-all shadow-xl group"
          title="Reset View"
        >
          <svg className="w-6 h-6 group-active:scale-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>
      
      <Canvas camera={{ position: [0, 1.2, 5], fov: 45 }} shadows gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#0A0A0A']} />
        
        <Suspense fallback={<LoadingFallback />}>
          <Stage environment="studio" intensity={1} contactShadow={{ opacity: 0.7, blur: 2 }} adjustCamera={false}>
            <group position={[0, -1, 0]}>
              {modelUrl ? (
                <GLBMannequin modelUrl={modelUrl} clothingTexture={gpuTexture || clothingTexture} targetMesh={targetMesh} onFocus={setFocusPoint} />
              ) : (
                <RealMannequin clothingTexture={gpuTexture || clothingTexture} bodyTypeId={bodyTypeId} poseId={poseId} onFocus={setFocusPoint} />
              )}
            </group>
          </Stage>

          <GPUPaintEngine 
            baseTexture={clothingTexture}
            onTextureUpdate={(tex) => setGpuTexture(tex)} 
          />
        </Suspense>

        <CameraController targetPoint={focusPoint} orbitRef={orbitRef} />

        <OrbitControls 
          ref={orbitRef}
          makeDefault
          minPolarAngle={0} 
          maxPolarAngle={Math.PI} 
          minDistance={0.1} 
          maxDistance={100} 
          target={[0, 1, 0]} 
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}