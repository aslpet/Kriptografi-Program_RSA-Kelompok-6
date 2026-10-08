import React from 'react';
import { HexBlock } from './HexBlock.jsx';
import { Icon } from './Icon.jsx';

export function VerifyPanel({
  signature,
  fingerprint,
  verifyResult,
  onVerify,
  keyChanged = false,
  onVerifyArchiveKey
}) {
  return (
    <div className="verify-box">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h4 style={{ fontSize: '14px', color: 'var(--text)', marginBottom: '2px' }}>
            Tanda Tangan Digital Server (RSA + SHA-256)
          </h4>
          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            Fingerprint Penandatangan: <span className="mono badge badge-accent">{fingerprint}</span>
          </div>
        </div>

        <button onClick={onVerify} className="btn-primary" style={{ padding: '8px 16px', fontSize: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Icon name="shield-check" size={14} color="var(--on-accent)" />
            <span>Verifikasi di Browser</span>
          </span>
        </button>
      </div>

      <HexBlock hex={signature} label="Nilai Tanda Tangan Digital s (Hex):" />

      {keyChanged && (
        <div style={{
          backgroundColor: 'var(--bad-bg)',
          border: '1px solid var(--bad)',
          borderRadius: 'var(--radius)',
          padding: '10px 12px',
          margin: '12px 0',
          fontSize: '12px',
          color: 'var(--bad)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Perhatian:</strong> Kunci aktif server telah di-generate ulang sejak struk ini diterbitkan!
          </div>
          {onVerifyArchiveKey && (
            <button onClick={onVerifyArchiveKey} className="btn-secondary" style={{ fontSize: '11px' }}>
              Verifikasi dengan Kunci Arsip
            </button>
          )}
        </div>
      )}

      {verifyResult && (
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Hasil Verifikasi:</span>
            {verifyResult.valid ? (
              <span className="badge badge-ok" style={{ padding: '4px 10px', fontSize: '12px' }}>
                ✓ TANDA TANGAN SAH & DATA ASLI
              </span>
            ) : (
              <span className="badge badge-bad" style={{ padding: '4px 10px', fontSize: '12px' }}>
                ✕ TIDAK VALID (DATA TELAH BERUBAH ATAU KUNCI SALAH)
              </span>
            )}
          </div>

          <div className="verify-hashes">
            <div className="hash-card">
              <div className="hash-label">1. Hash SHA-256 dari Data Struk Saat Ini:</div>
              <div className="hash-value">{verifyResult.hashComputed}</div>
            </div>

            <div className="hash-card">
              <div className="hash-label">2. Hash Hasil Dekripsi Tanda Tangan (s^e mod n):</div>
              <div className="hash-value">
                {verifyResult.hashFromSignature || '(Format padding rusak / dekripsi tidak valid)'}
              </div>
            </div>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {verifyResult.valid
              ? 'Integritas terjamin: Kedua hash identik persis, membuktikan data tidak dimanipulasi dan ditandatangani oleh pemegang kunci privat server.'
              : 'Peringatan keamanan: Hash tidak cocok. Entah data struk telah dimodifikasi atau tanda tangan dibuat dengan kunci lain.'}
          </div>
        </div>
      )}
    </div>
  );
}
