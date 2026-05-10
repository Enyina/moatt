'use client';

import { useEffect, useState } from 'react';
import { useUIStore, useEditorStore, useDesignStore } from '@/stores';

/**
 * ExportModal - Flow 6
 * Export with sync (now) and async (email) options
 * Clear UX copy in non-technical terms
 */
export function ExportModal() {
  const {
    exportModal,
    closeExportModal,
    setExportFormat,
    setExportResolution,
    setExportDelivery,
    setExportProcessing,
    setExportProgress,
    showToast,
  } = useUIStore();

  const { strokes, canvasSize } = useEditorStore();
  const { currentDesign, saveDesign } = useDesignStore();

  const [email, setEmail] = useState('');
  const [isValidEmail, setIsValidEmail] = useState(false);

  // Reset email when modal closes
  useEffect(() => {
    if (!exportModal.isOpen) {
      setEmail('');
      setIsValidEmail(false);
    }
  }, [exportModal.isOpen]);

  // Validate email
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  }, [email]);

  if (!exportModal.isOpen) return null;

  const handleExport = async () => {
    setExportProcessing(true);
    setExportProgress(0);

    // Simulate export progress
    const progressInterval = setInterval(() => {
      setExportProgress(Math.min(exportModal.progress + 5, 95));
    }, 200);

    try {
      // Save current state first
      if (currentDesign) {
        await saveDesign({
          thumbnail: null, // Would capture canvas in real implementation
          updatedAt: new Date().toISOString(),
        });
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setExportProgress(100);

      // Show success message
      if (exportModal.delivery === 'now') {
        showToast('Your design is ready! Download starting...', 'success', 3000);

        // Simulate download
        setTimeout(() => {
          const link = document.createElement('a');
          link.download = `moatt-design-${Date.now()}.${exportModal.format}`;
          link.href = '#'; // Would be real URL
          // link.click(); // Disabled for demo
        }, 500);
      } else {
        showToast(`We'll email your design to ${email} when it's ready (2-5 minutes)`, 'success', 5000);
      }

      // Close after short delay
      setTimeout(() => {
        closeExportModal();
      }, 1500);

    } catch (error) {
      clearInterval(progressInterval);
      showToast('Something went wrong. Please try again.', 'error', 3000);
      setExportProcessing(false);
    }
  };

  const formatOptions = [
    { value: 'png', label: 'PNG Image', description: 'Best for web, social media, quick sharing' },
    { value: 'pdf', label: 'PDF Document', description: 'Best for printing, portfolios, professional use' },
  ] as const;

  const resolutionOptions = [
    {
      value: '2k',
      label: 'Standard (2K)',
      description: '2048×2048 pixels',
      note: 'Fast download, great for web',
      emailOnly: false,
    },
    {
      value: '4k',
      label: 'High (4K)',
      description: '4096×4096 pixels',
      note: 'Sharp details, good for print',
      emailOnly: false,
    },
    {
      value: '8k',
      label: 'Ultra (8K)',
      description: '8192×8192 pixels',
      note: 'Professional quality, email only',
      emailOnly: true,
    },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={!exportModal.isProcessing ? closeExportModal : undefined}
      />

      {/* Modal */}
      <div className="relative bg-[#1A1A2E] rounded-2xl w-full max-w-lg mx-4 shadow-2xl border border-[#EA931D]/30 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1A2E] border-b border-white/10 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Export Your Design</h2>
            {!exportModal.isProcessing && (
              <button
                onClick={closeExportModal}
                className="text-[#A0A0B0] hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-[#A0A0B0] mt-1">
            Choose how you want to save your creation
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Processing State */}
          {exportModal.isProcessing ? (
            <div className="text-center py-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    className="text-[#16213E]"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                  />
                  <circle
                    className="text-[#EA931D]"
                    strokeWidth="8"
                    strokeDasharray={251.2}
                    strokeDashoffset={251.2 - (251.2 * exportModal.progress) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="48"
                    cy="48"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{Math.round(exportModal.progress)}%</span>
                </div>
              </div>
              <p className="text-white font-medium">
                {exportModal.progress < 100 ? 'Preparing your design...' : 'Almost ready!'}
              </p>
              <p className="text-[#A0A0B0] text-sm mt-1">
                {exportModal.delivery === 'email'
                  ? "We'll send you an email when it's done"
                  : 'Your download will start automatically'}
              </p>
            </div>
          ) : (
            <>
              {/* Format Selection */}
              <div>
                <label className="text-white font-medium mb-3 block">File Format</label>
                <div className="grid grid-cols-2 gap-3">
                  {formatOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setExportFormat(option.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${exportModal.format === option.value
                        ? 'border-[#EA931D] bg-[#EA931D]/10'
                        : 'border-white/10 hover:border-white/30'
                        }`}
                    >
                      <span className={`font-bold block ${exportModal.format === option.value ? 'text-[#EA931D]' : 'text-white'
                        }`}>
                        {option.label}
                      </span>
                      <span className="text-[#A0A0B0] text-xs mt-1 block">
                        {option.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution Selection */}
              <div>
                <label className="text-white font-medium mb-3 block">Quality</label>
                <div className="space-y-2">
                  {resolutionOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setExportResolution(option.value)}
                      disabled={option.emailOnly && exportModal.delivery === 'now'}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all relative ${exportModal.resolution === option.value
                        ? 'border-[#EA931D] bg-[#EA931D]/10'
                        : 'border-white/10 hover:border-white/30'
                        } ${option.emailOnly && exportModal.delivery === 'now' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`font-bold block ${exportModal.resolution === option.value ? 'text-[#EA931D]' : 'text-white'
                            }`}>
                            {option.label}
                          </span>
                          <span className="text-[#A0A0B0] text-sm">
                            {option.description}
                          </span>
                        </div>
                        {option.emailOnly && (
                          <span className="text-xs bg-[#EA931D]/20 text-[#EA931D] px-2 py-1 rounded">
                            Email only
                          </span>
                        )}
                      </div>
                      <span className="text-[#666] text-xs mt-1 block">
                        {option.note}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Method */}
              <div>
                <label className="text-white font-medium mb-3 block">
                  How would you like to receive it?
                </label>
                <div className="space-y-3">
                  {/* Download Now */}
                  <button
                    onClick={() => setExportDelivery('now')}
                    disabled={exportModal.resolution === '8k'}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${exportModal.delivery === 'now'
                      ? 'border-[#EA931D] bg-[#EA931D]/10'
                      : 'border-white/10 hover:border-white/30'
                      } ${exportModal.resolution === '8k' ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${exportModal.delivery === 'now' ? 'border-[#EA931D]' : 'border-white/30'
                        }`}>
                        {exportModal.delivery === 'now' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#EA931D]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`font-bold block ${exportModal.delivery === 'now' ? 'text-[#EA931D]' : 'text-white'
                          }`}>
                          Download Now
                        </span>
                        <span className="text-[#A0A0B0] text-sm">
                          Quick option (~30 seconds)
                        </span>
                        <span className="text-[#666] text-xs block mt-1">
                          Best for: Quick previews, small files
                        </span>
                        {exportModal.resolution === '8k' && (
                          <span className="text-[#EA931D] text-xs block mt-1">
                            Not available for 8K quality
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Email Me */}
                  <button
                    onClick={() => setExportDelivery('email')}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${exportModal.delivery === 'email'
                      ? 'border-[#EA931D] bg-[#EA931D]/10'
                      : 'border-white/10 hover:border-white/30'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${exportModal.delivery === 'email' ? 'border-[#EA931D]' : 'border-white/30'
                        }`}>
                        {exportModal.delivery === 'email' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#EA931D]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className={`font-bold block ${exportModal.delivery === 'email' ? 'text-[#EA931D]' : 'text-white'
                          }`}>
                          Email Me
                        </span>
                        <span className="text-[#A0A0B0] text-sm">
                          We'll send a link (~2-5 minutes)
                        </span>
                        <span className="text-[#666] text-xs block mt-1">
                          Best for: Large files, archival quality
                        </span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Email Input */}
              {exportModal.delivery === 'email' && (
                <div>
                  <label className="text-white font-medium mb-2 block">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-[#16213E] border border-white/20 rounded-xl text-white placeholder-[#666] focus:outline-none focus:border-[#EA931D] transition-colors"
                  />
                  {!isValidEmail && email.length > 0 && (
                    <p className="text-red-400 text-xs mt-2">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!exportModal.isProcessing && (
          <div className="sticky bottom-0 bg-[#1A1A2E] border-t border-white/10 p-6 rounded-b-2xl">
            <button
              onClick={handleExport}
              disabled={exportModal.delivery === 'email' && !isValidEmail}
              className="w-full py-3 bg-[#EA931D] text-black font-bold rounded-xl hover:bg-[#D4850F] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exportModal.delivery === 'now' ? 'Export & Download' : 'Send to Email'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
