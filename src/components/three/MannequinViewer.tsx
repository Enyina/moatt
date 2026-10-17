'use client';

import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader';
import { useEditorStore } from '@/stores';
import { getModelPath } from '@/lib/models';

function LoadingFallback() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color="#F5F5F5" wireframe />
      </mesh>
    </group>
  );
}

/**
 * CameraController - Smoothly lerps orbit target to the focus point.
 */
function CameraController({ targetPoint, orbitRef }: { targetPoint: THREE.Vector3 | null; orbitRef: React.RefObject<any> }) {
  useFrame(() => {
    if (targetPoint && orbitRef.current) {
      const currentTarget = orbitRef.current.target;
      currentTarget.lerp(targetPoint, 0.1);
      orbitRef.current.update();
    }
  });
  return null;
}

/**
 * RealMannequin - Handles Collada (.dae) models with stage-aware visibility.
 */
/**
 * RealMannequin - Handles Collada (.dae) models with stage-aware visibility.
 * UPGRADE: ArmorPaint-inspired PBR Material Logic.
 */
function RealMannequin({ clothingTexture, bodyTypeId, onFocus, viewMode }: { clothingTexture?: string | THREE.Texture; bodyTypeId?: string; onFocus: (point: THREE.Vector3) => void; viewMode: 'item' | 'full' }) {
  const { scene: rawScene } = useLoader(ColladaLoader, getModelPath(bodyTypeId || 'female-standard'));
  const { selectedTool } = useEditorStore();

  // Procedural Fabric Texture for PBR (ArmorPaint Style)
  const fabricNormalMap = useMemo(() => {
    const size = 512;
    const data = new Uint8Array(size * size * 4); // RGBA
    for (let i = 0; i < size * size; i++) {
      const stride = i * 4;
      // Procedural weave pattern
      const x = i % size;
      const y = Math.floor(i / size);
      const weave = (Math.sin(x * 0.5) * Math.cos(y * 0.5)) * 0.2;
      data[stride] = 128 + weave * 127;     // R
      data[stride + 1] = 128 + weave * 127; // G
      data[stride + 2] = 255;               // B (Normal Z)
      data[stride + 3] = 255;               // A
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(20, 20); // Fine grain
    tex.needsUpdate = true;
    return tex;
  }, []);

  const tex = useMemo(() => {
    if (!clothingTexture) return null;
    if (typeof clothingTexture !== 'string') return clothingTexture;
    const t = new THREE.TextureLoader().load(clothingTexture);
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16; // High quality
    return t;
  }, [clothingTexture]);

  const pbrClothMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: tex,
      normalMap: fabricNormalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.85,  // Soft fabric look
      metalness: 0.05,
      transparent: true,
      side: THREE.DoubleSide,
    });
  }, [tex, fabricNormalMap]);

  useEffect(() => {
    rawScene.traverse((child: any) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        // Visibility Logic
        if (name.includes('skin') || name.includes('body')) {
          child.visible = viewMode === 'full';
          if (child.visible) {
            child.material = new THREE.MeshStandardMaterial({ 
              color: '#444', 
              roughness: 0.4,
              metalness: 0.1 
            });
          }
        } else if (name.includes('cloth') || name.includes('shirt') || name.includes('pant')) {
          child.visible = true;
          child.material = pbrClothMat;
          child.material.needsUpdate = true;
        }
      }
    });
  }, [rawScene, pbrClothMat, viewMode]);

  return (
    <primitive 
      object={rawScene} 
      onPointerDown={(e: any) => {
        if (selectedTool === 'select') onFocus(e.point);
      }}
    />
  );
}

/**
 * GLBMannequin - Handles GLB models with stage-aware visibility.
 * UPGRADE: ArmorPaint-inspired PBR Material Logic.
 */
