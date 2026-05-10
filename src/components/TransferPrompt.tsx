'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/stores';
import { getTransferPreview } from '@/lib/anonymous-transfer';

export function TransferPrompt() {
  const { 
    showTransferPrompt, 
    pendingTransferCount,
    acceptTransfer, 
    declineTransfer,
    dismissTransferPrompt,
    isLoading,
  } = useUserStore();

  const preview = getTransferPreview();

  useEffect(() => {
    if (showTransferPrompt) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [showTransferPrompt]);

  if (!showTransferPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={dismissTransferPrompt}
      />
      
      {/* Modal */}
      <div className="relative bg-[#1A1A2E] rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl border border-[#EA931D]/30">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#EA931D]/20 rounded-full flex items-center justify-center">
            <svg 
              className="w-8 h-8 text-[#EA931D]" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Save Your Work
        </h2>
        
        {/* Description */}
        <p className="text-[#A0A0B0] text-center mb-6">
          You have <span className="text-[#EA931D] font-bold">{pendingTransferCount} design{pendingTransferCount !== 1 ? 's' : ''}</span> from your session. 
          Transfer them to your account to keep them safe.
        </p>

        {/* Preview */}
        <div className="bg-black/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-[#A0A0B0] mb-3">Designs to transfer:</p>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {preview.designs.map((design, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 p-2 bg-[#1A1A2E] rounded-lg"
              >
                {design.thumbnail ? (
                  <img 
                    src={design.thumbnail} 
                    alt={design.name}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-[#16213E] rounded flex items-center justify-center">
                    <svg className="w-5 h-5 text-[#A0A0B0]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{design.name}</p>
                  <p className="text-[#A0A0B0] text-xs">
                    {new Date(design.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={acceptTransfer}
            disabled={isLoading}
            className="w-full py-3 bg-[#EA931D] text-black font-bold rounded-xl hover:bg-[#D4850F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Transferring...
              </>
            ) : (
              `Transfer ${pendingTransferCount} Design${pendingTransferCount !== 1 ? 's' : ''}`
            )}
          </button>
          
          <button
            onClick={declineTransfer}
            disabled={isLoading}
            className="w-full py-3 text-[#A0A0B0] font-medium hover:text-white transition-colors"
          >
            Discard & Start Fresh
          </button>
        </div>

        {/* Note */}
        <p className="text-xs text-[#666] text-center mt-4">
          You can also transfer designs later from your profile settings.
        </p>
      </div>
    </div>
  );
}
