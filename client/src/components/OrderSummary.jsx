import React from 'react';
import { rupiah } from '../lib/format.js';
import { Icon } from './Icon.jsx';

export function OrderSummary({
  game,
  item,
  method,
  status,
  canSubmit,
  onSubmit,
  serverError
}) {
  const isProcessing = status === 'encrypting' || status === 'sending';

  let buttonLabel = 'Beli Sekarang';
  if (status === 'encrypting') buttonLabel = 'Mengenkripsi dengan RSA...';
  if (status === 'sending') buttonLabel = 'Mengirimkan Transaksi...';

  return (
    <aside className="order-summary-panel">
      <h3 className="summary-title">Ringkasan Pesanan</h3>

      <div className="summary-row">
        <span className="summary-label">Game</span>
        <span className="summary-value">{game?.name || '-'}</span>
      </div>

      <div className="summary-row">
        <span className="summary-label">Item</span>
        <span className="summary-value">{item?.label || 'Belum dipilih'}</span>
      </div>

      <div className="summary-row">
        <span className="summary-label">Pembayaran</span>
        <span className="summary-value">{method?.label || '-'}</span>
      </div>

      <div className="summary-row total">
        <span>Total Bayar</span>
        <span className="num">{item ? rupiah(item.price) : 'Rp 0'}</span>
      </div>

      {serverError && (
        <div style={{
          backgroundColor: 'var(--bad-bg)',
          border: '1px solid var(--bad)',
          borderRadius: 'var(--radius)',
          padding: '10px',
          color: 'var(--bad)',
          fontSize: '12px',
          marginBottom: '14px'
        }}>
          <strong>Gagal:</strong> {serverError}
        </div>
      )}

      <button
        type="button"
        className="btn-primary"
        style={{ width: '100%', marginTop: '6px' }}
        disabled={!canSubmit || isProcessing}
        onClick={onSubmit}
      >
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Icon name="lock" size={15} color="var(--on-accent)" />
          <span>{buttonLabel}</span>
        </span>
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        marginTop: '12px',
        fontSize: '11px',
        color: 'var(--muted)'
      }}>
        <Icon name="shield-check" size={13} color="var(--ok)" />
        <span>Enkripsi RSA 512/1024-bit End-to-End</span>
      </div>
    </aside>
  );
}
