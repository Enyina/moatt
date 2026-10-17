'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Canvas, ThreeEvent, useLoader } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Decal, PerspectiveCamera, Environment } from '@react-three/drei';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { ErrorBoundary } from './ErrorBoundary';
import { useEditorStore } from '@/stores';
import { getBodyTypeConfig, getModelPath } from '@/lib/models';
import {
  DecalInstance,
  MaterialSlot,
  MeasurementKey,
  ProductPrimitiveNode,
  ProductRenderAsset,
} from '@/lib/types';
import { createProceduralMannequinGroup } from '@/lib/procedural/mannequin';
import type { GarmentInstance as ProceduralGarmentInstance } from '@/lib/procedural/garmentTypes';
import { useGarmentStore } from '@/stores/garmentStore';
import { garmentRegistry } from '@/lib/procedural/garmentRegistry';
import type { PlatformGarmentInstance } from '@/lib/platform/garmentPlatform';
import { getProceduralTypeForGarment, resolveGarmentRenderParams } from '@/lib/platform/garmentPlatform';
import { LIGHTING_PRESETS, DEFAULT_LIGHTING_PRESET_ID } from '@/lib/constants/lightingPresets';
import { BodyProfile, createBodyProfile } from '@/lib/bodyProfile';

type MeshRegistry = Record<string, THREE.Mesh>;
type MaterialTextureProps = Pick<
  THREE.MeshStandardMaterialParameters,
  'map' | 'normalMap' | 'roughnessMap' | 'metalnessMap' | 'aoMap'
>;
type MaterialTextureUrls = Partial<Record<keyof MaterialTextureProps, string>>;
type SceneMeshBinding = {
  mesh: THREE.Mesh;
  semanticId: string | null;
  materialSlotId: string | null;
};
type MeasurementValues = Record<MeasurementKey, number | null>;

interface AssetDiagnostic {
  url: string;
  isGhost: boolean;
  status: 'loading' | 'success' | 'fallback' | 'error';
  nodes: {
    name: string;
    boundSemanticId: string | null;
    isMesh: boolean;
    isVisible: boolean;
  }[];
}

interface CachedTextureEntry {
  count: number;
  texture: THREE.Texture;
}

const textureLoader = new THREE.TextureLoader();
const textureCache = new Map<string, CachedTextureEntry>();
const disabledRaycast = () => undefined;
const selectedDecalEmissive = new THREE.Color('#EA931D');
const selectedMeshEmissive = new THREE.Color('#EA931D');
const fallbackNormalizedSceneHeight = 1.2;
const RESOURCE_OWNER = {
  PROCEDURAL: 'procedural',
  GLTF_CACHE: 'gltf-cache',
} as const;
const USE_IMPORTED_BODY_MODEL = false;

function acquireTexture(url: string, onLoad?: () => void): THREE.Texture {
  const cachedTexture = textureCache.get(url);

  if (cachedTexture) {
    cachedTexture.count += 1;
    const image = cachedTexture.texture.image as { complete?: boolean } | undefined;

    if (image?.complete) {
       // Already loaded
    } else {
       // Still loading, how to hook? We can't easily hook into existing TextureLoader
    }
    return cachedTexture.texture;
  }

  const texture = textureLoader.load(url, () => {
    if (onLoad) onLoad();
  });
  
  // Normal maps need to be NoColorSpace
  if (url.includes('normal')) {
    texture.colorSpace = THREE.NoColorSpace;
  }
  
  textureCache.set(url, { count: 1, texture });
  return texture;
}

function releaseTexture(url: string): void {
  const cachedTexture = textureCache.get(url);
  if (!cachedTexture) return;

  cachedTexture.count -= 1;

  if (cachedTexture.count <= 0) {
    cachedTexture.texture.dispose();
    textureCache.delete(url);
  }
}

function useCachedTexture(url: string | undefined): { texture?: THREE.Texture, version: number } {
  const [version, setVersion] = React.useState(0);

  const texture = useMemo(() => {
    if (!url) return undefined;
    return acquireTexture(url, () => setVersion(v => v + 1));
  }, [url]);

  useEffect(() => {
    if (!url) return undefined;
    return () => releaseTexture(url);
  }, [url]);

  return { texture, version };
}

/**
 * 1. MESH REGISTRY & MATERIAL BINDING
 * Ensures that R3F meshes correctly react to ProductState.
 */
