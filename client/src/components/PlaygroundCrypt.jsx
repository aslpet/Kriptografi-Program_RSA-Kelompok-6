import React, { useState } from 'react';
import {
  generateKeyPair,
  buildKeyPairFrom,
  encryptText,
  decryptText,
  encryptTextbook,
  decryptTextbook
} from '@topup/rsa';
import { useServerKey } from '../context/ServerKeyContext.jsx';
import { HexBlock } from './HexBlock.jsx';

export function PlaygroundCrypt() {
  const { pubBig: serverPub } = useServerKey();

  const [keyType, setKeyType] = useState('browser-512');
  const [customKey, setCustomKey] = useState(null);
  const [mode, setMode] = useState('padding'); // 'textbook' | 'padding'
  const [inputText, setInputText] = useState('Halo Kripto 2026!');
  const [cipherOutput, setCipherOutput] = useState(null);
  const [decryptedText, setDecryptedText] = useState(null);
  const [error, setError] = useState(null);

  // Generate / bangun kunci lokal
  const getActiveKey = () => {
    if (keyType === 'server') {
      return { pub: serverPub, priv: null, name: 'Kunci Publik Server' };
    }
    if (customKey && customKey.type === keyType) {
      return customKey;
    }
    let k;
    if (keyType === 'edu') {
      k = buildKeyPairFrom(61n, 53n, 17n); // n=3233
    } else if (keyType === 'browser-128') {
      k = generateKeyPair(128);
    } else if (keyType === 'browser-256') {
      k = generateKeyPair(256);
    } else {
      k = generateKeyPair(512);
    }
    k.type = keyType;
    setCustomKey(k);
    return k;
  };

  const handleEncrypt = () => {
    setError(null);
    setDecryptedText(null);
    try {
      const activeKey = getActiveKey();
      if (!activeKey?.pub && !activeKey?.n) throw new Error('Kunci tidak tersedia');

      const pub = activeKey.pub || activeKey;

      if (mode === 'textbook') {
        const ciphers = encryptTextbook(inputText, pub);
        setCipherOutput({ mode: 'textbook', data: ciphers });
      } else {
        const blocks = encryptText(inputText, pub);
        setCipherOutput({ mode: 'padding', data: blocks });
      }
    } catch (err) {
      setError(err.message || 'Gagal mengenkripsi teks');
    }
  };

  const handleDecrypt = () => {
    setError(null);
    try {
      const activeKey = getActiveKey();
      if (!activeKey?.d) {
        throw new Error('Dekripsi membutuhkan kunci privat (Kunci publik server tidak memiliki kunci privat di klien)');
      }

      if (cipherOutput.mode === 'textbook') {
        const text = decryptTextbook(cipherOutput.data, activeKey);
        setDecryptedText(text);
      } else {
        const text = decryptText(cipherOutput.data, activeKey);
        setDecryptedText(text);
      }
    } catch (err) {
      setError(err.message || 'Gagal mendekripsi ciphertext');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px' }}>
      <h3 style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '16px' }}>
        Laboratorium Enkripsi & Dekripsi RSA
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
        <div>
          <label className="form-label">Sumber Kunci RSA:</label>
          <select
            className="form-input"
            value={keyType}
            onChange={(e) => {
              setKeyType(e.target.value);
              setCipherOutput(null);
              setDecryptedText(null);
            }}
          >
            <option value="edu">Edukasi n=3233 (p=61, q=53) [Textbook Only]</option>
            <option value="browser-128">Kunci Browser 128-bit</option>
            <option value="browser-256">Kunci Browser 256-bit</option>
            <option value="browser-512">Kunci Browser 512-bit (Standar Transaksi)</option>
            <option value="server">Kunci Publik Server (Enkripsi Saja)</option>
          </select>
        </div>

        <div>
          <label className="form-label">Mode Enkripsi:</label>
          <div style={{ display: 'flex', gap: '10px', height: '40px', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="cryptMode"
                checked={mode === 'textbook'}
                onChange={() => setMode('textbook')}
                style={{ accentColor: 'var(--accent)' }}
              />
              Textbook (Per-Karakter m^e mod n)
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', cursor: keyType === 'edu' ? 'not-allowed' : 'pointer', opacity: keyType === 'edu' ? 0.5 : 1 }}>
              <input
                type="radio"
                name="cryptMode"
                disabled={keyType === 'edu'}
                checked={mode === 'padding'}
                onChange={() => setMode('padding')}
                style={{ accentColor: 'var(--accent)' }}
              />
              Dengan Padding (PKCS#1 v1.5)
            </label>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Teks Masukan (Plaintext):</label>
        <textarea
          rows={3}
          className="form-input mono"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ketik teks yang ingin dienkripsi..."
        />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <button onClick={handleEncrypt} className="btn-primary">
          Enkripsi (m^e mod n)
        </button>
        {cipherOutput && (
          <button onClick={handleDecrypt} className="btn-secondary" disabled={keyType === 'server'}>
            Dekripsi (c^d mod n)
          </button>
        )}
      </div>

      {error && (
        <div style={{ backgroundColor: 'var(--bad-bg)', border: '1px solid var(--bad)', borderRadius: 'var(--radius)', padding: '10px', color: 'var(--bad)', fontSize: '12px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {cipherOutput && (
        <div style={{ backgroundColor: 'var(--surface-2)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--line)', marginBottom: '14px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '6px' }}>
            Hasil Ciphertext ({cipherOutput.mode === 'textbook' ? 'Array Angka Desimal' : 'Blok Heksadesimal'}):
          </div>
          {cipherOutput.mode === 'textbook' ? (
            <div className="mono scroll-x" style={{ color: 'var(--accent)', fontSize: '12px' }}>
              [{cipherOutput.data.join(', ')}]
            </div>
          ) : (
            cipherOutput.data.map((b, idx) => (
              <HexBlock key={idx} hex={b} label={`Blok ${idx + 1}:`} />
            ))
          )}
        </div>
      )}

      {decryptedText !== null && (
        <div style={{ backgroundColor: 'var(--surface-2)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--ok)', color: 'var(--ok)' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>
            Hasil Dekripsi Berhasil:
          </div>
          <div className="mono" style={{ fontSize: '13px', color: 'var(--text)' }}>
            {decryptedText}
          </div>
        </div>
      )}
    </div>
  );
}
