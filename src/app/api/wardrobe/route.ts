import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { WardrobeItem, WardrobeResponse, SaveWardrobeResponse, DeleteWardrobeResponse } from '@/lib/types';

// File path for wardrobe storage
const WARDROBE_DIR = join(process.cwd(), 'data');
const WARDROBE_FILE = join(WARDROBE_DIR, 'wardrobe.json');

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await mkdir(WARDROBE_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist
  }
}

// Read wardrobe data from file
async function readWardrobeData(): Promise<WardrobeItem[]> {
  try {
    await ensureDataDir();
    const data = await readFile(WARDROBE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // File doesn't exist or is corrupted, return empty array
    return [];
  }
}

// Write wardrobe data to file
async function writeWardrobeData(items: WardrobeItem[]): Promise<void> {
  await ensureDataDir();
  await writeFile(WARDROBE_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// GET /api/wardrobe - Load all wardrobe items
export async function GET(): Promise<NextResponse<WardrobeResponse>> {
  try {
    const items = await readWardrobeData();
    
    return NextResponse.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Failed to load wardrobe:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load wardrobe items',
      message: 'Server error occurred while loading wardrobe'
    }, { status: 500 });
  }
}

// POST /api/wardrobe - Save new wardrobe item
export async function POST(request: NextRequest): Promise<NextResponse<SaveWardrobeResponse>> {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.avatarState) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name and avatarState'
      }, { status: 400 });
    }

    // Read existing items
    const items = await readWardrobeData();
    
    // Create new wardrobe item
    const newItem: WardrobeItem = {
      id: generateId(),
      name: body.name,
      avatarState: {
        ...body.avatarState,
        updatedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: body.tags || [],
      isFavorite: body.isFavorite || false,
      thumbnail: body.thumbnail
    };

    // Add to collection
    items.push(newItem);
    
    // Save to file
    await writeWardrobeData(items);
    
    return NextResponse.json({
      success: true,
      data: newItem,
      message: 'Wardrobe item saved successfully'
    });
  } catch (error) {
    console.error('Failed to save wardrobe item:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save wardrobe item',
      message: 'Server error occurred while saving'
    }, { status: 500 });
  }
}

// PUT /api/wardrobe/[id] - Update existing wardrobe item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<SaveWardrobeResponse>> {
  try {
    const { id } = params;
    const body = await request.json();
    
    // Read existing items
    const items = await readWardrobeData();
    
    // Find item to update
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Wardrobe item not found'
      }, { status: 404 });
    }

    // Update item
    const updatedItem: WardrobeItem = {
      ...items[itemIndex],
      ...body,
      id, // Ensure ID doesn't change
      updatedAt: new Date().toISOString()
    };

    // If avatarState is being updated, update its timestamp too
    if (body.avatarState) {
      updatedItem.avatarState = {
        ...updatedItem.avatarState,
        ...body.avatarState,
        updatedAt: new Date().toISOString()
      };
    }

    // Replace in collection
    items[itemIndex] = updatedItem;
    
    // Save to file
    await writeWardrobeData(items);
    
    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Wardrobe item updated successfully'
    });
  } catch (error) {
    console.error('Failed to update wardrobe item:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update wardrobe item',
      message: 'Server error occurred while updating'
    }, { status: 500 });
  }
}

// DELETE /api/wardrobe/[id] - Delete wardrobe item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse<DeleteWardrobeResponse>> {
  try {
    const { id } = params;
    
    // Read existing items
    const items = await readWardrobeData();
    
    // Find item to delete
    const itemIndex = items.findIndex(item => item.id === id);
    
    if (itemIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Wardrobe item not found'
      }, { status: 404 });
    }

    // Remove from collection
    items.splice(itemIndex, 1);
    
    // Save to file
    await writeWardrobeData(items);
    
    return NextResponse.json({
      success: true,
      message: 'Wardrobe item deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete wardrobe item:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to delete wardrobe item',
      message: 'Server error occurred while deleting'
    }, { status: 500 });
  }
}
