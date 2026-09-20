import React from 'react';

/**
 * Potential Issues Requiring Verification List Component
 */
export default function PotentialIssuesList({ potentialIssues = [], onOpenEvidenceModal }) {
  return (
    <div className="space-y-2.5">
      <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
        potentialIssues.length > 0 ? 'text-error' : 'text-secondary'
      }`}>
        <span className="material-symbols-outlined text-sm">
          {potentialIssues.length > 0 ? 'error' : 'verified'}
        </span>
        <span>
          {potentialIssues.length > 0
            ? `Potential Issues Requiring Verification (${potentialIssues.length})`
            : 'Statutory Verification Status'}
        </span>
      </h4>

      {potentialIssues.length === 0 ? (
        <div className="bg-surface-container-lowest border border-secondary-fixed/50 rounded-lg p-4 shadow-sm flex items-center gap-3">
          <span className="material-symbols-outlined text-secondary text-2xl">check_circle</span>
          <div>
            <p className="text-xs font-bold text-on-surface">100% Compliant — No Regulatory Violations Found</p>
            <p className="text-[11px] text-outline">All evaluated mandatory declarations conform to Legal Metrology (Packaged Commodities) Rules, 2011.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {potentialIssues.map((issue, idx) => (
            <div
              key={issue.rule_id || idx}
              className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg p-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                      issue.status === 'FAIL'
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-amber-100 text-amber-900'
                    }`}
                  >
                    {issue.legal_reference || `Rule 6`}
                  </span>
                  <span className="text-xs font-bold text-on-surface">
                    {issue.rule_name}
                  </span>
                </div>
                <p className="text-xs text-outline">{issue.description}</p>
                {issue.remediation_guidance && (
                  <p className="text-[11px] text-on-surface-variant font-medium">
                    Required Action: {issue.remediation_guidance}
                  </p>
                )}
              </div>
              <button
                onClick={() => onOpenEvidenceModal(idx)}
                className="px-3 py-1.5 rounded text-xs font-bold bg-surface-container hover:bg-surface-container-highest text-primary transition-colors flex items-center gap-1 self-start sm:self-auto shrink-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">visibility</span>
                <span>View Evidence</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
