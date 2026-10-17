import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { DeleteWardrobeResponse, SaveWardrobeResponse, WardrobeItem } from '@/lib/types';

const WARDROBE_DIR = join(process.cwd(), 'data');
const WARDROBE_FILE = join(WARDROBE_DIR, 'wardrobe.json');

interface WardrobeRouteContext {
  params: Promise<{ id: string }>;
}

async function ensureDataDir() {
  try {
    await mkdir(WARDROBE_DIR, { recursive: true });
  } catch {
    // Directory might already exist.
  }
}

async function readWardrobeData(): Promise<WardrobeItem[]> {
  try {
    await ensureDataDir();
    return JSON.parse(await readFile(WARDROBE_FILE, 'utf-8')) as WardrobeItem[];
  } catch {
    return [];
  }
}

async function writeWardrobeData(items: WardrobeItem[]): Promise<void> {
  await ensureDataDir();
  await writeFile(WARDROBE_FILE, JSON.stringify(items, null, 2), 'utf-8');
}

export async function PUT(
  request: NextRequest,
  context: WardrobeRouteContext,
): Promise<NextResponse<SaveWardrobeResponse>> {
  try {
    const { id } = await context.params;
    const body = await request.json() as Partial<WardrobeItem>;
    const items = await readWardrobeData();
    const itemIndex = items.findIndex((item) => item.id === id);

    if (itemIndex === -1) {
      return NextResponse.json({
        success: false,
        error: 'Wardrobe item not found',
      }, { status: 404 });
    }

    const currentItem = items[itemIndex];
    const updatedItem: WardrobeItem = {
      ...currentItem,
      ...body,
      id,
      avatarState: body.avatarState
        ? {
            ...currentItem.avatarState,
            ...body.avatarState,
            updatedAt: new Date().toISOString(),
          }
        : currentItem.avatarState,
      updatedAt: new Date().toISOString(),
    };

    items[itemIndex] = updatedItem;
    await writeWardrobeData(items);

    return NextResponse.json({
      success: true,
      data: updatedItem,
      message: 'Wardrobe item updated successfully',
    });
  } catch (error) {
    console.error('Failed to update wardrobe item:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to update wardrobe item',
      message: 'Server error occurred while updating',
    }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: WardrobeRouteContext,
): Promise<NextResponse<DeleteWardrobeResponse>> {
  try {
    const { id } = await context.params;
    const items = await readWardrobeData();
    const nextItems = items.filter((item) => item.id !== id);

    if (nextItems.length === items.length) {
      return NextResponse.json({
        success: false,
        error: 'Wardrobe item not found',
      }, { status: 404 });
    }

    await writeWardrobeData(nextItems);

    return NextResponse.json({
      success: true,
      message: 'Wardrobe item deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete wardrobe item:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to delete wardrobe item',
      message: 'Server error occurred while deleting',
    }, { status: 500 });
  }
}
