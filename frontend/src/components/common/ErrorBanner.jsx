import React from 'react';

/**
 * Dismissible Error Alert Banner
 */
export default function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div className="bg-error-container/50 border border-error/60 rounded-xl p-4 text-xs text-on-error-container flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <span className="material-symbols-outlined text-error">warning</span>
        <span>{message}</span>
      </div>
      <button
        onClick={onDismiss}
        className="font-bold text-error underline ml-3 cursor-pointer"
      >
        Dismiss
      </button>
    </div>
  );
}
