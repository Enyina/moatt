import type { MaterialSlot } from '../../lib/types';
import type { SavedStudioLook, StudioState } from './types';
import { createInitialStudioState } from './studioState';

export type StudioExportQuality = 'low' | 'medium' | 'high';

export interface MoattStudioDesignDocument {
  format: 'moatt-studio-design';
  schemaVersion: 1;
  exportedAt: string;
  previewThumbnail: string | null;
  look: SavedStudioLook;
}

export interface StudioConceptSheetInput {
  previewDataUrl: string;
  studio: StudioState;
}

const PDF_PAGE_WIDTH = 612;
const PDF_PAGE_HEIGHT = 792;

function cloneStudioLookFromState(state: StudioState): SavedStudioLook {
  return {
    schemaVersion: 1,
    id: state.id,
    name: state.name,
    mannequin: {
      ...state.mannequin,
      measurements: { ...state.mannequin.measurements },
    },
    garments: state.outfit.garmentInstances.map((garment) => ({
      id: garment.id,
      name: garment.name,
      type: garment.type,
      params: { ...garment.params },
      styleOptions: { ...garment.styleOptions },
      materials: Object.fromEntries(
        Object.entries(garment.materials).map(([id, material]) => [
          id,
          { ...material, maps: { ...(material.maps ?? {}) } },
        ]),
      ),
      decals: garment.decals.map((decal) => ({ ...decal, anchor: { ...decal.anchor } })),
      layer: garment.layer,
    })),
    activeGarmentInstanceId: state.outfit.activeGarmentInstanceId,
    camera: { ...state.camera },
    savedAt: state.updatedAt,
  };
}

export function createMoattStudioDesignDocument(
  studio: StudioState,
  previewThumbnail: string | null,
): MoattStudioDesignDocument {
  return {
    format: 'moatt-studio-design',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    previewThumbnail,
    look: cloneStudioLookFromState(studio),
  };
}

export function createStudioStateFromMoattDesignDocument(input: unknown): StudioState {
  if (!isMoattStudioDesignDocument(input)) {
    throw new Error('This file is not a valid Moatt studio design.');
  }

  const state = createInitialStudioState({
    id: input.look.id,
    name: input.look.name,
    mannequin: input.look.mannequin,
    garments: input.look.garments,
  });
  const activeGarmentInstanceId = input.look.garments.some((garment) => garment.id === input.look.activeGarmentInstanceId)
    ? input.look.activeGarmentInstanceId
    : state.outfit.activeGarmentInstanceId;

  return {
    ...state,
    outfit: {
      ...state.outfit,
      activeGarmentInstanceId,
    },
    selection: activeGarmentInstanceId
      ? { type: 'garment', garmentInstanceId: activeGarmentInstanceId }
      : { type: 'none' },
    camera: { ...input.look.camera },
    updatedAt: input.exportedAt,
  };
}

export function isMoattStudioDesignDocument(input: unknown): input is MoattStudioDesignDocument {
  if (!input || typeof input !== 'object') return false;
  const document = input as Partial<MoattStudioDesignDocument>;
  return document.format === 'moatt-studio-design'
    && document.schemaVersion === 1
    && !!document.look
    && Array.isArray(document.look.garments);
}

export function normalizeStudioExportQuality(value: unknown): StudioExportQuality {
  return value === 'low' || value === 'medium' || value === 'high' ? value : 'medium';
}

export function summarizeMaterial(slot: Partial<MaterialSlot>): string {
  const parts = [
    slot.name,
    slot.baseColor,
    slot.fabricPresetId,
    typeof slot.roughness === 'number' ? `roughness ${slot.roughness.toFixed(2)}` : null,
    slot.maps?.baseColorMap ? 'custom texture' : null,
  ].filter(Boolean);

  return parts.join(', ') || 'Default material';
}

