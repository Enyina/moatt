'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { DesignEditor } from '@/components/DesignEditor';

export default function DesignPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params?.id as string;

  // Get template type from query params (defaults to shirt)
  const templateType = (searchParams.get('type') as 'shirt' | 'pants' | 'dress') || 'shirt';

  // Get model URL from query params (defaults to female base model)
  const modelUrl = searchParams.get('model') || undefined;

  return (
    <DesignEditor
      designId={id}
      templateType={templateType}
      modelUrl={modelUrl}
    />
  );
}