import React, { useState, useEffect } from 'react';
import { X, BarChart3, AlertTriangle } from 'lucide-react';
import { analyticsService } from '../../services/index.js';

export default function AnalyticsModal({ isOpen, onClose }) {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      analyticsService.getAnalyticsSummary()
        .then(data => setStats(data))
        .catch(err => console.error("Error loading analytics:", err))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card">
        
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BarChart3 style={{ width: 20, height: 20, color: '#38bdf8' }} />
              Legal Metrology Compliance Analytics & Trends
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Department of Consumer Affairs Enforcement Insights</p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: 6, borderRadius: 8 }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {isLoading || !stats ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#94a3b8', fontSize: '0.82rem' }}>
              Loading analytics data...
            </div>
          ) : (
            <>
              {/* Metric Cards */}
              <div className="grid-3">
                
                <div style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Total Packages Scanned
                  </span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff' }}>{stats.total_inspections}</span>
                  <span style={{ fontSize: '0.72rem', color: '#38bdf8', display: 'block', marginTop: 4 }}>Across Retail & FMCG</span>
                </div>

                <div style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Avg Compliance Score
                  </span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#34d399' }}>{stats.average_compliance_score}%</span>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: 4 }}>Weighted Rule Metric</span>
                </div>

                <div style={{ background: '#090d16', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                    Non-Compliant Packets
                  </span>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fb7185' }}>
                    {stats.status_distribution?.non_compliant || 0}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#fda4af', display: 'block', marginTop: 4 }}>Actionable Violations</span>
                </div>

              </div>

              {/* Status Breakdown Bar */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: 12 }}>
                  Statutory Status Distribution
                </h4>
                
                <div className="grid-3">
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: 12, borderRadius: 8 }}>
                    <span style={{ color: '#34d399', fontWeight: 800, fontSize: '1.1rem', display: 'block' }}>{stats.status_distribution?.compliant || 0}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Fully Compliant</span>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', padding: 12, borderRadius: 8 }}>
                    <span style={{ color: '#fbbf24', fontWeight: 800, fontSize: '1.1rem', display: 'block' }}>{stats.status_distribution?.flagged || 0}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Flagged / Review</span>
                  </div>
                  <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', padding: 12, borderRadius: 8 }}>
                    <span style={{ color: '#fb7185', fontWeight: 800, fontSize: '1.1rem', display: 'block' }}>{stats.status_distribution?.non_compliant || 0}</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>Non-Compliant</span>
                  </div>
                </div>
              </div>

              {/* Top Violations */}
              <div style={{ background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 12, padding: 16 }}>
                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#cbd5e1', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <AlertTriangle style={{ width: 14, height: 14, color: '#fbbf24' }} />
                  Most Frequent Legal Metrology Offenses
                </h4>

                {stats.top_violations?.length === 0 ? (
                  <p style={{ fontSize: '0.78rem', color: '#64748b', padding: '12px 0' }}>No violations recorded yet.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {stats.top_violations?.map((v, i) => (
                      <div key={i} className="flex items-center justify-between" style={{ background: '#090d16', padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '0.78rem' }}>
                        <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{v.rule}</span>
                        <span className="badge badge-fail" style={{ fontSize: '0.65rem' }}>{v.count} violations</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
