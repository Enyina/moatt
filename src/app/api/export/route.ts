import { NextRequest, NextResponse } from 'next/server';
import { existsSync, readFileSync, readdirSync } from 'fs';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { ExportOptions, ExportResult } from '@/lib/types';

interface ExportAvatarPayload {
  clothingTexture?: string;
  accessories?: Array<{
    modelUrl?: string;
    textureUrl?: string;
    [key: string]: unknown;
  }>;
  modelUrl?: string;
  name?: string;
  version?: number;
  [key: string]: unknown;
}

// Export directory
const EXPORT_DIR = join(process.cwd(), 'exports');

// Ensure export directory exists
async function ensureExportDir() {
  try {
    await mkdir(EXPORT_DIR, { recursive: true });
  } catch {
    // Directory might already exist
  }
}

// Generate filename for export
function generateFilename(options: ExportOptions): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const extension = options.format === 'gltf' ? '.gltf' : '.glb';
  return `avatar-${timestamp}${extension}`;
}

function fallbackFilename(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `avatar-${timestamp}.glb`;
}

export async function POST(request: NextRequest): Promise<NextResponse<ExportResult>> {
  try {
    const { avatar, options } = await request.json() as {
      avatar?: ExportAvatarPayload;
      options?: ExportOptions;
    };

    // Validate input
    if (!avatar || !options) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: avatar and options',
        filename: fallbackFilename()
      }, { status: 400 });
    }

    // Validate export options
    const validFormats = ['glb', 'gltf', 'obj'];
    const validQualities = ['low', 'medium', 'high'];
    
    if (!validFormats.includes(options.format)) {
      return NextResponse.json({
        success: false,
        error: `Invalid format: ${options.format}. Must be one of: ${validFormats.join(', ')}`,
        filename: generateFilename(options)
      }, { status: 400 });
    }

    if (!validQualities.includes(options.quality)) {
      return NextResponse.json({
        success: false,
        error: `Invalid quality: ${options.quality}. Must be one of: ${validQualities.join(', ')}`,
        filename: generateFilename(options)
      }, { status: 400 });
    }

    // For now, we'll create a placeholder export since we don't have actual 3D scene data
    // In a real implementation, this would:
    // 1. Load the 3D scene with avatar state applied
    // 2. Apply textures, poses, and accessories
    // 3. Export using Three.js GLTFExporter
    // 4. Return the exported file data

    const warnings: string[] = [];

    // Check for potential issues
    if (!avatar.clothingTexture && options.includeTextures) {
      warnings.push('No clothing texture applied - using default material');
    }

    if ((avatar.accessories ?? []).length === 0 && options.includeAccessories) {
      warnings.push('No accessories to include in export');
    }

    if (!avatar.modelUrl || avatar.modelUrl === '') {
      warnings.push('No custom model specified - using default mannequin');
    }

    // Create export metadata
    const exportData = {
      version: avatar.version,
      timestamp: new Date().toISOString(),
      options: options,
      avatar: {
        ...avatar,
        // Remove large data fields for cleaner export
        clothingTexture: avatar.clothingTexture ? '[TEXTURE_DATA]' : null,
        accessories: (avatar.accessories ?? []).map((accessory) => ({
          ...accessory,
          modelUrl: accessory.modelUrl ? '[MODEL_DATA]' : null,
          textureUrl: accessory.textureUrl ? '[TEXTURE_DATA]' : null
        }))
      },
      metadata: {
        exportedBy: 'Moatt 3D Fashion Studio',
        exportFormat: options.format,
        quality: options.quality,
        includes: {
          textures: options.includeTextures,
          accessories: options.includeAccessories
        }
      }
    };

    // Generate filename
    const filename = generateFilename(options);
    const filepath = join(EXPORT_DIR, filename);

    // Ensure export directory exists
    await ensureExportDir();

    // Write export file (JSON format for now, would be binary in real implementation)
    await writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

    // Log export for debugging
    console.log(`Export completed: ${filename}`);
    console.log(`Avatar: ${avatar.name ?? 'Untitled avatar'}`);
    console.log(`Format: ${options.format}, Quality: ${options.quality}`);
    if (warnings.length > 0) {
      console.log('Warnings:', warnings);
    }

    return NextResponse.json({
      success: true,
      filename: filename,
      url: `/exports/${filename}`, // Would be actual download URL
      warnings: warnings.length > 0 ? warnings : undefined
    });

  } catch (error) {
    console.error('Export failed:', error);
    
    return NextResponse.json({
      success: false,
      error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      filename: 'avatar-export.glb'
    }, { status: 500 });
  }
}

// GET endpoint to check export status or download files
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('file');

  if (filename) {
    // Download specific export file
    try {
      const filepath = join(EXPORT_DIR, filename);
      if (existsSync(filepath)) {
        const fileBuffer = readFileSync(filepath);
        const headers = new Headers();
        headers.set('Content-Type', 'application/octet-stream');
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Export file not found'
        }, { status: 404 });
      }
    } catch {
      return NextResponse.json({
        success: false,
        error: 'Failed to download export file'
      }, { status: 500 });
    }
  }

  // List available exports
  try {
    if (existsSync(EXPORT_DIR)) {
      const files = readdirSync(EXPORT_DIR);
      return NextResponse.json({
        success: true,
        data: files.filter((file: string) => 
          file.endsWith('.glb') || file.endsWith('.gltf') || file.endsWith('.json')
        )
      });
    } else {
      return NextResponse.json({
        success: true,
        data: []
      });
    }
  } catch {
    return NextResponse.json({
      success: false,
      error: 'Failed to list export files'
    }, { status: 500 });
  }
}