const MaterialApplicator = React.memo(function MaterialApplicator({
  isSelected,
  mesh,
  materialSlot,
  isInteractive,
}: {
  isSelected: boolean;
  mesh: THREE.Mesh;
  materialSlot: MaterialSlot;
  isInteractive: boolean;
}) {
  const textureUrls = useMemo<MaterialTextureUrls>(() => ({
    map: materialSlot.maps.baseColorMap,
    normalMap: materialSlot.maps.normalMap,
    roughnessMap: materialSlot.maps.roughnessMap,
    metalnessMap: materialSlot.maps.metalnessMap,
    aoMap: materialSlot.maps.aoMap,
  }), [
    materialSlot.maps.aoMap,
    materialSlot.maps.baseColorMap,
    materialSlot.maps.metalnessMap,
    materialSlot.maps.normalMap,
    materialSlot.maps.roughnessMap,
  ]);

  const { texture: map, version: mapVersion } = useCachedTexture(textureUrls.map);
  const { texture: normalMap, version: normalMapVersion } = useCachedTexture(textureUrls.normalMap);
  const { texture: roughnessMap, version: roughnessMapVersion } = useCachedTexture(textureUrls.roughnessMap);
  const { texture: metalnessMap, version: metalMapVersion } = useCachedTexture(textureUrls.metalnessMap);
  const { texture: aoMap, version: aoMapVersion } = useCachedTexture(textureUrls.aoMap);

  const textures = useMemo<MaterialTextureProps>(() => {
    const nextTextures: MaterialTextureProps = {};
    
    const applyRepeat = (tex: THREE.Texture) => {
      if (materialSlot.textureRepeat) {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(materialSlot.textureRepeat, materialSlot.textureRepeat);
        tex.needsUpdate = true;
      }
      return tex;
    };

    if (map) nextTextures.map = applyRepeat(map);
    if (normalMap) nextTextures.normalMap = applyRepeat(normalMap);
    if (roughnessMap) nextTextures.roughnessMap = applyRepeat(roughnessMap);
    if (metalnessMap) nextTextures.metalnessMap = applyRepeat(metalnessMap);
    if (aoMap) nextTextures.aoMap = applyRepeat(aoMap);
    
    return nextTextures;
  }, [
    aoMap, map, metalnessMap, normalMap, roughnessMap, 
    materialSlot.textureRepeat,
    mapVersion, normalMapVersion, roughnessMapVersion, metalMapVersion, aoMapVersion
  ]);

  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: materialSlot.baseColor,
      roughness: materialSlot.roughness,
      metalness: materialSlot.metalness,
      opacity: materialSlot.opacity,
      transparent: materialSlot.opacity < 1,
      side: THREE.DoubleSide,
      emissive: isSelected ? selectedMeshEmissive : new THREE.Color('#000000'),
      emissiveIntensity: isSelected ? 0.16 : 0,
      ...textures
    });

    if (materialSlot.normalScale !== undefined && textures.normalMap) {
      mat.normalScale.set(materialSlot.normalScale, materialSlot.normalScale);
    }
    
    mat.needsUpdate = true;

    return mat;
  }, [isSelected, materialSlot, textures]);

  useEffect(() => {
    mesh.material = material;
    return () => {
      // Always dispose the generated material
      material.dispose();
      
      // ONLY dispose geometry if it was created procedurally for this specific mesh instance.
      if (mesh.userData.resourceOwner === RESOURCE_OWNER.PROCEDURAL) {
        mesh.geometry.dispose();
      }
    };
  }, [mesh, material]);

  useEffect(() => {
    const originalRaycast = mesh.raycast;
    mesh.raycast = isInteractive ? originalRaycast : disabledRaycast;

    return () => {
      mesh.raycast = originalRaycast;
    };
  }, [isInteractive, mesh]);

  return null; // Do not render primitive, just apply the material!
});

/**
 * 2. DECAL MANAGER
 * Renders decals anchored via UV, Mesh, or Projection.
 */
const MeshAnchoredDecal = React.memo(function MeshAnchoredDecal({
  decal,
  targetMesh,
}: {
  decal: DecalInstance;
  targetMesh: THREE.Mesh;
}) {
  const isSelected = useEditorStore((state) => (
    state.selection.type === 'decal' && state.selection.targetId === decal.id
  ));
  const selectTarget = useEditorStore((state) => state.selectTarget);
  const targetMeshRef = useMemo<React.RefObject<THREE.Mesh>>(() => ({ current: targetMesh }), [targetMesh]);
  const { texture } = useCachedTexture(decal.image);
  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    selectTarget({ type: 'decal', targetId: decal.id });
  }, [decal.id, selectTarget]);

  return (
    <Decal
      mesh={targetMeshRef}
      position={decal.anchor.position}
      rotation={decal.rotation}
      scale={decal.scale}
      onPointerDown={handlePointerDown}
    >
      <meshStandardMaterial
        map={texture}
        transparent
        opacity={decal.opacity}
        polygonOffset
        polygonOffsetFactor={-decal.zIndex - 1}
        emissive={isSelected ? selectedDecalEmissive : undefined}
        emissiveIntensity={isSelected ? 0.5 : 0}
      />
    </Decal>
  );
});

const DecalLayer = React.memo(function DecalLayer({ decals, meshRegistry }: { decals: DecalInstance[]; meshRegistry: MeshRegistry }) {
  const sortedDecals = useMemo(() => [...decals].sort((a, b) => a.zIndex - b.zIndex), [decals]);

  return (
    <>
      {sortedDecals.map((decal) => {
        const targetMesh = decal.anchor.meshId ? meshRegistry[decal.anchor.meshId] : null;

        if (!targetMesh) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[Studio3D] Skipping decal with missing mesh anchor:', decal.id, decal.anchor.meshId);
          }
          return null;
        }
        
        return (
          <MeshAnchoredDecal
            key={decal.id}
            decal={decal}
            targetMesh={targetMesh}
          />
        );
      })}
    </>
  );
});

function DecalLayerContainer({ meshRegistry }: { meshRegistry: MeshRegistry }) {
  const decals = useEditorStore((state) => state.product.decals);

  return <DecalLayer decals={decals} meshRegistry={meshRegistry} />;
}

function StudioOrbitControls() {
  const mode = useEditorStore((state) => state.configView.mode);
  const selection = useEditorStore((state) => state.selection);

  return (
    <OrbitControls
      enabled={mode !== 'edit' || !('targetId' in selection)}
      makeDefault
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 1.75}
    />
  );
}

function ImportedBodyModel({ bodyTypeId }: { bodyTypeId: string }) {
  const bodyConfig = getBodyTypeConfig(bodyTypeId);
  const modelPath = getModelPath(bodyTypeId);
  const [bodyScene, setBodyScene] = useState<THREE.Object3D | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loader = new ColladaLoader();

    setBodyScene(null);
    loader.load(
      modelPath,
      (collada) => {
        if (isMounted && collada?.scene) {
          setBodyScene(collada.scene);
        }
      },
      undefined,
      (error) => {
        if (isMounted) {
          console.warn('[Studio3D] Body model could not be loaded. Continuing without body context:', modelPath, error);
          setBodyScene(null);
        }
      },
    );

    return () => {
      isMounted = false;
    };
  }, [modelPath]);

  const normalizedBody = useMemo(() => {
    if (!bodyScene) return null;
    const scene = bodyScene.clone();
    const scale = (bodyConfig?.scale ?? 1) * 0.12;
    const position: [number, number, number] = [
      bodyConfig?.position[0] ?? 0,
      (bodyConfig?.position[1] ?? -1) + 0.28,
      (bodyConfig?.position[2] ?? 0) + 0.02,
    ];

    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return;

      const mesh = child as THREE.Mesh;
      mesh.raycast = disabledRaycast;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
    });

    return { position, scale, scene };
  }, [bodyConfig, bodyScene]);

  if (!normalizedBody) return null;

  return (
    <primitive
      object={normalizedBody.scene}
      position={normalizedBody.position}
      scale={normalizedBody.scale}
    />
  );
}