function escapePdfText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const [, base64 = ''] = dataUrl.split(',');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function textLine(value: string, x: number, y: number, size = 10): string {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET\n`;
}

function wrapText(value: string, maxLength: number): string[] {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let current = '';

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
      return;
    }
    current = next;
  });

  if (current) lines.push(current);
  return lines;
}

function readJpegSize(bytes: Uint8Array): { width: number; height: number } {
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) break;
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isStartOfFrame) {
      return {
        height: (bytes[offset + 5] << 8) + bytes[offset + 6],
        width: (bytes[offset + 7] << 8) + bytes[offset + 8],
      };
    }
    offset += 2 + length;
  }

  return { width: 1280, height: 900 };
}

function createContentStream(input: StudioConceptSheetInput, imageWidth: number, imageHeight: number): string {
  const visibleGarments = input.studio.outfit.garmentInstances.filter((garment) => garment.visible);
  const measurements = Object.entries(input.studio.mannequin.measurements)
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ') || 'No measurements set';
  const imageDisplayWidth = 280;
  const imageDisplayHeight = Math.min(330, imageDisplayWidth * (imageHeight / imageWidth));

  let stream = '';
  stream += textLine('Moatt Concept Sheet', 48, 744, 22);
  stream += textLine(input.studio.name, 48, 718, 12);
  stream += `q ${imageDisplayWidth} 0 0 ${imageDisplayHeight} 48 ${690 - imageDisplayHeight} cm /Im1 Do Q\n`;
  stream += textLine('Look Details', 360, 686, 15);
  stream += textLine(`Mannequin: ${input.studio.mannequin.bodyTemplateId}`, 360, 662);
  wrapText(`Measurements: ${measurements}`, 34).forEach((line, index) => {
    stream += textLine(line, 360, 644 - index * 14);
  });
  stream += textLine(`Camera: ${input.studio.camera.view}`, 360, 588);
  stream += textLine(`Garments: ${visibleGarments.length}`, 360, 570);

  let y = 535;
  visibleGarments.forEach((garment, index) => {
    stream += textLine(`${index + 1}. ${garment.name} (${garment.type})`, 48, y, 13);
    y -= 18;
    Object.values(garment.styleOptions).slice(0, 4).forEach((option) => {
      stream += textLine(`Style: ${option}`, 64, y);
      y -= 14;
    });
    Object.values(garment.materials).slice(0, 3).forEach((material) => {
      wrapText(`Material: ${summarizeMaterial(material)}`, 82).forEach((line) => {
        stream += textLine(line, 64, y);
        y -= 14;
      });
    });
    if (garment.decals.length > 0) {
      stream += textLine(`Graphics: ${garment.decals.length}`, 64, y);
      y -= 14;
    }
    y -= 10;
  });

  stream += textLine(`Exported: ${new Date().toLocaleString()}`, 48, 38, 8);
  return stream;
}

function stringToBytes(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index);
  }
  return bytes;
}

function joinBytes(parts: Uint8Array[]): Uint8Array {
  const length = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.length);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

export function createStudioConceptPdfBlob(input: StudioConceptSheetInput): Blob {
  const imageBytes = dataUrlToBytes(input.previewDataUrl);
  const { width: imageWidth, height: imageHeight } = readJpegSize(imageBytes);
  const content = createContentStream(input, imageWidth, imageHeight);
  const objects: Uint8Array[] = [
    stringToBytes('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n'),
    stringToBytes('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n'),
    stringToBytes(`3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PDF_PAGE_WIDTH} ${PDF_PAGE_HEIGHT}] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents 6 0 R >> endobj\n`),
    stringToBytes('4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n'),
    joinBytes([
      stringToBytes(`5 0 obj << /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imageBytes.length} >> stream\n`),
      imageBytes,
      stringToBytes('\nendstream endobj\n'),
    ]),
    stringToBytes(`6 0 obj << /Length ${content.length} >> stream\n${content}endstream endobj\n`),
  ];

  const header = stringToBytes('%PDF-1.4\n');
  const bodyParts: Uint8Array[] = [header];
  const offsets = [0];
  let offset = header.length;

  objects.forEach((object) => {
    offsets.push(offset);
    bodyParts.push(object);
    offset += object.length;
  });

  let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((objectOffset) => {
    xref += `${String(objectOffset).padStart(10, '0')} 00000 n \n`;
  });
  xref += `trailer << /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF`;

  return new Blob([toArrayBuffer(joinBytes([...bodyParts, stringToBytes(xref)]))], { type: 'application/pdf' });
}
