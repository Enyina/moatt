import type { Template, Design } from '@/types';

export const mockTemplates: Template[] = [
  { id: '1', name: 'Female Standard', category: 'women', modelUrl: '/models/mannequin.glb', thumbnailUrl: '/thumbnails/women-1.jpg' },
  { id: '2', name: 'Male Athletic', category: 'men', modelUrl: '/models/mannequin.glb', thumbnailUrl: '/thumbnails/men-1.jpg' },
  { id: '3', name: 'Child Small', category: 'children', modelUrl: '/models/mannequin.glb', thumbnailUrl: '/thumbnails/child-1.jpg' },
  { id: '4', name: 'Female Plus', category: 'women', modelUrl: '/models/mannequin.glb', thumbnailUrl: '/thumbnails/women-2.jpg' },
  { id: '5', name: 'Male Tall', category: 'men', modelUrl: '/models/mannequin.glb', thumbnailUrl: '/thumbnails/men-2.jpg' },
  { id: '6', name: 'Child Medium', category: 'children', modelUrl: '/models/mannequin.glb', thumbnailUrl: '/thumbnails/child-2.jpg' },
];

export const mockRecentDesigns: Design[] = [
  { id: '1', userId: 'user1', name: 'Summer Dress', mannequinId: '1', textures: [], thumbnail: '/designs/1.jpg', isPublic: true, createdAt: new Date() },
  { id: '2', userId: 'user1', name: 'Casual Shirt', mannequinId: '2', textures: [], thumbnail: '/designs/2.jpg', isPublic: false, createdAt: new Date() },
  { id: '3', userId: 'user1', name: 'Kids Outfit', mannequinId: '3', textures: [], thumbnail: '/designs/3.jpg', isPublic: true, createdAt: new Date() },
];