function SelectedBodyModel({
  bodyProfile,
  bodyTypeId,
}: {
  bodyProfile: BodyProfile;
  bodyTypeId: string;
}) {
  const proceduralBody = useMemo(() => createProceduralMannequinGroup(bodyProfile), [bodyProfile]);

  if (USE_IMPORTED_BODY_MODEL) {
    return <ImportedBodyModel bodyTypeId={bodyTypeId} />;
  }

  return <primitive object={proceduralBody} />;
}

function createPrimitiveGeometry(node: ProductPrimitiveNode): THREE.BufferGeometry | null {
  switch (node.primitive) {
    case 'garmentPanel': {
      const [
        shoulderWidth = 0.72,
        waistWidth = 0.52,
        height = 0.8,
        depth = 0.08,
        necklineWidth = 0.24,
        necklineDrop = 0.08,
        flareWidth = waistWidth,
        segments = 10,
      ] = node.args;
      const halfHeight = height / 2;
      const shape = new THREE.Shape();
      shape.moveTo(-shoulderWidth / 2, halfHeight - necklineDrop);
      shape.lineTo(-shoulderWidth / 2, halfHeight - necklineDrop * 1.9);
      shape.quadraticCurveTo(-flareWidth / 2, -halfHeight * 0.55, -waistWidth / 2, -halfHeight);
      shape.lineTo(waistWidth / 2, -halfHeight);
      shape.quadraticCurveTo(flareWidth / 2, -halfHeight * 0.55, shoulderWidth / 2, halfHeight - necklineDrop * 1.9);
      shape.lineTo(shoulderWidth / 2, halfHeight - necklineDrop);
      shape.quadraticCurveTo(necklineWidth / 2, halfHeight, 0, halfHeight - necklineDrop * 0.9);
      shape.quadraticCurveTo(-necklineWidth / 2, halfHeight, -shoulderWidth / 2, halfHeight - necklineDrop);

      return new THREE.ExtrudeGeometry(shape, {
        bevelEnabled: true,
        bevelSegments: 2,
        bevelSize: 0.012,
        bevelThickness: 0.012,
        curveSegments: segments,
        depth,
      }).center();
    }
    case 'tube': {
      const [
        radiusTop = 0.12,
        radiusBottom = 0.1,
        length = 0.5,
        radialSegments = 24,
        heightSegments = 1,
        openEndedFlag = 0,
      ] = node.args;

      return new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        length,
        radialSegments,
        heightSegments,
        Boolean(openEndedFlag),
      );
    }
    case 'cylinder': {
      const [
        radiusTop = 1,
        radiusBottom = 1,
        height = 1,
        radialSegments = 32,
        heightSegments = 1,
        openEndedFlag = 0,
        thetaStart = 0,
        thetaLength = Math.PI * 2,
      ] = node.args;

      return new THREE.CylinderGeometry(
        radiusTop,
        radiusBottom,
        height,
        radialSegments,
        heightSegments,
        Boolean(openEndedFlag),
        thetaStart,
        thetaLength,
      );
    }
    case 'torus': {
      const [radius = 1, tube = 0.4, radialSegments = 12, tubularSegments = 48, arc = Math.PI * 2] = node.args;
      return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
    }
    case 'capsule': {
      const [radius = 1, length = 1, capSegments = 8, radialSegments = 16] = node.args;
      return new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments);
    }
    case 'sphere': {
      const [radius = 1, widthSegments = 32, heightSegments = 16] = node.args;
      return new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    }
    default:
      return null;
  }
}

function applyNodeTransform(object: THREE.Object3D, node: ProductPrimitiveNode): void {
  if (node.position) object.position.set(...node.position);
  if (node.rotation) object.rotation.set(...node.rotation);
  if (node.scale) object.scale.set(...node.scale);
}

function withNodeArgs(node: ProductPrimitiveNode, updates: Partial<Record<number, number>>): ProductPrimitiveNode {
  const args = [...node.args];

  Object.entries(updates).forEach(([index, value]) => {
    if (value !== undefined) {
      args[Number(index)] = value;
    }
  });

  return { ...node, args };
}

function withNodePosition(node: ProductPrimitiveNode, updates: Partial<Record<0 | 1 | 2, number>>): ProductPrimitiveNode {
  const position: [number, number, number] = [...(node.position ?? [0, 0, 0])];

  Object.entries(updates).forEach(([index, value]) => {
    if (value !== undefined) {
      position[Number(index) as 0 | 1 | 2] = value;
    }
  });

  return { ...node, position };
}

function withNodeScale(node: ProductPrimitiveNode, updates: Partial<Record<0 | 1 | 2, number>>): ProductPrimitiveNode {
  const scale: [number, number, number] = [...(node.scale ?? [1, 1, 1])];

  Object.entries(updates).forEach(([index, value]) => {
    scale[Number(index) as 0 | 1 | 2] = value;
  });

  return { ...node, scale };
}

