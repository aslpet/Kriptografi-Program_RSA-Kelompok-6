import React, { useState } from 'react';
import { request } from '../lib/api.js';
import { useServerKey } from '../context/ServerKeyContext.jsx';
import { StepList } from './StepList.jsx';
import { HexBlock } from './HexBlock.jsx';
import { Icon } from './Icon.jsx';

export function KeyGenPanel() {
  const { pubHex, refresh } = useServerKey();
  const [bits, setBits] = useState(512);
  const [generating, setGenerating] = useState(false);
  const [trace, setTrace] = useState([]);
  const [debugKeys, setDebugKeys] = useState(null);
  const [showPrivate, setShowPrivate] = useState(false);

  const handleRegenerate = async () => {
    try {
      setGenerating(true);
      setTrace([]);
      setDebugKeys(null);
      setShowPrivate(false);

      const res = await request('/api/server/keys/regenerate', {
        method: 'POST',
        body: { bits }
      });

      setTrace(res.trace || []);
      await refresh();
    } catch (err) {
      alert('Gagal meregenerasi kunci: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleFetchDebugKeys = async () => {
    try {
      const data = await request('/api/server/keys/debug');
      setDebugKeys(data);
      setShowPrivate(true);
    } catch (err) {
      alert('Gagal mengambil kunci privat: ' + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px' }}>
      <h3 style={{ fontSize: '16px', color: 'var(--text)', marginBottom: '16px' }}>
        Pembangkitan Kunci Server (Key Generator)
      </h3>

      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <label className="form-label">Ukuran Modulus Kunci:</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`btn-secondary ${bits === 512 ? 'is-selected' : ''}`}
              style={{ borderColor: bits === 512 ? 'var(--accent)' : 'var(--line)', fontWeight: bits === 512 ? 700 : 400 }}
              onClick={() => setBits(512)}
            >
              512-bit (Cepat)
            </button>
            <button
              type="button"
              className={`btn-secondary ${bits === 1024 ? 'is-selected' : ''}`}
              style={{ borderColor: bits === 1024 ? 'var(--accent)' : 'var(--line)', fontWeight: bits === 1024 ? 700 : 400 }}
              onClick={() => setBits(1024)}
            >
              1024-bit
            </button>
          </div>
        </div>

        <div style={{ alignSelf: 'flex-end' }}>
          <button
            type="button"
            className="btn-primary"
            disabled={generating}
            onClick={handleRegenerate}
          >
            {generating ? 'Membangkitkan Prima & Kunci...' : '🔄 Generate Ulang Kunci Server'}
          </button>
        </div>
      </div>

      {trace.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '10px' }}>
            Tahapan Pembangkitan Kunci RSA ({bits}-bit):
          </h4>
          <StepList steps={trace} />
        </div>
      )}

      {pubHex && (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', marginTop: '16px' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--text)', marginBottom: '8px' }}>
            Kunci Publik Aktif Server ({pubHex.bits}-bit):
          </h4>
          <div style={{ marginBottom: '8px', fontSize: '12px', color: 'var(--muted)' }}>
            Fingerprint: <span className="mono badge badge-accent">{pubHex.fingerprint}</span>
          </div>
          <HexBlock hex={pubHex.n} label="Modulus n (Hex):" />
          <HexBlock hex={pubHex.e} label="Eksponen Publik e:" />
        </div>
      )}

      {/* Bagian Kunci Privat Khusus Demo */}
      <div style={{ borderTop: '1px solid var(--line)', paddingTop: '16px', marginTop: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)' }}>
              Kunci Privat Server (d, p, q, φ)
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
              Secara default disembunyikan untuk menjaga keamanan.
            </div>
          </div>

          <button
            onClick={showPrivate ? () => setShowPrivate(false) : handleFetchDebugKeys}
            className="btn-secondary"
            style={{ fontSize: '12px' }}
          >
            {showPrivate ? 'Sembunyikan Kunci Privat' : 'Tampilkan Kunci Privat (Khusus Demo)'}
          </button>
        </div>

        {showPrivate && debugKeys && (
          <div style={{ marginTop: '14px', backgroundColor: 'var(--surface-2)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--bad)' }}>
            <div style={{ color: 'var(--bad)', fontSize: '11px', fontWeight: 700, marginBottom: '8px' }}>
              ⚠️ PERINGATAN: Kunci privat hanya dapat diakses dalam mode demo edukasi melalui endpoint debug.
            </div>
            <HexBlock hex={debugKeys.d} label="Eksponen Privat d:" />
            <HexBlock hex={debugKeys.p} label="Bilangan Prima p:" />
            <HexBlock hex={debugKeys.q} label="Bilangan Prima q:" />
            <HexBlock hex={debugKeys.phi} label="Totient Euler φ(n):" />
          </div>
        )}
      </div>
    </div>
  );
}
