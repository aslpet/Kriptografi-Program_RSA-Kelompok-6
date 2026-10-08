import React, { useState } from 'react';
import { useCryptoLog } from '../context/CryptoLogContext.jsx';
import { formatTime } from '../lib/format.js';
import { Icon } from './Icon.jsx';

export function ServerLogTab() {
  const { clientLogs, serverLogs, clear } = useCryptoLog();
  const [filter, setFilter] = useState('all'); // 'all' | 'server' | 'client'
  const [expandedIds, setExpandedIds] = useState(new Set());

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const combined = [
    ...clientLogs.map(l => ({ ...l, source: 'CLIENT' })),
    ...serverLogs.map(l => ({ ...l, source: 'SERVER', kind: l.level, title: l.msg, values: l.meta }))
  ].sort((a, b) => b.ts - a.ts);

  const filtered = combined.filter(item => {
    if (filter === 'server') return item.source === 'SERVER';
    if (filter === 'client') return item.source === 'CLIENT';
    return true;
  });

  return (
    <div className="log-tab-wrapper">
      <div className="log-toolbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="log-filters">
            <button
              className={`log-filter-btn ${filter === 'all' ? 'is-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Semua ({combined.length})
            </button>
            <button
              className={`log-filter-btn ${filter === 'server' ? 'is-active' : ''}`}
              onClick={() => setFilter('server')}
            >
              Server ({serverLogs.length})
            </button>
            <button
              className={`log-filter-btn ${filter === 'client' ? 'is-active' : ''}`}
              onClick={() => setFilter('client')}
            >
              Klien ({clientLogs.length})
            </button>
          </div>
        </div>

        <button
          onClick={clear}
          className="btn-secondary"
          style={{ padding: '3px 8px', fontSize: '11px' }}
          title="Kosongkan riwayat log sisi klien"
        >
          Bersihkan Log Klien
        </button>
      </div>

      <div className="log-terminal">
        {filtered.length === 0 ? (
          <div style={{ color: 'var(--muted)', padding: '24px', textAlign: 'center', fontSize: '12px' }}>
            Belum ada aktivitas log yang tercatat.
          </div>
        ) : (
          filtered.map((item, idx) => {
            const hasDetails = item.values && Object.keys(item.values).length > 0;
            const itemId = item.id || `${item.ts}-${idx}`;
            const isExpanded = expandedIds.has(itemId);
            const isError = item.kind === 'error' || item.source === 'ERROR';

            let badgeClass = 'server';
            if (isError) badgeClass = 'error';
            else if (item.source === 'CLIENT') badgeClass = 'client';

            return (
              <div key={itemId} className="log-row-item">
                <div className="log-row-header">
                  <span className="log-time">
                    [{formatTime(item.ts)}]
                  </span>
                  <span className={`log-badge-src ${badgeClass}`}>
                    [{item.source}]
                  </span>
                  <span className="log-title">
                    {item.title}
                  </span>
                  {hasDetails && (
                    <button
                      onClick={() => toggleExpand(itemId)}
                      className="log-details-toggle"
                      title="Lihat rincian metadata operasi ini"
                    >
                      {isExpanded ? '[-] Ringkas' : '[+] Detail'}
                    </button>
                  )}
                </div>

                {hasDetails && isExpanded && (
                  <pre className="log-details-content">
                    {JSON.stringify(item.values, null, 2)}
                  </pre>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