function resolveGarmentStyleNode(
  node: ProductPrimitiveNode,
  styleOptions: Record<string, string>,
): ProductPrimitiveNode | null {
  const neckline = styleOptions.neckline;
  const sleeveType = styleOptions.sleeveType;

  if (node.name === 'shirt-collar') {
    return neckline === 'collar' ? node : null;
  }

  if (node.name === 'gown-neckline-trim' && neckline === 'v-neck') {
    return withNodeScale(withNodePosition(node, { 1: 1.0 }), { 0: 0.72, 1: 0.36 });
  }

  if ((node.name === 'shirt-front' || node.name === 'gown-bodice-front') && neckline) {
    if (neckline === 'v-neck') {
      return withNodeArgs(node, { 4: 0.18, 5: 0.28 });
    }

    if (neckline === 'square') {
      return withNodeArgs(node, { 4: 0.34, 5: 0.16 });
    }

    if (neckline === 'collar') {
      return withNodeArgs(node, { 4: 0.2, 5: 0.07 });
    }

    return withNodeArgs(node, { 4: 0.26, 5: 0.1 });
  }

  if ((node.name === 'shirt-back' || node.name === 'gown-bodice-back') && neckline) {
    return withNodeArgs(node, { 5: neckline === 'v-neck' ? 0.08 : 0.04 });
  }

  if (node.name.includes('sleeve') && sleeveType) {
    if (sleeveType === 'sleeveless') {
      return null;
    }

    if (sleeveType === 'long') {
      return withNodeArgs(withNodeScale(node, { 1: 1.38 }), { 2: 0.88 });
    }

    if (sleeveType === 'three-quarter') {
      return withNodeArgs(withNodeScale(node, { 1: 1.18 }), { 2: 0.64 });
    }

    return withNodeArgs(withNodeScale(node, { 1: 1 }), { 2: node.name.startsWith('gown') ? 0.42 : 0.48 });
  }

  // --- 1. LENGTH ---
  if (node.name === 'gown-knee-length-hem' && styleOptions.length) {
    const length = styleOptions.length;
    const factor = length === 'midi' ? 1.4 : length === 'ankle' ? 2.0 : 1.0;
    const offset = (factor - 1.0) * 0.45;
    return withNodeArgs(withNodePosition(node, { 1: node.position![1] - offset }), { 2: 1.08 * factor });
  }

  if ((node.name === 'trouser-left-leg' || node.name === 'trouser-right-leg') && styleOptions.length) {
    const length = styleOptions.length;
    const factor = length === 'ankle' ? 0.9 : length === 'cropped' ? 0.75 : 1.0;
    const offset = (factor - 1.0) * 0.6;
    return withNodeArgs(withNodePosition(node, { 1: node.position![1] + offset }), { 2: 1.28 * factor });
  }

  // --- 2. FLARE ---
  if (node.name === 'gown-knee-length-hem' && styleOptions.flare) {
    const flare = styleOptions.flare;
    const factor = flare === 'straight' ? 0.75 : flare === 'full' ? 1.5 : 1.0;
    return withNodeArgs(node, { 6: 1.08 * factor });
  }

  // --- 3. VARIANTS (Mesh Switching) ---
  if (node.primitive === 'model' && node.url && styleOptions.fit) {
    const fit = styleOptions.fit;
    // Example: /models/garments/shirt_regular.glb -> /models/garments/shirt_slim.glb
    if (fit === 'slim' || fit === 'fitted') {
      return { ...node, url: node.url.replace('_regular', '_slim') };
    }
    if (fit === 'relaxed' || fit === 'oversized') {
      return { ...node, url: node.url.replace('_regular', '_oversized') };
    }
  }

  return node;
}

function resolveGarmentStyleNodes(
  renderAsset: ProductRenderAsset | undefined,
  styleOptions: Record<string, string>,
): ProductRenderAsset | undefined {
  if (!renderAsset || renderAsset.type !== 'primitive') return renderAsset;

  const resolvedNodes = renderAsset.nodes
    .map((node) => resolveGarmentStyleNode(node, styleOptions))
    .filter((node): node is ProductPrimitiveNode => node !== null);

  // --- 3. CLOSURE (Visual Hints) ---
  const closure = styleOptions.closure;
  const fabricSlotId = renderAsset.nodes[0]?.materialSlotId || 'default-fabric';
  const isProceduralShirt = renderAsset.nodes.some((n) => (
    n.name.startsWith('tshirt')
    || n.primitive === 'procedural-tshirt'
  ));

  if (isProceduralShirt && styleOptions.neckline === 'collar') {
    resolvedNodes.push({
      name: 'Collar_Base',
      primitive: 'torus',
      args: [0.09, 0.008, 12, 64],
      position: [0, 0.84, 0.035],
      rotation: [Math.PI / 2, 0, 0],
      scale: [1.35, 0.52, 1],
      materialSlotId: fabricSlotId,
    });
  }

  if (closure === 'buttons') {
    const isShirt = renderAsset.nodes.some((n) => (
      n.name.startsWith('shirt')
      || n.name.startsWith('tshirt')
      || n.primitive === 'procedural-tshirt'
    ));
    const buttonPositions: [number, number, number][] = isShirt
      ? [[0, 0.88, 0.12], [0, 0.78, 0.12], [0, 0.68, 0.12], [0, 0.58, 0.12], [0, 0.48, 0.12]]
      : [[0, 0.92, 0.12], [0, 0.82, 0.12], [0, 0.72, 0.12], [0, 0.62, 0.12]];

    buttonPositions.forEach((pos, i) => {
      resolvedNodes.push({
        name: `closure-button-${i}`,
        primitive: 'sphere',
        args: [0.01, 16, 8],
        position: pos,
      });
    });
  } else if (closure === 'back zip' || closure === 'side zip' || closure === 'zip fly') {
    const isBack = closure === 'back zip';
    const isSide = closure === 'side zip';
    const isTrouser = closure === 'zip fly';

    resolvedNodes.push({
      name: 'closure-zip',
      primitive: 'cylinder',
      args: [0.004, 0.004, isTrouser ? 0.2 : 0.4, 8],
      position: [
        isSide ? 0.25 : 0,
        isTrouser ? 0.15 : 0.75,
        isBack ? -0.15 : 0.12
      ],
      rotation: [0, 0, 0],
      materialSlotId: fabricSlotId,
    });
  }

  return {
    ...renderAsset,
    nodes: resolvedNodes,
  };
}

