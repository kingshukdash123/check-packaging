import React, { useState, useEffect } from 'react';
import { X, Search, FileText, Download, ShieldCheck, ShieldAlert, ShieldX, RefreshCw } from 'lucide-react';
import { historyService, scanService } from '../../services/index.js';

export default function AuditHistoryModal({ isOpen, onClose, onSelectScanId }) {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const data = await historyService.getHistory();
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load history:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = history.filter(item => 
    item.product_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.brand_name?.toLowerCase().includes(search.toLowerCase()) ||
    item.scan_id?.toLowerCase().includes(search.toLowerCase())
  );

  return (
   <div className="modal-overlay">
  <div
    className="modal-card"
    style={{
      maxWidth: 760,
      background: "#ffffff",
      color: "#17211b",
      border: "1px solid #dce9df",
      boxShadow: "0 20px 50px rgba(16, 72, 40, 0.12)",
    }}
  >
    {/* Header */}
    <div
      className="modal-header"
      style={{
        padding: "16px 20px",
        borderBottom: "1px solid #e8f0ea",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            color: "#142019",
            display: "flex",
            alignItems: "center",
            gap: 8,
            margin: 0,
          }}
        >
          <FileText
            style={{
              width: 19,
              height: 19,
              color: "#176b3a",
            }}
          />
          Packaging Compliance Audit Log
        </h3>

        <p
          style={{
            fontSize: "0.75rem",
            color: "#6b7c71",
            marginTop: 3,
          }}
        >
          Search and review previously audited commodities
        </p>
      </div>

      <button
        onClick={onClose}
        className="btn btn-secondary btn-sm"
        style={{
          padding: 6,
          borderRadius: 8,
          background: "#f4f8f5",
          border: "1px solid #dce9df",
          color: "#52645a",
        }}
      >
        <X style={{ width: 16, height: 16 }} />
      </button>
    </div>

    {/* Search */}
    <div
      className="flex items-center gap-2"
      style={{
        padding: "12px 20px",
        background: "#f8fbf9",
        borderBottom: "1px solid #e8f0ea",
      }}
    >
      <div
        className="flex items-center flex-1"
        style={{ position: "relative" }}
      >
        <Search
          style={{
            width: 14,
            height: 14,
            color: "#7a8a80",
            position: "absolute",
            left: 11,
          }}
        />

        <input
          type="text"
          placeholder="Search by brand, commodity, or scan ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 12px 9px 32px",
            background: "#ffffff",
            border: "1px solid #cfded3",
            borderRadius: 8,
            color: "#17211b",
            fontSize: "0.78rem",
            outline: "none",
          }}
        />
      </div>

      <button
        onClick={fetchHistory}
        className="btn btn-secondary btn-sm"
        title="Refresh History"
        style={{
          padding: 8,
          background: "#ffffff",
          border: "1px solid #cfded3",
          color: "#176b3a",
        }}
      >
        <RefreshCw
          style={{ width: 14, height: 14 }}
          className={isLoading ? "spin" : ""}
        />
      </button>
    </div>

    {/* History */}
    <div className="modal-body" style={{ padding: 20 }}>
      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px 0",
            color: "#7a8a80",
            fontSize: "0.82rem",
          }}
        >
          {isLoading
            ? "Loading audit records..."
            : "No scan records found."}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => {
            let badgeClass = "badge-pass";
            let StatusIcon = ShieldCheck;
            let statusColor = "#176b3a";
            let statusBg = "#edf9ef";

            if (item.overall_status === "NON_COMPLIANT") {
              badgeClass = "badge-fail";
              StatusIcon = ShieldX;
              statusColor = "#c24141";
              statusBg = "#fff1f1";
            } else if (
              item.overall_status === "FLAGGED_FOR_REVIEW"
            ) {
              badgeClass = "badge-warning";
              StatusIcon = ShieldAlert;
              statusColor = "#a16207";
              statusBg = "#fff8e7";
            }

            return (
              <div
                key={item.scan_id}
                className="flex flex-wrap items-center justify-between gap-3"
                style={{
                  background: "#ffffff",
                  border: "1px solid #e0e9e2",
                  borderRadius: 10,
                  padding: "12px 14px",
                  transition: "border-color 0.2s, box-shadow 0.2s",
                }}
              >
                {/* Record */}
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: statusBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <StatusIcon
                      style={{
                        width: 18,
                        height: 18,
                        color: statusColor,
                      }}
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4
                        style={{
                          fontSize: "0.88rem",
                          fontWeight: 700,
                          color: "#17211b",
                          margin: 0,
                        }}
                      >
                        {item.product_name || item.brand_name}
                      </h4>

                      <span
                        className={`badge ${badgeClass}`}
                        style={{
                          fontSize: "0.62rem",
                          background: statusBg,
                          color: statusColor,
                          border: "none",
                        }}
                      >
                        {item.compliance_score}%
                      </span>
                    </div>

                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: "#7a8a80",
                        marginTop: 3,
                      }}
                    >
                      {item.timestamp} · Scan ID:{" "}
                      {item.scan_id.slice(0, 8)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectScanId(item.scan_id);
                      onClose();
                    }}
                    className="btn btn-secondary btn-sm"
                    style={{
                      background: "#f5f8f6",
                      border: "1px solid #d7e4da",
                      color: "#52645a",
                    }}
                  >
                    View Report
                  </button>

                  <a
                    href={scanService.getPdfExportUrl(item.scan_id)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary btn-sm"
                    style={{
                      background: "#176b3a",
                      border: "1px solid #176b3a",
                      color: "#ffffff",
                    }}
                  >
                    <Download
                      style={{ width: 12, height: 12 }}
                    />
                    PDF
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  </div>
</div>
  );
}
