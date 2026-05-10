'use client';

import { useRef, useState, useEffect, Suspense, useMemo, Component, type ReactNode } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import * as THREE from 'three';
import { getBodyTypeConfig, getModelPath, getBodyTypesByCategory } from '@/lib/models';
import { applyPose, getPose } from '@/lib/poses';

// Error Boundary for loading failures
class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('Preview mannequin error:', error);
  }
  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}

interface TemplatePreviewProps {
  category: 'women' | 'men' | 'children' | 'unisex';
  className?: string;
  bodyTypeId?: string; // Optional specific body type
}

// REAL MANNEQUIN from MakeHuman DAE - adjusted for waist-up view
function RealPreviewMannequin({ bodyTypeId }: { bodyTypeId: string }) {
  const config = getBodyTypeConfig(bodyTypeId);
  const modelPath = getModelPath(bodyTypeId);
  const collada = useLoader(ColladaLoader, modelPath);
  
  const clonedScene = useMemo(() => {
    if (!collada?.scene) return null;
    const clone = collada.scene.clone();
    
    // Apply default standing pose for preview
    const pose = getPose('standing-default');
    if (pose) {
      applyPose(clone, pose);
    }
    
    return clone;
  }, [collada, bodyTypeId]);

  if (!clonedScene) return null;

  return (
    <primitive
      object={clonedScene}
      scale={config?.scale ? config.scale * 0.12 : 0.12}
      position={config?.position ? [config.position[0], config.position[1] + 0.8, config.position[2]] : [0, -0.2, 0]}
      rotation={config?.rotation || [0, 0, 0]}
    />
  );
}

// Fallback procedural mannequin
function PreviewMannequin({ category }: { category: 'women' | 'men' | 'children' | 'unisex' }) {
  const groupRef = useRef<THREE.Group>(null);

  // Category-specific proportions
  const scale = category === 'children' ? 0.72 : 1;
  const torsoWidth = category === 'women' ? 0.32 : category === 'men' ? 0.42 : category === 'unisex' ? 0.35 : 0.28;
  const hipWidth = category === 'women' ? 0.38 : category === 'men' ? 0.34 : category === 'unisex' ? 0.36 : 0.30;
  const shoulderWidth = category === 'women' ? 0.38 : category === 'men' ? 0.48 : category === 'unisex' ? 0.43 : 0.32;
  const armLength = category === 'children' ? 0.42 : 0.55;

  return (
    <group ref={groupRef} position={[0, -0.9, 0]} scale={scale}>
      <group position={[0, 2.35, 0]} rotation={[0, 0.15, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.28, 24, 24]} />
          <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.12, 0.04]} castShadow>
          <sphereGeometry args={[0.22, 20, 20]} />
          <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
        </mesh>
      </group>
      <mesh position={[0, 1.9, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.13, 0.3, 20]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[-shoulderWidth * 0.5, 1.75, 0]} rotation={[0, 0, 0.25]} castShadow>
        <capsuleGeometry args={[0.11, 0.35, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[shoulderWidth * 0.5, 1.75, 0]} rotation={[0, 0, -0.25]} castShadow>
        <capsuleGeometry args={[0.11, 0.35, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[torsoWidth, torsoWidth * 0.95, 0.3, 28]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[torsoWidth * 0.95, torsoWidth * 0.85, 0.4, 28]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[-torsoWidth - 0.15, 1.65, 0.1]} rotation={[0.2, 0.1, 0.15]} castShadow>
        <capsuleGeometry args={[0.085, armLength * 0.55, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[-torsoWidth - 0.18, 1.15, 0.15]} rotation={[0.1, 0.05, 0.1]} castShadow>
        <capsuleGeometry args={[0.075, armLength * 0.5, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[-torsoWidth - 0.2, 0.82, 0.2]} castShadow>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[torsoWidth + 0.18, 1.55, 0]} rotation={[0, 0, -0.12]} castShadow>
        <capsuleGeometry args={[0.085, armLength * 0.55, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[torsoWidth + 0.22, 1.05, 0]} rotation={[0, 0, -0.08]} castShadow>
        <capsuleGeometry args={[0.075, armLength * 0.5, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[torsoWidth + 0.24, 0.72, 0]} castShadow>
        <sphereGeometry args={[0.09, 14, 14]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[hipWidth, hipWidth * 0.95, 0.28, 28]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[-hipWidth * 0.35, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.6, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[-hipWidth * 0.35, -0.12, 0]} castShadow>
        <capsuleGeometry args={[0.10, 0.55, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[-hipWidth * 0.35, -0.52, 0.04]} castShadow>
        <boxGeometry args={[0.11, 0.09, 0.22]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[hipWidth * 0.35, 0.45, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.6, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[hipWidth * 0.35, -0.12, 0]} castShadow>
        <capsuleGeometry args={[0.10, 0.55, 8, 16]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
      <mesh position={[hipWidth * 0.35, -0.52, 0.04]} castShadow>
        <boxGeometry args={[0.11, 0.09, 0.22]} />
        <meshStandardMaterial color="#8B5A3C" roughness={0.4} />
      </mesh>
    </group>
  );
}

// Camera controller for 360 spin on hover
function SpinController({ isSpinning }: { isSpinning: boolean }) {
  const controlsRef = useRef<any>(null);
  const rotationRef = useRef(0);

  useFrame((_, delta) => {
    if (isSpinning && controlsRef.current) {
      rotationRef.current += delta * (Math.PI * 2 / 3);
      controlsRef.current.setAzimuthalAngle(rotationRef.current);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={false}
      enablePan={false}
      enableRotate={!isSpinning}
      autoRotate={false}
      minPolarAngle={Math.PI / 2.5}
      maxPolarAngle={Math.PI / 1.8}
      minDistance={1.5}
      maxDistance={2.5}
      target={[0, 1.0, 0]}
    />
  );
}

export function Template3DPreview({
  category,
  className = '',
  bodyTypeId
}: TemplatePreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBodyTypeId = bodyTypeId || getBodyTypesByCategory(category)[0]?.id ||
    (category === 'unisex' ? 'female-standard' : 'female-standard');

  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Canvas
        camera={{ position: [0, 1.2, 1.8], fov: 35 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <color attach="background" args={[0x000000]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={0.8} castShadow />
        <directionalLight position={[-2, 2, -2]} intensity={0.3} />

        <ErrorBoundary fallback={<PreviewMannequin category={category} />}>
          <Suspense fallback={<PreviewMannequin category={category} />}>
            <RealPreviewMannequin bodyTypeId={selectedBodyTypeId} />
          </Suspense>
        </ErrorBoundary>

        {isVisible && <SpinController isSpinning={isHovered} />}
      </Canvas>

      {isHovered && (
        <div className="absolute bottom-2 right-2 bg-[#EA931D] text-black text-xs font-bold px-2 py-1 rounded-full animate-pulse">
          360°
        </div>
      )}
    </div>
  );
}
