import React, { useState } from 'react';
import { X, Key, ShieldCheck, ExternalLink, Check } from 'lucide-react';

export default function ApiKeyModal({ isOpen, onClose, apiKey, onSaveApiKey }) {
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    setKeyInput('');
    onSaveApiKey('');
  };

  return (
    <div className="modal-overlay">
  <div
    className="modal-card"
    style={{
      maxWidth: 520,
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
        borderBottom: "1px solid #e8f0ea",
        padding: "16px 20px",
      }}
    >
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: "#e8f6eb",
            color: "#176b3a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Key style={{ width: 17, height: 17 }} />
        </div>

        <div>
          <h3
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#142019",
              margin: 0,
            }}
          >
            Configure Gemini Vision AI
          </h3>

          <p
            style={{
              fontSize: "0.72rem",
              color: "#6b7c71",
              marginTop: 2,
            }}
          >
            Multimodal label extraction for packaging images
          </p>
        </div>
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

    {/* Body */}
    <div className="modal-body" style={{ padding: 20 }}>
      {/* Info */}
      <div
        style={{
          background: "#f1f9f3",
          border: "1px solid #cfe8d5",
          borderRadius: 10,
          padding: 12,
          fontSize: "0.78rem",
          color: "#52645a",
        }}
      >
        <div
          style={{
            color: "#176b3a",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 5,
          }}
        >
          <ShieldCheck style={{ width: 14, height: 14 }} />
          How Gemini is used
        </div>

        <p style={{ lineHeight: 1.5, margin: 0 }}>
          Gemini Vision reads complex packaging labels and extracts structured
          information for the Legal Metrology PCR 2011 rule engine.
        </p>
      </div>

      {/* API Key */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginTop: 18,
        }}
      >
        <label
          style={{
            fontSize: "0.72rem",
            fontWeight: 700,
            textTransform: "uppercase",
            color: "#52645a",
            letterSpacing: "0.03em",
          }}
        >
          Google Gemini API Key
        </label>

        <input
          type="password"
          placeholder="AIzaSy..."
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          style={{
            width: "100%",
            padding: "10px 12px",
            background: "#ffffff",
            border: "1px solid #cfded3",
            borderRadius: 8,
            color: "#17211b",
            fontFamily: "var(--font-mono)",
            fontSize: "0.8rem",
            outline: "none",
          }}
        />

        <div
          className="flex justify-between"
          style={{
            fontSize: "0.72rem",
            color: "#7a8a80",
            marginTop: 2,
          }}
        >
          <span>Saved locally in browser storage</span>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            style={{
              color: "#176b3a",
              display: "flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            Get API Key
            <ExternalLink style={{ width: 12, height: 12 }} />
          </a>
        </div>
      </div>

      {/* Success */}
      {savedSuccess && (
        <div
          style={{
            marginTop: 16,
            background: "#edf9ef",
            border: "1px solid #bfe3c7",
            color: "#176b3a",
            padding: "9px 12px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: "0.78rem",
          }}
        >
          <Check style={{ width: 16, height: 16 }} />
          <span>Gemini API Key configured and active.</span>
        </div>
      )}
    </div>

    {/* Footer */}
    <div
      className="modal-footer"
      style={{
        borderTop: "1px solid #e8f0ea",
        padding: "14px 20px",
      }}
    >
      <button
        type="button"
        onClick={handleClear}
        className="btn btn-secondary btn-sm"
        style={{
          color: "#c24141",
          background: "transparent",
          border: "none",
          marginRight: "auto",
        }}
      >
        Clear Key
      </button>

      <button
        type="button"
        onClick={onClose}
        className="btn btn-secondary btn-sm"
        style={{
          background: "#f5f8f6",
          border: "1px solid #d7e4da",
          color: "#52645a",
        }}
      >
        Cancel
      </button>

      <button
        type="button"
        onClick={handleSave}
        className="btn btn-primary btn-sm"
        style={{
          background: "#176b3a",
          border: "1px solid #176b3a",
          color: "#ffffff",
          fontWeight: 600,
        }}
      >
        Save & Activate
      </button>
    </div>
  </div>
</div>
  );
}
