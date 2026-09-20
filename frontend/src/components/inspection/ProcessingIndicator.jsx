import React from 'react';

/**
 * Processing / Analysis Status Indicator
 */
export default function ProcessingIndicator({ isScanning }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-on-surface-variant shadow-sm">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-primary text-base">
          {isScanning ? 'sync' : 'sync_saved_locally'}
        </span>
        <span className="font-medium text-on-surface">Package Analysis:</span>
        <span className="text-outline">
          {isScanning
            ? '● Analyzing multi-surface package · Extracting declarations...'
            : '✓ Reading package · ✓ Extracting declarations · ● Checking compliance'}
        </span>
      </div>
      <span className="text-[11px] font-bold text-secondary bg-secondary-fixed px-2 py-0.5 rounded">
        PCR 2011 Active
      </span>
    </div>
  );
}
