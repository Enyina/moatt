'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Engine } from '@babylonjs/core/Engines/engine';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Scene } from '@babylonjs/core/scene';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { createProceduralMannequinGroup } from '../../lib/procedural/mannequin';
import { createProceduralTShirtGroup } from '../../lib/procedural/tshirt';
import { getGarmentDefinition } from '../../lib/platform/garmentPlatform';
import type { DecalInstance, GarmentInstance, MaterialSlot, ProductPrimitiveNode } from '../../lib/types';
import type { StudioState } from '../core/types';
import { createBabylonMeshesFromThreeGroup, type ThreeMeshGeometryData } from './threeToBabylon';
import {
  createStudioBodyProfile,
  resolveStudioGarmentRenderInput,
} from './studioRenderInputs';

interface BabylonStudioViewportProps {
  studio: StudioState;
}

interface ViewportDiagnostics {
  error: string | null;
  meshCount: number;
  renderableGarments: number;
}

function createMaterial(scene: Scene, name: string, color: Color3): StandardMaterial {
  const material = new StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.specularColor = new Color3(0.08, 0.08, 0.08);
  return material;
}

function colorFromSlot(slot: Partial<MaterialSlot> | undefined, fallback = '#EA931D'): Color3 {
  return Color3.FromHexString(slot?.baseColor ?? fallback);
}

function createMaterialFromSlot(
  scene: Scene,
  name: string,
  slot: Partial<MaterialSlot> | undefined,
  fallback = '#EA931D',
): StandardMaterial {
  const material = createMaterial(scene, name, colorFromSlot(slot, fallback));
  material.roughness = slot?.roughness ?? 0.72;
  material.alpha = slot?.opacity ?? 1;
  if (slot?.maps?.baseColorMap) {
    const texture = new Texture(slot.maps.baseColorMap, scene, false, false);
    texture.uScale = slot.textureRepeat ?? 1;
    texture.vScale = slot.textureRepeat ?? 1;
    material.diffuseTexture = texture;
  }
  return material;
}

function applyNodeTransform(mesh: ReturnType<typeof MeshBuilder.CreateBox>, node: ProductPrimitiveNode) {
  if (node.position) mesh.position = new Vector3(...node.position);
  if (node.rotation) mesh.rotation = new Vector3(...node.rotation);
  if (node.scale) mesh.scaling = new Vector3(...node.scale);
}

function createPrimitiveGarmentMeshes(scene: Scene, garment: GarmentInstance): number {
  const definition = getGarmentDefinition(garment.type);
  if (definition.renderAsset.type !== 'primitive') return 0;

  let count = 0;
  definition.renderAsset.nodes.forEach((node) => {
    if (node.primitive === 'procedural-tshirt' || node.primitive === 'procedural-hoodie') return;

    const materialSlot = garment.materials[node.materialSlotId ?? definition.materialSlots[0]?.id ?? ''];
    const material = createMaterialFromSlot(scene, `${garment.id}-${node.name}-material`, materialSlot, '#D7C9BA');
    const args = node.args;
    const mesh = node.primitive === 'torus'
      ? MeshBuilder.CreateTorus(node.name, {
          diameter: args[0] ?? 0.4,
          thickness: args[1] ?? 0.03,
          tessellation: args[3] ?? 48,
        }, scene)
      : node.primitive === 'tube'
        ? MeshBuilder.CreateCylinder(node.name, {
            diameterTop: (args[1] ?? 0.14) * 2,
            diameterBottom: (args[0] ?? 0.18) * 2,
            height: args[2] ?? 1,
            tessellation: args[3] ?? 32,
          }, scene)
        : MeshBuilder.CreateCylinder(node.name, {
            diameterTop: (args[1] ?? args[0] ?? 0.3) * 2,
            diameterBottom: (args[0] ?? 0.3) * 2,
            height: args[2] ?? 1,
            tessellation: args[3] ?? 32,
          }, scene);

    mesh.material = material;
    applyNodeTransform(mesh, node);
    mesh.metadata = {
      garmentInstanceId: garment.id,
      garmentType: garment.type,
      materialSlotId: node.materialSlotId,
      source: 'platform-primitive',
    };
    count += 1;
  });

  return count;
}

function decalPosition(decal: DecalInstance): Vector3 {
  const [x, y, z] = decal.anchor.position;
  const isBack = decal.anchor.meshId?.includes('back');
  return new Vector3(x, 0.62 + y, z + (isBack ? -0.305 : 0.305));
}

