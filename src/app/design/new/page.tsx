'use client';

import { Suspense } from 'react';
import { DesignEditor } from '@/components/DesignEditor';

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

export default function NewDesignPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DesignEditor templateType="shirt" />
    </Suspense>
  );
}