function createSceneFromRenderAsset(
  renderAsset: ProductRenderAsset | undefined,
  loadedModels: Record<string, THREE.Group> = {},
  resolveSemantic: (name: string) => string | null = () => null,
  activeGarment: ProceduralGarmentInstance | null = null,
  activeGarmentInstance: PlatformGarmentInstance | null = null,
  bodyProfile?: BodyProfile,
  styleOptions: Record<string, string> = {},
): { scene: THREE.Group; diagnostics: AssetDiagnostic[] } {
  const scene = new THREE.Group();
  const diagnostics: AssetDiagnostic[] = [];

  if (!renderAsset) {
    return { scene, diagnostics };
  }

  const modelUrls = new Set<string>();
  if (renderAsset.type === 'model') modelUrls.add(renderAsset.url);
  if (renderAsset.type === 'primitive') {
    renderAsset.nodes.forEach(n => { if (n.primitive === 'model' && n.url) modelUrls.add(n.url); });
  }

  if (renderAsset.type === 'primitive') {
    renderAsset.nodes.forEach((node: ProductPrimitiveNode) => {
      if (node.primitive === 'model' && node.url) {
      const model = loadedModels[node.url];
      const diag: AssetDiagnostic = { 
        url: node.url, 
        isGhost: !model, 
        status: model ? 'success' : 'fallback',
        nodes: []
      };
      
      if (model) {
        const clonedModel = model.clone();
        clonedModel.name = node.name;
        applyNodeTransform(clonedModel, node);
        
        clonedModel.traverse((child) => {
          const mesh = child as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.userData.resourceOwner = RESOURCE_OWNER.GLTF_CACHE;
            mesh.name = mesh.name || node.name; 
            diag.nodes.push({
              name: mesh.name,
              boundSemanticId: resolveSemantic(mesh.name),
              isMesh: true,
              isVisible: mesh.visible
            });
          }
        });

        scene.add(clonedModel);
      } else {
        const fallbackGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
        const fallbackMat = new THREE.MeshStandardMaterial({ 
          color: '#ff3333', 
          wireframe: true,
          transparent: true,
          opacity: 0.4
        });
        const mesh = new THREE.Mesh(fallbackGeo, fallbackMat);
        mesh.userData.resourceOwner = RESOURCE_OWNER.PROCEDURAL;
        mesh.name = node.name;
        applyNodeTransform(mesh, node);
        scene.add(mesh);

        diag.nodes.push({
          name: node.name,
          boundSemanticId: resolveSemantic(node.name),
          isMesh: true,
          isVisible: true
        });
      }
      diagnostics.push(diag);
      return;
    }

    if (node.primitive.startsWith('procedural-')) {
      const garmentType = node.primitive.replace('procedural-', '');
      const generator = garmentRegistry[garmentType as keyof typeof garmentRegistry]?.generate;

      if (generator) {
        const activeProceduralType = activeGarmentInstance
          ? getProceduralTypeForGarment(activeGarmentInstance.type)
          : null;
        const paramsToUse = activeGarmentInstance && activeProceduralType === garmentType
          ? resolveGarmentRenderParams(activeGarmentInstance, { bodyProfile })
          : activeGarment && activeGarment.type === garmentType
            ? activeGarment.params
            : undefined;

        const group = generator(paramsToUse, { bodyProfile });
        group.name = node.name;
        if (garmentType === 'tshirt' && styleOptions.sleeveType === 'sleeveless') {
          [...group.children].forEach((child) => {
            if (child.name.includes('Sleeve')) group.remove(child);
          });
        }
        
        const diag: AssetDiagnostic = { 
          url: node.primitive, 
          isGhost: false, 
          status: 'success',
          nodes: []
        };

        const drawstringMaterial = new THREE.MeshStandardMaterial({
          color: "#f5f5f5",
          roughness: 0.85,
        });

        group.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (mesh.userData.isSolidColor) {
               mesh.material = drawstringMaterial;
            } else {
               mesh.material = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide });
            }
            mesh.userData.resourceOwner = RESOURCE_OWNER.PROCEDURAL;
            
            diag.nodes.push({
              name: mesh.name,
              boundSemanticId: resolveSemantic(mesh.name),
              isMesh: true,
              isVisible: mesh.visible
            });
          }
        });

        scene.add(group);
        diagnostics.push(diag);
        return;
      }
    }

    const geometry = createPrimitiveGeometry(node);
    if (!geometry) return;

    const material = new THREE.MeshStandardMaterial({
      color: node.name.startsWith('closure-button') ? '#24211d' : '#ffffff',
      side: THREE.DoubleSide,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.resourceOwner = RESOURCE_OWNER.PROCEDURAL;
    mesh.name = node.name;
    applyNodeTransform(mesh, node);
    scene.add(mesh);
  });
  }

  return { scene, diagnostics };
}

function normalizeSceneBounds(scene: THREE.Group, targetHeight: number): void {
  const bounds = new THREE.Box3().setFromObject(scene);
  const size = bounds.getSize(new THREE.Vector3());

  if (size.lengthSq() === 0) return;

  const center = bounds.getCenter(new THREE.Vector3());
  const scale = targetHeight / Math.max(size.y, 0.001);

  scene.position.sub(center).multiplyScalar(scale);
  scene.scale.multiplyScalar(scale);
}

function translateScene(scene: THREE.Group, offset: [number, number, number] | undefined): void {
  if (!offset) return;

  const translation = new THREE.Vector3(...offset);
  scene.position.add(translation);
}

