import React from 'react';

/**
 * Media Upload Section Component
 * Handles the statutory inspection media upload workflow:
 * 1. Clean Drag & Drop / Browse empty state
 * 2. Uploaded panel previews (Front PDP & Back Declarations) with clear Remove Image buttons
 * 3. Prominent Analyze Package action only when valid media is loaded
 */
export default function MediaUploadSection({
  scanner,
  onOpenEvidenceModal,
  ...directProps
}) {
  const s = scanner || directProps;

  const {
    hasMedia,
    frontImage,
    backImage,
    isDragging,
    isScanning,
    fileInputRef,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleClearMedia,
    handleRemoveImage,
    runPackageAnalysis
  } = s;

  // State 1: Clean Drag & Drop / Browse interface when no image is uploaded
  if (!hasMedia) {
    return (
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef?.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group ${
          isDragging
            ? 'border-primary bg-surface-container-low shadow-md scale-[0.99]'
            : 'border-outline-variant/60 hover:border-primary bg-surface-container-lowest hover:bg-surface-container-low/40 shadow-sm'
        }`}
      >
        <div className="w-16 h-16 rounded-full bg-surface-container text-primary flex items-center justify-center mb-3 group-hover:scale-105 group-hover:bg-primary-fixed transition-all shadow-sm">
          <span className="material-symbols-outlined text-3xl">upload_file</span>
        </div>

        <h3 className="text-sm font-bold text-on-surface mb-1">
          Drag & drop package images here, or <span className="text-primary font-bold underline">Browse Media</span>
        </h3>
        <p className="text-xs text-outline max-w-sm">
          Upload front (PDP) and back panels for automated statutory compliance checking. Supports JPG, PNG, and WEBP.
        </p>
      </div>
    );
  }

  // State 2: Media preview with visible Remove Image controls and Analyze Package trigger
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 sm:p-5 shadow-sm space-y-4">
      {/* Header bar with contextual actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-on-surface">Uploaded Package Media</h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed">
              {frontImage?.url && backImage?.url ? '2 Panels' : '1 Panel'}
            </span>
          </div>
          <p className="text-xs text-outline">
            Review package surface panels or initiate statutory compliance evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(!frontImage?.url || !backImage?.url) && (
            <button
              type="button"
              onClick={() => fileInputRef?.current?.click()}
              className="px-3 py-1.5 rounded text-xs font-semibold bg-surface-container hover:bg-surface-container-highest text-primary transition-colors flex items-center gap-1 cursor-pointer"
              title="Add another panel image"
            >
              <span className="material-symbols-outlined text-sm">add_photo_alternate</span>
              <span className="hidden sm:inline">Add Panel</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleClearMedia}
            className="px-3 py-1.5 rounded text-xs font-semibold text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
            title="Clear all uploaded images and return to empty state"
          >
            Clear All
          </button>

          {/* Analyze Package Button: visible only when valid media is loaded */}
          <button
            id="analyzePackageBtn"
            type="button"
            onClick={runPackageAnalysis}
            disabled={isScanning}
            className="px-2 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-on-primary-fixed-variant text-surface-container-lowest transition-colors shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {isScanning ? (
              <>
                <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze Package</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of uploaded panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Front Panel (PDP) */}
        {frontImage?.url ? (
          <div className="border border-outline-variant/50 rounded-xl p-3 bg-surface-container-low/60 flex flex-col justify-between space-y-3 transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">dashboard</span>
                <span className="text-xs font-bold text-on-surface">Front Surface (PDP)</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage ? handleRemoveImage('front') : handleClearMedia()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors cursor-pointer"
                title="Remove front image"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Remove Image</span>
              </button>
            </div>

            <div className="w-full h-40 sm:h-44 bg-white rounded-lg border border-outline-variant/30 flex items-center justify-center overflow-hidden p-2">
              <img
                src={frontImage.url}
                alt="Front Surface"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 text-xs">
              <p className="text-[11px] text-outline truncate max-w-[150px]" title={frontImage.name}>
                {frontImage.name || 'Front Panel'}
              </p>
              <button
                type="button"
                onClick={() => onOpenEvidenceModal?.(0)}
                className="font-semibold text-primary hover:text-on-primary-fixed-variant flex items-center gap-0.5 cursor-pointer text-xs"
              >
                <span className="material-symbols-outlined text-sm">zoom_in</span>
                <span>Preview</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Back Panel (Declarations) */}
        {backImage?.url ? (
          <div className="border border-outline-variant/50 rounded-xl p-3 bg-surface-container-low/60 flex flex-col justify-between space-y-3 transition-shadow hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-base">description</span>
                <span className="text-xs font-bold text-on-surface">Back Surface (Declarations)</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveImage ? handleRemoveImage('back') : handleClearMedia()}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-0.5 rounded transition-colors cursor-pointer"
                title="Remove back image"
              >
                <span className="material-symbols-outlined text-sm">delete</span>
                <span>Remove Image</span>
              </button>
            </div>

            <div className="w-full h-40 sm:h-44 bg-white rounded-lg border border-outline-variant/30 flex items-center justify-center overflow-hidden p-2">
              <img
                src={backImage.url}
                alt="Back Surface"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-outline-variant/20 text-xs">
              <p className="text-[11px] text-outline truncate max-w-[150px]" title={backImage.name}>
                {backImage.name || 'Back Panel'}
              </p>
              <button
                type="button"
                onClick={() => onOpenEvidenceModal?.(1)}
                className="font-semibold text-primary hover:text-on-primary-fixed-variant flex items-center gap-0.5 cursor-pointer text-xs"
              >
                <span className="material-symbols-outlined text-sm">zoom_in</span>
                <span>Preview</span>
              </button>
            </div>
          </div>
        ) : (
          /* Slot to add back panel if only 1 image provided */
          <div
            onClick={() => fileInputRef?.current?.click()}
            className="border-2 border-dashed border-outline-variant/50 rounded-xl p-6 bg-surface-container-lowest/60 hover:bg-surface-container-low flex flex-col items-center justify-center cursor-pointer transition-colors text-center"
          >
            <div className="w-10 h-10 rounded-full bg-surface-container text-primary flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
            </div>
            <span className="text-xs font-bold text-on-surface mb-0.5">Add Back Panel Image</span>
            <span className="text-[11px] text-outline max-w-[200px]">Attach rear declaration panel for 360° compliance checking (Optional)</span>
          </div>
        )}
      </div>
    </div>
  );
}
