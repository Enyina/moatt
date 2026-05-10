'use client';

import { Grid, Float } from '@react-three/drei';
import * as THREE from 'three';

export function StudioScene() {
  return (
    <>
      {/* Premium Floor Grid */}
      <Grid
        position={[0, -1, 0]}
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#333333"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#444444"
        fadeDistance={20}
        infiniteGrid
      />

      {/* Rotation Guides (Rings) */}
      <group position={[0, -1, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.22, 64]} />
          <meshBasicMaterial color="#555555" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        
        {/* Animated arrows for rotation feedback */}
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <group position={[0, 2.5, 0]}>
             <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.0, 1.02, 64]} />
              <meshBasicMaterial color="#EA931D" transparent opacity={0.2} side={THREE.DoubleSide} />
            </mesh>
          </group>
        </Float>
      </group>

      {/* Background Gradient / Studio setup */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial color="#050505" />
      </mesh>
    </>
  );
}
