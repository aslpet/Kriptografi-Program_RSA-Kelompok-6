import React, { useState } from 'react';
import { useCryptoLog } from '../context/CryptoLogContext.jsx';
import { Icon } from './Icon.jsx';
import { NetworkTab } from './NetworkTab.jsx';
import { ServerLogTab } from './ServerLogTab.jsx';
import { KeysTab } from './KeysTab.jsx';

export function CryptoDock() {
  const {
    dockOpen,
    setDockOpen,
    activeTab,
    setActiveTab,
    dockHeight,
    setDockHeight
  } = useCryptoLog();

  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (e) => {
    if (!dockOpen) return;
    e.preventDefault();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const newH = window.innerHeight - e.clientY;
    const minH = 220;
    const maxH = Math.min(window.innerHeight - 70, 850);
    setDockHeight(Math.max(minH, Math.min(newH, maxH)));
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
    }
  };

  const toggleSize = () => {
    if (!dockOpen) {
      setDockOpen(true);
      return;
    }
    setDockHeight(prev => (prev > 450 ? 340 : 580));
  };

  return (
    <div
      className={`crypto-dock ${!dockOpen ? 'is-collapsed' : ''} ${isDragging ? 'is-dragging' : ''}`}
      style={{
        height: dockOpen ? `${dockHeight}px` : undefined
      }}
    >
      {/* Resizer bar handle di sisi atas */}
      {dockOpen && (
        <div
          className="dock-resizer"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDoubleClick={toggleSize}
          title="Geser ke atas untuk memperbesar panel, ke bawah untuk memperkecil (Klik 2x untuk toggle ukuran)"
        >
          <div className="dock-resizer-handle" />
        </div>
      )}

      <div className="dock-header">
        <div className="dock-tabs">
          <button
            className={`dock-tab ${activeTab === 'network' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('network');
              if (!dockOpen) setDockOpen(true);
            }}
          >
            <Icon name="terminal" size={13} />
            <span>Paket Jaringan</span>
          </button>

          <button
            className={`dock-tab ${activeTab === 'logs' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('logs');
              if (!dockOpen) setDockOpen(true);
            }}
          >
            <span>Log Server & Kripto</span>
          </button>

          <button
            className={`dock-tab ${activeTab === 'keys' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('keys');
              if (!dockOpen) setDockOpen(true);
            }}
          >
            <Icon name="key" size={13} />
            <span>Kunci Aktif</span>
          </button>
        </div>

        <div className="dock-controls">
          {dockOpen && (
            <button
              onClick={toggleSize}
              style={{
                background: 'transparent',
                border: '1px solid var(--line)',
                borderRadius: 'var(--radius)',
                color: 'var(--muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                padding: '2px 8px'
              }}
              title={dockHeight > 450 ? 'Kembalikan ukuran panel standar (340px)' : 'Perbesar tinggi panel panel (580px)'}
            >
              <Icon name={dockHeight > 450 ? 'minimize-2' : 'maximize-2'} size={12} />
              <span>{dockHeight > 450 ? 'Standar' : 'Perbesar'}</span>
            </button>
          )}

          <button
            onClick={() => setDockOpen(!dockOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '11px',
              padding: '4px 8px'
            }}
          >
            <span>{dockOpen ? 'Lipat' : 'Buka'}</span>
            <Icon name={dockOpen ? 'chevron-down' : 'chevron-up'} size={14} />
          </button>
        </div>
      </div>

      {dockOpen && (
        <div className="dock-content">
          {activeTab === 'network' && <NetworkTab />}
          {activeTab === 'logs' && <ServerLogTab />}
          {activeTab === 'keys' && <KeysTab />}
        </div>
      )}
    </div>
  );
}
