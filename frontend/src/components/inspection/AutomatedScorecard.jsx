import React from 'react';

/**
 * Automated Screening Scorecard Component
 */
export default function AutomatedScorecard({ scanner, ...directProps }) {
  const s = scanner || directProps;
  const { score, passCount, failCount, warnCount } = s;

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-5 shadow-sm space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-outline-variant/20">
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-outline uppercase tracking-wider">
            Automated Screening Score
          </h4>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-on-surface">
              {score} <span className="text-sm text-outline font-semibold">/ 100</span>
            </span>
            {score >= 90 ? (
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-secondary-fixed text-on-secondary-fixed border border-secondary/30">
                ✓ Compliant
              </span>
            ) : score >= 75 ? (
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                ⚠ Review Required
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-error-container text-on-error-container border border-error/30">
                ✕ Non-Compliant
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded bg-secondary-fixed text-on-secondary-fixed font-semibold">
            ✓ {passCount} Passed
          </span>
          <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container font-semibold">
            ✕ {failCount} Violation{failCount !== 1 ? 's' : ''}
          </span>
          <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-semibold">
            ⚠ {warnCount} Warning{warnCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-outline italic leading-relaxed">
        Screening result for enforcement assistance. Final determination remains with the authorized officer under the Legal Metrology Act, 2009.
      </p>
    </div>
  );
}
