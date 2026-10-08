import React, { useState, useEffect } from 'react';
import { generateKeyPair, signText, verifyText } from '@topup/rsa';
import { HexBlock } from './HexBlock.jsx';

export function PlaygroundSign() {
  const [keyPair, setKeyPair] = useState(null);
  const [originalMessage, setOriginalMessage] = useState('Pesan Integritas Dokumen Transaksi #9901');
  const [verifyMessage, setVerifyMessage] = useState('Pesan Integritas Dokumen Transaksi #9901');
  const [signatureHex, setSignatureHex] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    // Generate 1 kunci 512-bit untuk demonstrasi playground signing
    const k = generateKeyPair(512);
    setKeyPair(k);
  }, []);

  const handleSign = () => {
    if (!keyPair) return;
    const sig = signText(originalMessage, keyPair);
    setSignatureHex(sig);
    setVerifyMessage(originalMessage);
    const result = verifyText(originalMessage, sig, keyPair);
    setVerifyResult(result);
  };

  const handleLiveVerify = (changedText) => {
    setVerifyMessage(changedText);
    if (signatureHex && keyPair) {
      const result = verifyText(changedText, signatureHex, keyPair);
      setVerifyResult(result);
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px' }}>
      <h3 style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
        Laboratorium Tanda Tangan Digital & Deteksi Pemalsuan (Tampering)
      </h3>

      <div className="form-group">
        <label className="form-label">1. Pesan Asli untuk Ditandatangani:</label>
        <textarea
          rows={2}
          className="form-input"
          value={originalMessage}
          onChange={(e) => setOriginalMessage(e.target.value)}
        />
      </div>

      <button onClick={handleSign} className="btn-primary" style={{ marginBottom: '16px' }} disabled={!keyPair}>
        {keyPair ? 'Buat Tanda Tangan Digital (Sign)' : 'Membangkitkan Kunci 512-bit...'}
      </button>

      {signatureHex && (
        <div>
          <HexBlock hex={signatureHex} label="Tanda Tangan Digital s (Hex):" />

          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label" style={{ color: 'var(--accent)' }}>
              2. Uji Verifikasi / Simulasi Pemalsuan (Ubah pesan di bawah ini):
            </label>
            <textarea
              rows={2}
              className="form-input"
              value={verifyMessage}
              onChange={(e) => handleLiveVerify(e.target.value)}
            />
          </div>

          {verifyResult && (
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius)',
              border: `1px solid ${verifyResult.valid ? 'var(--ok)' : 'var(--bad)'}`,
              backgroundColor: verifyResult.valid ? 'var(--ok-bg)' : 'var(--bad-bg)',
              color: verifyResult.valid ? 'var(--ok)' : 'var(--bad)'
            }}>
              <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                {verifyResult.valid
                  ? '✓ TANDA TANGAN VALID — Data terbukti asli dan tidak pernah diubah'
                  : '✕ TANDA TANGAN GAGAL — Pesan telah dimanipulasi atau tidak cocok!'}
              </div>
              <div className="mono" style={{ fontSize: '11px', color: 'var(--text)' }}>
                Hash Dihitung: {verifyResult.hashComputed}
                <br />
                Hash dari Tanda Tangan: {verifyResult.hashFromSignature || '(Format rusak)'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
