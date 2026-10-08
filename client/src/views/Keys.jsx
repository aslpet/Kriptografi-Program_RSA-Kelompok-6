import React from 'react';
import { KeyGenPanel } from '../components/KeyGenPanel.jsx';
import { EduKeyForm } from '../components/EduKeyForm.jsx';

export function Keys() {
  return (
    <div className="store-container" style={{ maxWidth: '820px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', color: 'var(--text)', marginBottom: '4px' }}>
          Manajemen & Pembangkitan Kunci RSA
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--muted)' }}>
          Halaman ini menampilkan proses pembangkitan pasangan kunci server (p, q, n, φ(n), e, d), kalkulasi Extended Euclidean, serta mode edukasi numerik kecil.
        </p>
      </div>

      <KeyGenPanel />
      <EduKeyForm />
    </div>
  );
}
