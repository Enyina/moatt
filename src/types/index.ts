export interface Template {
  id: string;
  name: string;
  category: 'men' | 'women' | 'children';
  modelUrl: string;
  thumbnailUrl: string;
}

export interface Design {
  id: string;
  userId: string;
  name: string;
  mannequinId: string;
  textures: string[];
  thumbnail: string;
  isPublic: boolean;
  createdAt: Date;
}

export interface WardrobeItem {
  id: string;
  userId: string;
  name: string;
  imageUrl: string;
  category: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export type Category = 'all' | 'men' | 'women' | 'children';