function isProceduralRenderAsset(renderAsset: ProductRenderAsset | undefined): boolean {
  return renderAsset?.type === 'primitive'
    && renderAsset.nodes.some((node) => node.primitive.startsWith('procedural-'));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function measurementFactor(
  measurements: MeasurementValues,
  key: MeasurementKey,
  baseline: number,
  sensitivity: number,
): number {
  const value = measurements[key];
  if (value === null || value === undefined) return 1;

  return clamp(1 + ((value - baseline) / baseline) * sensitivity, 0.7, 1.45);
}

function fitLoosenessFactor(fit: string | undefined): number {
  if (fit === 'slim' || fit === 'fitted' || fit === 'straight') return 0.94;
  if (fit === 'relaxed') return 1.1;
  return 1;
}

function applyGarmentPreviewRules(
  scene: THREE.Group,
  measurements: MeasurementValues,
  styleOptions: Record<string, string>,
): void {
  const fitFactor = fitLoosenessFactor(styleOptions.fit);
  const torsoWidthFactor = measurementFactor(measurements, 'chest', 38, 0.35)
    * measurementFactor(measurements, 'bust', 38, 0.35)
    * measurementFactor(measurements, 'waist', 32, 0.2)
    * fitFactor;
  const hipWidthFactor = measurementFactor(measurements, 'hip', 40, 0.3) * fitFactor;
  const garmentLengthFactor = measurementFactor(measurements, 'length', 40, 0.45);
  const sleeveLengthFactor = measurementFactor(measurements, 'sleeve', 12, 0.55);
  const trouserLengthFactor = measurementFactor(measurements, 'inseam', 30, 0.5)
    * measurementFactor(measurements, 'length', 40, 0.2);
  const thighWidthFactor = measurementFactor(measurements, 'thigh', 22, 0.35) * fitFactor;

  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh;
    const meshName = mesh.name;

    if (meshName.includes('gown-bodice') || meshName.includes('shirt-front') || meshName.includes('shirt-back')) {
      mesh.scale.x *= torsoWidthFactor;
      mesh.scale.z *= clamp(torsoWidthFactor, 0.85, 1.25);
    }

    if (meshName.includes('gown-knee-length-hem')) {
      mesh.scale.x *= hipWidthFactor;
      mesh.scale.y *= garmentLengthFactor;
      mesh.scale.z *= clamp(hipWidthFactor, 0.85, 1.25);
      mesh.position.y -= (garmentLengthFactor - 1) * 0.25;
    }

    if (meshName.includes('sleeve')) {
      mesh.scale.y *= sleeveLengthFactor;
      mesh.scale.x *= clamp(torsoWidthFactor, 0.85, 1.18);
      mesh.scale.z *= clamp(torsoWidthFactor, 0.85, 1.18);
    }

    if (meshName.includes('trouser-left-leg') || meshName.includes('trouser-right-leg')) {
      mesh.scale.y *= trouserLengthFactor;
      mesh.scale.x *= thighWidthFactor;
      mesh.scale.z *= thighWidthFactor;
      mesh.position.y -= (trouserLengthFactor - 1) * 0.28;
    }

    if (meshName.includes('trouser-waistband')) {
      const waistFactor = measurementFactor(measurements, 'waist', 32, 0.45) * fitFactor;
      mesh.scale.x *= waistFactor;
      mesh.scale.y *= clamp(waistFactor, 0.85, 1.2);
    }
  });
}

function disposeSceneResources(scene: THREE.Group): void {
  scene.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;

    const mesh = child as THREE.Mesh;
    const owner = mesh.userData.resourceOwner;
    
    // Procedural resources (primtive fallbacks or base primitives) should be cleaned up.
    // Models from gltf-cache should stay resident in memory (managed by useLoader/GLTFLoader cache).
    if (owner === RESOURCE_OWNER.PROCEDURAL) {
      mesh.geometry.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((m) => m.dispose());
    }
  });
}

function useProductScene(
  measurements: MeasurementValues,
  renderAsset: ProductRenderAsset | undefined,
  styleOptions: Record<string, string>,
  loadedModels: Record<string, THREE.Group> = {},
  resolveSemantic: (name: string) => string | null,
  activeGarment: ProceduralGarmentInstance | null = null,
  activeGarmentInstance: PlatformGarmentInstance | null = null,
  bodyProfile?: BodyProfile,
): { scene: THREE.Group; diagnostics: AssetDiagnostic[] } {
  const result = useMemo(() => {
    const resolvedRenderAsset = resolveGarmentStyleNodes(renderAsset, styleOptions);
    const { scene: nextScene, diagnostics } = createSceneFromRenderAsset(
      resolvedRenderAsset,
      loadedModels,
      resolveSemantic,
      activeGarment,
      activeGarmentInstance,
      bodyProfile,
      styleOptions,
    );
    const isProcedural = isProceduralRenderAsset(resolvedRenderAsset);

    if (!isProcedural) {
      applyGarmentPreviewRules(nextScene, measurements, styleOptions);
      const targetHeight = resolvedRenderAsset?.type === 'primitive'
        ? resolvedRenderAsset.normalizedHeight ?? fallbackNormalizedSceneHeight
        : fallbackNormalizedSceneHeight;
      normalizeSceneBounds(nextScene, targetHeight);
      translateScene(nextScene, resolvedRenderAsset?.type === 'primitive' ? resolvedRenderAsset.position : undefined);
    }

    return { scene: nextScene, diagnostics };
  }, [activeGarment, activeGarmentInstance, bodyProfile, measurements, renderAsset, styleOptions, loadedModels, resolveSemantic]);

  useEffect(() => {
    return () => disposeSceneResources(result.scene);
  }, [result.scene]);

  return result;
}

/**
 * 3. INTERACTION & INTENT MANAGER
 * Centralized raycasting for selection and stamping.
 */
function InteractionHandler({
  allowedDecalMeshIds,
  children,
  resolveSemantic,
}: {
  allowedDecalMeshIds: Set<string>;
  children: React.ReactNode;
  resolveSemantic: (name: string) => string | null;
}) {
  const getInteractionIntent = useEditorStore((state) => state.getInteractionIntent);
  const selectTarget = useEditorStore((state) => state.selectTarget);
  const addDecalInstance = useEditorStore((state) => state.addDecalInstance);
  const activeDecalUrl = useEditorStore((state) => state.activeDecalUrl);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const intent = getInteractionIntent();
    const meshName = e.object.name || e.object.uuid;
    const semanticId = resolveSemantic(meshName);
    const targetMesh = (e.object as THREE.Mesh).isMesh ? e.object as THREE.Mesh : null;
    const isBoundTarget = !!semanticId;

    if (intent === 'select') {
      if (isBoundTarget) {
        console.log('[Studio3D] Selected Semantic ID:', semanticId);
        selectTarget({ type: 'mesh', targetId: semanticId });
      } else {
        console.warn('[Studio3D] No semantic binding for:', meshName);
        selectTarget({ type: 'none' });
      }
    } else if (intent === 'stamp' && activeDecalUrl && isBoundTarget && targetMesh && e.face) {
      if (!allowedDecalMeshIds.has(semanticId)) {
        console.warn('[Studio3D] Cannot stamp decal outside allowed garment zones:', semanticId);
        return;
      }

      const localPoint = targetMesh.worldToLocal(e.point.clone());
      const normal = e.face.normal.clone().normalize();

      addDecalInstance({
        image: activeDecalUrl,
        anchor: {
          type: 'mesh',
          meshId: semanticId,
          position: [localPoint.x, localPoint.y, localPoint.z],
          normal: [normal.x, normal.y, normal.z],
        },
        scale: 0.2,
        rotation: 0,
        opacity: 1.0
      });
    } else if (intent === 'stamp') {
      console.warn('[Studio3D] Cannot stamp decal on unbound or invalid mesh:', meshName);
    }
  }, [activeDecalUrl, addDecalInstance, allowedDecalMeshIds, getInteractionIntent, resolveSemantic, selectTarget]);

  return (
    <group onPointerDown={handlePointerDown}>
      {children}
    </group>
  );
}

