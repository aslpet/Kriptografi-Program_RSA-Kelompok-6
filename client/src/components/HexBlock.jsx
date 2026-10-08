import React, { useState } from 'react';
import { Icon } from './Icon.jsx';
import { truncHex } from '../lib/format.js';

export function HexBlock({ hex, label, defaultTrunc = true }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!defaultTrunc);

  const handleCopy = () => {
    if (!hex) return;
    navigator.clipboard.writeText(hex);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  if (!hex) return null;

  return (
    <div style={{ marginBottom: '8px' }}>
      {label && (
        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, marginBottom: '4px' }}>
          {label}
        </div>
      )}
      <div className="hex-block">
        <div className="hex-text" title={hex}>
          {expanded ? hex : truncHex(hex, 16, 12)}
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {hex.length > 32 && (
            <button
              onClick={() => setExpanded(!expanded)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              {expanded ? 'Ringkas' : 'Penuh'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="btn-secondary"
            style={{ padding: '3px 8px', fontSize: '11px' }}
            title="Salin ke clipboard"
          >
            {copied ? 'Disalin!' : 'Salin'}
          </button>
        </div>
      </div>
    </div>
  );
}
