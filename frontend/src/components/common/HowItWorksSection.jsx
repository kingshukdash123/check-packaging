import React from 'react';

/**
 * HowItWorksSection Component
 * Compact, informative, and visually subtle explanation of the Legal Metrology inspection workflow:
 * 1. Upload package images
 * 2. AI extracts declarations
 * 3. Rules are checked and potential issues are identified
 */
export default function HowItWorksSection() {
  const steps = [
    {
      step: '1',
      title: 'Upload package images',
      desc: 'Attach clear front (PDP) and back declaration surface panels of any packaged commodity.',
      icon: 'upload_file'
    },
    {
      step: '2',
      title: 'AI extracts declarations',
      desc: 'Computer vision identifies mandatory labels: MRP, Net Quantity, Mfg Date, Expiry, and Manufacturer details.',
      icon: 'document_scanner'
    },
    {
      step: '3',
      title: 'Compliance rules are checked for potential issues.',
      desc: 'Automated verification against Legal Metrology Rules, 2011 flags missing or non-compliant declarations.',
      icon: 'fact_check'
    }
  ];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/20">
        <span className="material-symbols-outlined text-primary text-lg">info</span>
        <div>
          <h3 className="text-sm font-bold text-on-surface leading-tight">How it works</h3>
          <p className="text-[11px] text-outline">3-step automated statutory inspection pipeline</p>
        </div>
      </div>

      {/* 3 Step Process */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((s) => (
          <div key={s.step} className="flex items-start gap-3 border border-outline-variant/30 p-3 rounded-xl bg-surface-container-low/30">
            <div className="w-6 h-6 rounded-full bg-surface-container text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 shadow-xs">
              {s.step}
            </div>
            <div className="space-y-0.5 min-w-0">
              <h4 className="text-xs font-bold text-on-surface">
                <span>{s.title}</span>
              </h4>
              <p className="text-[11px] text-outline leading-relaxed">
                {s.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Subtle Tip / Note */}
      <div className="pt-2 border-t border-outline-variant/20 flex items-start gap-2 text-[11px] text-outline">
        <span className="material-symbols-outlined text-sm text-secondary shrink-0 mt-0.5">tips_and_updates</span>
        <p className="leading-snug">
          Tip: You can also choose from preloaded samples under <strong>Sample Packages</strong> in the sidebar.
        </p>
      </div>
    </div>
  );
}
