import React from 'react';
import { rupiah, formatDateTime } from '../lib/format.js';

export function ReceiptPaper({
  receipt,
  isTampering = false,
  tamperedReceipt,
  onTamperField
}) {
  if (!receipt) return null;

  const current = isTampering ? tamperedReceipt : receipt;

  return (
    <div className="receipt-paper">
      <div className="receipt-header">
        <h2 className="receipt-title">LAPAK DIAMOND</h2>
        <div className="receipt-subtitle">BUKTI TRANSAKSI TOP-UP RESMI</div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--muted)' }}>
          {formatDateTime(current.ts)}
        </div>
      </div>

      <div className="receipt-body">
        <div className="receipt-row">
          <span style={{ color: 'var(--muted)' }}>No. Transaksi</span>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{current.orderId}</span>
        </div>

        <div className="receipt-row">
          <span style={{ color: 'var(--muted)' }}>Game</span>
          <span>{current.game}</span>
        </div>

        <div className="receipt-row">
          <span style={{ color: 'var(--muted)' }}>Item</span>
          <span>{current.item}</span>
        </div>

        <div className="receipt-row">
          <span style={{ color: 'var(--muted)' }}>User ID</span>
          {isTampering ? (
            <input
              type="text"
              className="form-input mono"
              style={{ padding: '2px 6px', width: '130px', height: '26px' }}
              value={current.playerId}
              onChange={(e) => onTamperField('playerId', e.target.value)}
            />
          ) : (
            <span>{current.playerId}</span>
          )}
        </div>

        {current.zoneId && (
          <div className="receipt-row">
            <span style={{ color: 'var(--muted)' }}>Zone ID</span>
            <span>{current.zoneId}</span>
          </div>
        )}

        <div className="receipt-row">
          <span style={{ color: 'var(--muted)' }}>Metode Bayar</span>
          <span>{current.method}</span>
        </div>

        {current.payNo && (
          <div className="receipt-row">
            <span style={{ color: 'var(--muted)' }}>Nomor Pembayaran</span>
            <span>{current.payNo}</span>
          </div>
        )}

        <div className="receipt-row total">
          <span>TOTAL PEMBAYARAN</span>
          {isTampering ? (
            <input
              type="number"
              className="form-input mono"
              style={{ padding: '2px 6px', width: '120px', height: '26px', textAlign: 'right' }}
              value={current.amount}
              onChange={(e) => onTamperField('amount', Number(e.target.value))}
            />
          ) : (
            <span>{rupiah(current.amount)}</span>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--muted)', borderTop: '1px dashed var(--line)', paddingTop: '12px' }}>
        Status: <span className="badge badge-ok">LUNAS / BERHASIL</span>
      </div>
    </div>
  );
}
