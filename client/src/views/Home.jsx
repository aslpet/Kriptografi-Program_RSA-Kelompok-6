import React, { useState, useEffect } from 'react';
import { request } from '../lib/api.js';
import { GameCard } from '../components/GameCard.jsx';
import { Icon } from '../components/Icon.jsx';

export function Home() {
  const [catalogData, setCatalogData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    request('/api/catalog')
      .then(data => setCatalogData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="store-container">
      {/* Banner / Header Toko */}
      <div style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: '24px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h1 style={{ fontSize: '24px', color: 'var(--text)', marginBottom: '6px' }}>
            Top Up Game Cepat & Aman Terenkripsi RSA
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', maxWidth: '640px' }}>
            Platform top-up resmi fiktif. Seluruh data transaksi dienkripsi langsung di peramban menggunakan algoritma RSA publik server, dan bukti pembayaran diproteksi tanda tangan digital SHA-256.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-ok" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px' }}>
            <Icon name="shield-check" size={13} color="var(--ok)" />
            <span>Anti-Eavesdropping</span>
          </span>
          <span className="badge badge-accent" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px' }}>
            <Icon name="key" size={13} color="var(--accent)" />
            <span>Digital Signature</span>
          </span>
        </div>
      </div>

      {/* Daftar Game */}
      <div style={{ marginBottom: '36px' }}>
        <h2 style={{ fontSize: '18px', color: 'var(--text)', marginBottom: '14px', letterSpacing: '0.04em' }}>
          PILIH GAME UNTUK TOP UP
        </h2>

        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: '13px' }}>Memuat katalog game...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {catalogData?.games?.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        )}
      </div>

      {/* Panduan 3 Langkah RSA */}
      <div style={{
        backgroundColor: 'var(--surface-2)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        padding: '20px'
      }}>
        <h3 style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '14px' }}>
          Bagaimana RSA Melindungi Transaksi Anda?
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent)', marginBottom: '4px' }}>
              1. Enkripsi Kunci Publik
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Data sensitif (User ID, PIN, No HP) dienkripsi di browser dengan kunci publik server sebelum transmisi jaringan (m^e mod n).
            </div>
          </div>

          <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent)', marginBottom: '4px' }}>
              2. Dekripsi Kunci Privat
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Hanya server yang memegang kunci privat d yang dapat mendekripsi paket (c^d mod n), memastikan kerahasiaan penuh.
            </div>
          </div>

          <div style={{ borderLeft: '2px solid var(--accent)', paddingLeft: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--accent)', marginBottom: '4px' }}>
              3. Tanda Tangan Struk
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Server menandatangani struk transaksi digital. Peramban dapat memverifikasi keaslian dan mendeteksi jika data struk dimanipulasi.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
