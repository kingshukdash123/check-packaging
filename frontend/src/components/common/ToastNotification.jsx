import React from 'react';

/**
 * Floating Toast Notification Component
 */
export default function ToastNotification({ isVisible, message }) {
  return (
    <div
      id="toast"
      className={`fixed bottom-6 right-6 bg-inverse-surface text-inverse-on-surface px-4 py-3 rounded-lg shadow-xl text-xs font-medium items-center gap-2.5 z-50 transition-all duration-200 ${
        isVisible ? 'flex animate-fade-in' : 'hidden'
      }`}
    >
      <span className="material-symbols-outlined text-secondary-fixed text-base">check_circle</span>
      <span id="toastMsg">{message}</span>
    </div>
  );
}