function AssetInspector({ diagnostics }: { diagnostics: AssetDiagnostic[] }) {
  if (diagnostics.length === 0) return null;

  return (
    <div className="absolute right-6 top-6 z-20 flex w-72 flex-col gap-4 overflow-hidden rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-xl transition-all hover:bg-black/60">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-white/40">Asset Inspector</h3>
        <div className="flex gap-1.5">
          {diagnostics.some(d => d.isGhost) && (
            <span className="flex h-2 w-2 animate-pulse rounded-full bg-red-500" title="Fallback Active" />
          )}
          <span className="flex h-2 w-2 rounded-full bg-green-500" title="Engine Online" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {diagnostics.map((diag, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg bg-white/5 p-3 text-[10px]">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[9px] text-white/30 truncate" title={diag.url}>{diag.url.split('/').pop()}</span>
              <div className="flex items-center gap-2">
                <span className={`h-1.5 w-1.5 rounded-full ${diag.isGhost ? 'bg-red-400' : 'bg-emerald-400'}`} />
                <span className={`font-bold uppercase tracking-tight ${diag.isGhost ? 'text-red-400' : 'text-emerald-400'}`}>
                  {diag.isGhost ? 'GHOST FALLBACK' : 'PRODUCTION ASSET'}
                </span>
              </div>
            </div>

            <div className="mt-1 flex flex-col gap-1.5 border-t border-white/5 pt-2">
              <p className="text-[9px] font-semibold text-white/20">Discovery & Binding</p>
              {diag.nodes.map((node, ni) => (
                <div key={ni} className="flex items-center justify-between gap-2">
                  <span className="truncate text-white/60" title={node.name}>{node.name}</span>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {node.boundSemanticId ? (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold text-emerald-400/80">
                        {node.boundSemanticId}
                      </span>
                    ) : (
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[8px] font-medium text-white/20">
                        unbound
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {diagnostics.some(d => d.isGhost) && (
        <div className="mt-2 rounded-md bg-red-500/10 p-2 text-center ring-1 ring-inset ring-red-500/20">
          <p className="text-[9px] font-bold text-red-400 uppercase">⚠️ Ingestion Error</p>
          <p className="mt-0.5 text-[8px] leading-tight text-red-300/60">One or more GLB files are missing from public/models/garments/</p>
        </div>
      )}
    </div>
  );
}

/**
 * MAIN STUDIO3D COMPONENT
 */
export function Studio3D({ modelUrl, bodyTypeId }: { modelUrl?: string; bodyTypeId: string }) {
  const renderAsset = useEditorStore((state) => state.product.renderAsset);
  
  // Extract all model URLs from the renderAsset to pre-load them
  const modelUrls = useMemo(() => {
    const urls = new Set<string>();
    if (renderAsset?.type === 'model') urls.add(renderAsset.url);
    if (renderAsset?.type === 'primitive') {
      renderAsset.nodes.forEach((node) => {
        if (node.primitive === 'model' && node.url) urls.add(node.url);
      });
    }
    return Array.from(urls);
  }, [renderAsset]);

  // Load all required garment models
  // Note: we're using GLTFLoader for now as it's the industry standard for garment assets
  const loadedGltfResults = useLoader(
    GLTFLoader,
    modelUrls,
    (loader) => {
      // Optional: add loading progress/error handling
    },
    // Error handler
    (error) => {
      console.error('[Studio3D] Failed to load garment models:', error);
    }
  );
  const loadedModels = useMemo(() => {
    const map: Record<string, THREE.Group> = {};
    modelUrls.forEach((url, i) => {
      map[url] = loadedGltfResults[i].scene;
    });
    return map;
  }, [modelUrls, loadedGltfResults]);

  const productBindings = useEditorStore((state) => state.product.bindings);
  const productMeshes = useEditorStore((state) => state.product.meshes);
  const productMaterials = useEditorStore((state) => state.product.materials);
  const decalZones = useEditorStore((state) => state.selectedGarmentDefinition.decalZones);
  const measurementValues = useEditorStore((state) => state.measurementValues);
  const selectedStyleOptions = useEditorStore((state) => state.selectedStyleOptions);
  const sceneVersion = useEditorStore((state) => state.configView.sceneVersion);
  const activeLightingPresetId = useEditorStore((state) => state.activeLightingPresetId);

  const activeLightingPreset = LIGHTING_PRESETS[activeLightingPresetId] || LIGHTING_PRESETS[DEFAULT_LIGHTING_PRESET_ID];
  const viewMode = useEditorStore((state) => state.configView.mode);
  const selection = useEditorStore((state) => state.selection);
  const activeGarment = useGarmentStore((state) => state.activeGarment);
  const activeGarmentInstanceId = useGarmentStore((state) => state.activeGarmentInstanceId);
  const garmentInstances = useGarmentStore((state) => state.garmentInstances);
  const activeGarmentInstance = useMemo(() => (
    garmentInstances.find((garment) => garment.id === activeGarmentInstanceId)
      ? {
          ...garmentInstances.find((garment) => garment.id === activeGarmentInstanceId)!,
          styleOptions: selectedStyleOptions,
        }
      : null
  ), [activeGarmentInstanceId, garmentInstances, selectedStyleOptions]);
  const bodyProfile = useMemo(() => (
    createBodyProfile(bodyTypeId, measurementValues)
  ), [bodyTypeId, measurementValues]);

  const materialSlotByMeshName = useMemo(() => {
    const slots: Record<string, string> = {};

    if (renderAsset?.type !== 'primitive') return slots;

    renderAsset.nodes.forEach((node) => {
      if (node.materialSlotId) {
        slots[node.name] = node.materialSlotId;
      }
    });

    return slots;
  }, [renderAsset]);

  // Binding Resolver: Maps GLB node names to semantic IDs
  const resolveMeshSemantic = useMemo(() => {
    const map: Record<string, string> = {};
    const seenSemantics = new Set<string>();

    productBindings.forEach((b) => {
      // 2. One-to-One Validation (Dev Only Warning)
      if (process.env.NODE_ENV === 'development' && seenSemantics.has(b.semanticId)) {
        console.warn(`[Studio3D] Duplicate semanticId binding: ${b.semanticId}. Each part should map to a single mesh.`);
      }
      seenSemantics.add(b.semanticId);
      map[b.meshName] = b.semanticId;
    });

    return (nodeName: string) => {
      return map[nodeName] || null;
    };
  }, [productBindings, renderAsset]);

  const { scene, diagnostics } = useProductScene(
    measurementValues,
    renderAsset,
    selectedStyleOptions,
    loadedModels,
    resolveMeshSemantic,
    activeGarment,
    activeGarmentInstance,
    bodyProfile,
  );
  const allowedDecalMeshIds = useMemo(() => (
    new Set(decalZones.map((zone) => zone.meshId))
  ), [decalZones]);

  useEffect(() => {
    if (modelUrl && process.env.NODE_ENV === 'development') {
      console.warn('[Studio3D] modelUrl prop ignored because ProductState.renderAsset is the renderer source of truth:', modelUrl);
    }
  }, [modelUrl]);

  // Mesh Invalidation Logic
  const { meshes, meshRegistry } = useMemo(() => {
    const list: SceneMeshBinding[] = [];
    const registry: MeshRegistry = {};

    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        const semanticId = resolveMeshSemantic(mesh.name);
        const validSemanticId = semanticId && productMeshes[semanticId] ? semanticId : null;
        const materialSlotId = validSemanticId
          ? productMeshes[validSemanticId].materialSlotId
          : materialSlotByMeshName[mesh.name] || null;

        if (validSemanticId) {
          registry[validSemanticId] = mesh;
        }
        
        if (validSemanticId && !productMeshes[validSemanticId].visible) {
          return;
        }

        list.push({
          mesh,
          semanticId: validSemanticId,
          materialSlotId,
        });
      }
    });
    return { meshes: list, meshRegistry: registry };
  }, [materialSlotByMeshName, scene, resolveMeshSemantic, productMeshes, sceneVersion]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[var(--background)]">
      <AssetInspector diagnostics={diagnostics} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0)_34%),linear-gradient(90deg,rgba(234,147,29,0.08),rgba(255,255,255,0)_28%,rgba(255,255,255,0)_72%,rgba(234,147,29,0.06))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 border-t border-white/5 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0.01))]" />
      <div className="pointer-events-none absolute left-6 top-6 z-10 w-64 rounded-xl border border-white/10 bg-black/40 p-3 backdrop-blur-md text-[10px] font-mono text-white/70 shadow-2xl">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
          <span className="font-bold uppercase tracking-widest text-emerald-400">Moatt Debug</span>
          <span className="bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded text-[8px]">V2</span>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-white/40">Garment</span>
            <span className="text-white font-medium">{activeGarment?.type || 'none'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Selection</span>
            <span className="text-white font-medium">{selection.type === 'mesh' ? selection.targetId : selection.type}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Material</span>
            <span className="text-[#EA931D] font-medium">
              {selection.type === 'mesh' && selection.targetId && productMeshes[selection.targetId] 
                ? (productMaterials[productMeshes[selection.targetId].materialSlotId || '']?.fabricPresetId || 'default') 
                : 'none'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Lighting</span>
            <span className="text-blue-300 font-medium">{activeLightingPresetId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Mesh Nodes</span>
            <span className="text-white font-medium">{meshes.length}</span>
          </div>
        </div>
      </div>
      <ErrorBoundary>
        <Canvas 
          shadows="percentage"
          dpr={[1, 2]} 
          gl={{ 
            preserveDrawingBuffer: true,
            antialias: true,
            powerPreference: "high-performance",
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: activeLightingPreset.exposure,
            outputColorSpace: THREE.SRGBColorSpace,
          }}
        >
        <PerspectiveCamera makeDefault position={[0, 0.45, 5.2]} fov={35} />
        


        <ContactShadows
          position={[0, -0.82, 0]}
          opacity={viewMode === 'preview' ? 0.48 : 0.3}
          scale={9}
          blur={2.4}
          far={4}
        />

        <Suspense fallback={null}>
          {/* Environment Lighting */}
          <Environment 
            preset={activeLightingPreset.dreiPreset as any} 
            background={activeLightingPreset.background} 
            backgroundBlurriness={activeLightingPreset.backgroundBlur || 0}
            environmentIntensity={activeLightingPreset.environmentIntensity} 
          />

          {/* Optional Key Light */}
          {activeLightingPreset.keyLight?.enabled && (
            <directionalLight 
              position={activeLightingPreset.keyLight.position} 
              intensity={activeLightingPreset.keyLight.intensity} 
              castShadow 
              shadow-mapSize={[1024, 1024]}
              shadow-bias={-0.001}
            />
          )}
        </Suspense>

        <InteractionHandler allowedDecalMeshIds={allowedDecalMeshIds} resolveSemantic={resolveMeshSemantic}>
          <group>
            <Suspense fallback={null}>
              <SelectedBodyModel bodyProfile={bodyProfile} bodyTypeId={bodyTypeId} />
            </Suspense>
            <primitive object={scene} />
            {meshes.map(({ mesh, semanticId, materialSlotId }) => {
              const materialSlot = materialSlotId ? productMaterials[materialSlotId] : null;
              const isSelected = selection.type === 'mesh' && selection.targetId === semanticId;
              
              if (!materialSlot) return null;

              return (
                <MaterialApplicator
                  key={mesh.uuid}
                  isSelected={isSelected}
                  mesh={mesh}
                  materialSlot={materialSlot}
                  isInteractive={!!semanticId}
                />
              );
            })}
            <DecalLayerContainer meshRegistry={meshRegistry} />
          </group>
        </InteractionHandler>

        <StudioOrbitControls />
      </Canvas>
      </ErrorBoundary>
    </div>
  );
}
