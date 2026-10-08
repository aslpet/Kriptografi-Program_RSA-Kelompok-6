import React from 'react';
import { useServerKey } from '../context/ServerKeyContext.jsx';
import { HexBlock } from './HexBlock.jsx';
import { Icon } from './Icon.jsx';

export function KeysTab() {
  const { pubHex, loading, refresh } = useServerKey();

  if (loading) {
    return <div style={{ color: 'var(--muted)', fontSize: '12px', padding: '24px 0', textAlign: 'center' }}>Memuat kunci publik server...</div>;
  }

  if (!pubHex) {
    return (
      <div style={{ color: 'var(--bad)', fontSize: '12px', padding: '24px 0', textAlign: 'center' }}>
        Gagal memuat kunci publik server. Periksa koneksi ke backend.
      </div>
    );
  }

  const nByteLength = Math.ceil(pubHex.n.length / 2);

  return (
    <div>
      <div className="net-summary-bar">
        <div className="net-meta-tags">
          <span className="badge badge-accent">{pubHex.bits}-bit RSA Key</span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Fingerprint: <strong className="mono" style={{ color: 'var(--text)' }}>{pubHex.fingerprint}</strong>
          </span>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Panjang Modulus: <strong className="mono" style={{ color: 'var(--text)' }}>{nByteLength} Byte ({pubHex.n.length} hex)</strong>
          </span>
        </div>

        <button
          onClick={refresh}
          className="btn-secondary"
          style={{ padding: '3px 10px', fontSize: '11px' }}
          title="Ambil ulang kunci publik aktif dari server"
        >
          Sinkronkan Kunci
        </button>
      </div>

      <div style={{
        backgroundColor: 'var(--surface-2)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: '8px 12px',
        fontSize: '11px',
        color: 'var(--muted)',
        marginBottom: '12px',
        lineHeight: 1.5
      }}>
        <strong style={{ color: 'var(--accent)' }}>💡 Info Fingerprint:</strong> Sidik jari (Fingerprint) dihitung menggunakan SHA-256 terhadap modulus n: <code className="mono" style={{ color: 'var(--text)' }}>SHA-256(n).slice(0, 16)</code>. Klien menggunakan nilai ini untuk memvalidasi bahwa paket transaksi dienkripsi dengan kunci server yang sah.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '10px' }}>
        <HexBlock hex={pubHex.n} label={`Modulus n (Publik - ${pubHex.bits} bit):`} />
        <HexBlock hex={pubHex.e} label="Eksponen Publik e (Hex):" />
      </div>
    </div>
  );
}