function createDecalMeshes(scene: Scene, garment: GarmentInstance): number {
  return garment.decals.reduce((count, decal) => {
    const mesh = MeshBuilder.CreatePlane(`${garment.id}-${decal.id}`, {
      size: decal.scale,
    }, scene);
    const material = createMaterial(scene, `${garment.id}-${decal.id}-material`, Color3.White());
    material.emissiveColor = Color3.White();
    material.alpha = decal.opacity;
    if (decal.image && decal.image !== 'studio-generated-mark') {
      material.diffuseTexture = new Texture(decal.image, scene, false, false);
    }
    mesh.material = material;
    mesh.position = decalPosition(decal);
    mesh.rotation.y = decal.anchor.meshId?.includes('back') ? Math.PI : 0;
    mesh.rotation.z = decal.rotation;
    mesh.metadata = {
      garmentInstanceId: garment.id,
      decalId: decal.id,
      source: 'studio-decal',
    };
    return count + 1;
  }, 0);
}

export function BabylonStudioViewport({ studio }: BabylonStudioViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [diagnostics, setDiagnostics] = useState<ViewportDiagnostics>({
    error: null,
    meshCount: 0,
    renderableGarments: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const engine = new Engine(canvas, true, {
      antialias: true,
      preserveDrawingBuffer: true,
      stencil: true,
    });
    const scene = new Scene(engine);
    scene.clearColor.set(0.055, 0.055, 0.055, 1);

    const alphaByView = {
      front: Math.PI / 2,
      side: Math.PI,
      back: Math.PI * 1.5,
      'three-quarter': Math.PI * 1.25,
    };
    const camera = new ArcRotateCamera(
      'studio-camera',
      alphaByView[studio.camera.view],
      Math.PI * 0.42,
      3.2,
      new Vector3(0, 0.8, 0),
      scene,
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 1.8;
    camera.upperRadiusLimit = 5;

    const light = new HemisphericLight('studio-key-light', new Vector3(0.2, 1, 0.4), scene);
    light.intensity = 0.9;

    try {
      const bodyProfile = createStudioBodyProfile(studio.mannequin);
      const skinMaterial = createMaterial(scene, 'skin', Color3.FromHexString(studio.mannequin.skinColor));
      const mannequinGroup = createProceduralMannequinGroup(bodyProfile);
      let meshCount = 0;
      let renderableGarments = 0;

      meshCount += createBabylonMeshesFromThreeGroup(scene, mannequinGroup, () => skinMaterial).length;

      studio.outfit.garmentInstances
        .filter((garment) => garment.visible)
        .forEach((garment) => {
          if (garment.type === 'shirt') {
            const renderInput = resolveStudioGarmentRenderInput(studio, garment);
            const shirtGroup = createProceduralTShirtGroup(renderInput.params, { bodyProfile });
            const material = createMaterialFromSlot(
              scene,
              `${garment.id}-${renderInput.materialSlotId}`,
              garment.materials[renderInput.materialSlotId],
              renderInput.baseColor,
            );
            material.alpha = garment.materials[renderInput.materialSlotId]?.opacity ?? 0.92;

            meshCount += createBabylonMeshesFromThreeGroup(
              scene,
              shirtGroup,
              (source: ThreeMeshGeometryData) => (
                source.name.includes('tshirt') || source.userData.part ? material : undefined
              ),
            ).map((mesh) => {
              mesh.metadata = {
                ...mesh.metadata,
                garmentInstanceId: garment.id,
                garmentType: garment.type,
                materialSlotId: renderInput.materialSlotId,
              };
              return mesh;
            }).length;
            renderableGarments += 1;
          } else {
            const primitiveCount = createPrimitiveGarmentMeshes(scene, garment);
            meshCount += primitiveCount;
            if (primitiveCount > 0) renderableGarments += 1;
          }

          meshCount += createDecalMeshes(scene, garment);
        });

      setDiagnostics({ error: meshCount === 0 ? 'Blank scene' : null, meshCount, renderableGarments });
    } catch (error) {
      setDiagnostics({
        error: error instanceof Error ? error.message : 'Render failed',
        meshCount: 0,
        renderableGarments: 0,
      });
    }

    engine.runRenderLoop(() => scene.render());

    const handleResize = () => engine.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      scene.dispose();
      engine.dispose();
    };
  }, [studio]);

  return (
    <>
      <canvas ref={canvasRef} data-studio-viewport="true" className="h-full w-full outline-none" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-white/10 bg-black/45 px-3 py-2 text-[11px] text-white/55 backdrop-blur">
        <span className={diagnostics.error ? 'text-red-200' : 'text-emerald-200'}>
          {diagnostics.error ?? `${diagnostics.meshCount} meshes`}
        </span>
        <span className="mx-2 text-white/20">/</span>
        <span>{diagnostics.renderableGarments} garments</span>
      </div>
    </>
  );
}