function GLBMannequin({ modelUrl, clothingTexture, targetMesh, onFocus, viewMode }: { modelUrl: string; clothingTexture?: string | THREE.Texture; targetMesh?: string; onFocus: (point: THREE.Vector3) => void; viewMode: 'item' | 'full' }) {
  const { scene } = useGLTF(modelUrl);
  const { selectedTool } = useEditorStore();
  
  // Reuse procedural weave
  const fabricNormalMap = useMemo(() => {
    const size = 256;
    const data = new Uint8Array(size * size * 4); // RGBA
    for (let i = 0; i < size * size; i++) {
      const stride = i * 4;
      const x = i % size;
      const y = Math.floor(i / size);
      const weave = (Math.sin(x * 1.0) + Math.sin(y * 1.0)) * 0.1;
      data[stride] = 128 + weave * 127;
      data[stride + 1] = 128 + weave * 127;
      data[stride + 2] = 255;
      data[stride + 3] = 255;
    }
    const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(40, 40);
    tex.needsUpdate = true;
    return tex;
  }, []);

  const tex = useMemo(() => {
    if (!clothingTexture) return null;
    if (typeof clothingTexture !== 'string') return clothingTexture;
    const t = new THREE.TextureLoader().load(clothingTexture);
    t.flipY = false;
    t.anisotropy = 16;
    return t;
  }, [clothingTexture]);

  useEffect(() => {
    scene.traverse((child: any) => {
      if (child.isMesh) {
        const name = child.name.toLowerCase();
        
        // Visibility Logic
        if (name.includes('body') || name.includes('skin')) {
          child.visible = viewMode === 'full';
        } else if (name.includes(targetMesh?.toLowerCase() || 'torso') || name.includes('shirt') || name.includes('cloth')) {
          child.visible = true;
          child.material = new THREE.MeshStandardMaterial({
            map: tex,
            normalMap: fabricNormalMap,
            normalScale: new THREE.Vector2(0.4, 0.4),
            roughness: 0.9,
            metalness: 0.0,
          });
          child.material.needsUpdate = true;
        }
      }
    });
  }, [scene, tex, targetMesh, viewMode, fabricNormalMap]);

  return (
    <primitive 
      object={scene}
      onPointerDown={(e: any) => {
        if (selectedTool === 'select') onFocus(e.point);
      }}
    />
  );
}

/**
 * Main MannequinViewer Component
 * UPGRADE: Cinematic Showroom Stage.
 */
export function MannequinViewer({ className, modelUrl, clothingTexture, targetMesh = 'torso', bodyTypeId = 'female-standard', poseId = 'standing-default' }: any) {
  const { viewMode, renderStage } = useEditorStore();
  const orbitRef = useRef<any>(null);
  const [focusPoint, setFocusPoint] = useState<THREE.Vector3 | null>(null);

  return (
    <div className={`w-full h-full min-h-screen ${className} relative cursor-default`}>
      <Canvas 
        camera={{ position: [0, 1.2, 4], fov: 35 }} 
        shadows 
        gl={{ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
      >
        {/* Cinematic Lighting Rig */}
        <color attach="background" args={['#0A0A0A']} />
        <ambientLight intensity={0.4} />
        <spotLight position={[5, 10, 5]} angle={0.15} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#444" />
        <directionalLight position={[0, 5, 5]} intensity={0.5} />
        
        {/* Professional Rim Light for fabric detail */}
        <pointLight position={[0, 2, -5]} intensity={1.5} color="#white" />
        
        <Suspense fallback={<LoadingFallback />}>
          <group position={[0, -0.8, 0]}>
            {modelUrl ? (
              <GLBMannequin 
                modelUrl={modelUrl} 
                clothingTexture={clothingTexture} 
                targetMesh={targetMesh} 
                onFocus={setFocusPoint} 
                viewMode={viewMode}
              />
            ) : (
              <RealMannequin 
                clothingTexture={clothingTexture} 
                bodyTypeId={bodyTypeId} 
                onFocus={setFocusPoint} 
                viewMode={viewMode}
              />
            )}
            
            {/* Soft Studio Shadows */}
            <ContactShadows 
              opacity={0.8} 
              scale={10} 
              blur={2.5} 
              far={4} 
              resolution={512} 
              color="#000000" 
            />
          </group>
        </Suspense>

        <CameraController targetPoint={focusPoint} orbitRef={orbitRef} />

        <OrbitControls 
          ref={orbitRef}
          makeDefault
          autoRotate={renderStage > 1} // Auto-rotate in Showroom
          autoRotateSpeed={0.5}
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 1.8} // Prevent looking under the floor
          minDistance={1.5} 
          maxDistance={8} 
          target={[0, 0.5, 0]} 
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Canvas>
    </div>
  );
}