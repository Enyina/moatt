'use client';

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  ContactShadows, 
  Decal, 
  useTexture, 
  PerspectiveCamera,
  Float
} from '@react-three/drei';
import { ColladaLoader } from 'three/examples/jsm/loaders/ColladaLoader.js';
import { usePivotStore } from '@/stores/pivotStore';
import * as THREE from 'three';

// --- STICKER COMPONENT ---
function Sticker({ sticker }: { sticker: any }) {
  const texture = useTexture(sticker.image);
  return (
    <Decal 
      position={sticker.position} 
      rotation={sticker.rotation} 
      scale={sticker.scale}
    >
      <meshStandardMaterial 
        map={texture} 
        transparent 
        polygonOffset 
        polygonOffsetFactor={-10} 
      />
    </Decal>
  );
}

// --- MODEL COMPONENT ---
function ClothingModel({ modelPath }: { modelPath: string }) {
  const parts = usePivotStore(state => state.parts);
  const activePart = usePivotStore(state => state.activePart);
  const setActivePart = usePivotStore(state => state.setActivePart);
  const addSticker = usePivotStore(state => state.addSticker);
  const stickers = usePivotStore(state => state.stickers);
  
  const collada = useLoader(ColladaLoader, modelPath);
  const [hovered, setHovered] = useState<string | null>(null);
  const textureLoader = useRef(new THREE.TextureLoader());

  // Apply colors and materials from state
  useFrame(() => {
    if (!collada.scene) return;
    
    collada.scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const partName = mesh.name.toLowerCase();
        const config = parts[partName] || parts['torso'];
        
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          
          // Apply Color
          mat.color.set(config.color);
          mat.roughness = config.roughness;
          mat.metalness = config.metalness;
          
          // Apply Texture if available
          if (config.texture && (!mat.map || mat.map.name !== config.texture)) {
            textureLoader.current.load(config.texture, (tex) => {
              tex.name = config.texture!;
              tex.flipY = false;
              mat.map = tex;
              mat.needsUpdate = true;
            });
          }

          // Highlighting logic
          if (activePart === partName) {
            mat.emissive.set('#444444');
          } else if (hovered === partName) {
            mat.emissive.set('#222222');
          } else {
            mat.emissive.set('#000000');
          }
        }
      }
    });
  });

  return (
    <group 
      dispose={null}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (e.intersections.length > 0) {
          const hit = e.intersections[0];
          const meshName = hit.object.name.toLowerCase();
          setActivePart(meshName);
          
          if (hit.point && hit.face) {
            addSticker(
              '/templates/makehuman/female/shirt.png', 
              [hit.point.x, hit.point.y, hit.point.z],
              [0, 0, 0]
            );
          }
        }
      }}
      onPointerMissed={() => setActivePart(null)}
    >
      <primitive 
        object={collada.scene} 
        onPointerOver={(e: any) => {
          e.stopPropagation();
          setHovered(e.object.name.toLowerCase());
        }}
        onPointerOut={() => setHovered(null)}
      />
      
      {stickers.map((sticker) => (
        <Sticker key={sticker.id} sticker={sticker} />
      ))}
    </group>
  );
}

// --- MINIMAL UI PANEL (No-Code Feel) ---
function UIPanel() {
  const activePart = usePivotStore(state => state.activePart);
  const parts = usePivotStore(state => state.parts);
  const setPartColor = usePivotStore(state => state.setPartColor);
  const setPartProperty = usePivotStore(state => state.setPartProperty);
  const environment = usePivotStore(state => state.environment);
  const setEnvironment = usePivotStore(state => state.setEnvironment);
  const intensity = usePivotStore(state => state.intensity);
  const setIntensity = usePivotStore(state => state.setIntensity);

  if (!activePart) return (
    <div className="absolute top-24 right-8 w-64 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-white/60 text-xs italic">
      Click a part of the model to begin customizing.
    </div>
  );

  const config = parts[activePart] || { color: '#ffffff', roughness: 0.7, metalness: 0.1 };

  return (
    <div className="absolute top-24 right-8 w-72 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 bg-[#EA931D] rounded-full" />
        <h3 className="text-white font-bold text-xs uppercase tracking-widest">Editing: {activePart}</h3>
      </div>

      <div className="space-y-6">
        {/* Color Picker */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Primary Color</label>
          <div className="flex gap-2">
            <input 
              type="color" 
              value={config.color} 
              onChange={(e) => setPartColor(activePart, e.target.value)}
              className="w-10 h-10 rounded-lg bg-transparent cursor-pointer"
            />
            <input 
              type="text" 
              value={config.color} 
              onChange={(e) => setPartColor(activePart, e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 text-xs text-white"
            />
          </div>
        </div>

        {/* Roughness */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Material Roughness</label>
          <input 
            type="range" min="0" max="1" step="0.01" 
            value={config.roughness} 
            onChange={(e) => setPartProperty(activePart, 'roughness', parseFloat(e.target.value))}
            className="w-full accent-[#EA931D]"
          />
        </div>

        {/* Environment Selector */}
        <div>
          <label className="text-[10px] text-white/40 uppercase tracking-wider block mb-2">Lighting Environment</label>
          <select 
            value={environment}
            onChange={(e) => setEnvironment(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white outline-none"
          >
            {['city', 'apartment', 'lobby', 'night', 'studio', 'warehouse'].map(env => (
              <option key={env} value={env}>{env.toUpperCase()}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// --- MAIN CONFIGURATOR ---
export default function Configurator({ modelPath = '/models/makehuman/female_standard.dae' }) {
  const environment = usePivotStore(state => state.environment);

  return (
    <div className="w-full h-screen bg-[#050505]">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 1, 4]} />
        
        <Suspense fallback={null}>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <ClothingModel modelPath={modelPath} />
          </Float>

          <Environment preset={environment as any} />
          <ContactShadows 
            position={[0, -1, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
            far={4} 
          />
        </Suspense>

        <OrbitControls 
          makeDefault 
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 1.5} 
        />
        
        <gridHelper args={[20, 20, 0x222222, 0x111111]} position={[0, -1, 0]} />
      </Canvas>

      <UIPanel />

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4 pointer-events-none">
         <div className="px-6 py-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-white text-sm font-medium animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Click model to place a logo. Click parts to edit materials.
         </div>
      </div>
    </div>
  );
}
