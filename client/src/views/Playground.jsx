import React, { useState } from 'react';
import { PlaygroundCrypt } from '../components/PlaygroundCrypt.jsx';
import { PlaygroundSign } from '../components/PlaygroundSign.jsx';

export function Playground() {
  const [tab, setTab] = useState('crypt'); // 'crypt' | 'sign'

  return (
    <div className="store-container" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '4px' }}>
          Playground Interaktif RSA
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Uji coba mandiri enkripsi/dekripsi teks dan pembuatan serta verifikasi tanda tangan digital.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <button
          onClick={() => setTab('crypt')}
          className={`btn-secondary ${tab === 'crypt' ? 'is-selected' : ''}`}
          style={{
            borderColor: tab === 'crypt' ? 'var(--accent)' : 'var(--line)',
            color: tab === 'crypt' ? 'var(--accent)' : 'var(--text)',
            fontWeight: tab === 'crypt' ? 700 : 400
          }}
        >
          Enkripsi & Dekripsi
        </button>

        <button
          onClick={() => setTab('sign')}
          className={`btn-secondary ${tab === 'sign' ? 'is-selected' : ''}`}
          style={{
            borderColor: tab === 'sign' ? 'var(--accent)' : 'var(--line)',
            color: tab === 'sign' ? 'var(--accent)' : 'var(--text)',
            fontWeight: tab === 'sign' ? 700 : 400
          }}
        >
          Tanda Tangan & Verifikasi
        </button>
      </div>

      {tab === 'crypt' ? <PlaygroundCrypt /> : <PlaygroundSign />}
    </div>
  );
}
