'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DesignEditor } from '@/components/DesignEditor';
import { getBodyTypeConfig } from '@/lib/models';
import type { GarmentType } from '@/lib/types';

function LoadingFallback() {
  return (
    <div className="h-screen flex items-center justify-center bg-[#0E0E0E]">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-[#EA931D] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#CCCCCC]">Loading editor...</p>
      </div>
    </div>
  );
}

function DesignPageContent() {
  const searchParams = useSearchParams();
  const bodyTypeParam = searchParams.get('template') || searchParams.get('bodyType');
  const clothingTypeParam = searchParams.get('clothing') || searchParams.get('type') || undefined;
  const clothingTypeAliases: Record<string, GarmentType> = {
    dress: 'gown',
    gown: 'gown',
    pants: 'trouser',
    trouser: 'trouser',
    trousers: 'trouser',
    shirt: 'shirt',
    hoodie: 'hoodie',
    skirt: 'skirt',
    jacket: 'jacket',
    native_wear: 'native_wear',
  };
  const bodyTypeId = bodyTypeParam && getBodyTypeConfig(bodyTypeParam)
    ? bodyTypeParam
    : 'female-standard';
  const normalizedClothingType = clothingTypeParam
    ? clothingTypeAliases[clothingTypeParam.toLowerCase()]
    : undefined;

  return (
    <DesignEditor
      initialBodyTypeId={bodyTypeId}
      initialClothingType={normalizedClothingType}
    />
  );
}

export default function NewDesignPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DesignPageContent />
    </Suspense>
  );
}
