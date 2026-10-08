import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getReceipt } from '../lib/receiptStore.js';
import { useServerKey } from '../context/ServerKeyContext.jsx';
import { verifyText, canonicalize, parsePublicKey } from '@topup/rsa';
import { ReceiptPaper } from '../components/ReceiptPaper.jsx';
import { VerifyPanel } from '../components/VerifyPanel.jsx';

export function Receipt() {
  const { id } = useParams();
  const { pubBig: currentPubBig, fingerprint: currentFingerprint } = useServerKey();

  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State simulasi pemalsuan
  const [isTampering, setIsTampering] = useState(false);
  const [tamperedReceipt, setTamperedReceipt] = useState(null);

  // State hasil verifikasi
  const [verifyResult, setVerifyResult] = useState(null);

  useEffect(() => {
    getReceipt(id)
      .then(data => {
        setOrderData(data);
        setTamperedReceipt({ ...data.receipt });
      })
      .catch(err => setError(err.message || 'Gagal memuat struk transaksi'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleTamperField = (field, value) => {
    setTamperedReceipt(prev => ({
      ...prev,
      [field]: value
    }));
    // Reset hasil verifikasi saat data diedit
    setVerifyResult(null);
  };

  const handleVerify = (useArchive = false) => {
    if (!orderData) return;

    // Pilih data struk yang sedang aktif ditampilkan
    const targetReceipt = isTampering ? tamperedReceipt : orderData.receipt;
    const signature = orderData.signature;

    // Pilih kunci verifikasi
    let targetPubBig = currentPubBig;
    if (useArchive && orderData.signerPub) {
      targetPubBig = parsePublicKey(orderData.signerPub);
    }

    if (!targetPubBig) {
      alert('Kunci publik belum tersedia di peramban');
      return;
    }

    try {
      const canonical = canonicalize(targetReceipt);
      const res = verifyText(canonical, signature, targetPubBig);
      setVerifyResult(res);
    } catch (err) {
      setVerifyResult({
        valid: false,
        hashComputed: '(Error kanonikalisasi: data tidak valid)',
        hashFromSignature: null
      });
    }
  };

  if (loading) {
    return (
      <div className="store-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <div style={{ color: 'var(--muted)' }}>Memuat bukti transaksi...</div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="store-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <h2 style={{ color: 'var(--bad)', marginBottom: '12px' }}>Struk Tidak Ditemukan</h2>
        <p style={{ color: 'var(--muted)', marginBottom: '20px' }}>{error}</p>
        <Link to="/" className="btn-primary">Kembali ke Beranda</Link>
      </div>
    );
  }

  const keyChanged = Boolean(
    orderData.keyFingerprint &&
    currentFingerprint &&
    orderData.keyFingerprint !== currentFingerprint
  );

  return (
    <div className="store-container" style={{ maxWidth: '640px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Link to="/" style={{ fontSize: '13px', color: 'var(--accent)', fontWeight: 600 }}>
          ← Belanja Lagi
        </Link>

        {/* Toggle Simulasi Pemalsuan */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px' }}>
          <input
            type="checkbox"
            checked={isTampering}
            onChange={(e) => {
              setIsTampering(e.target.checked);
              setVerifyResult(null);
            }}
            style={{ accentColor: 'var(--bad)' }}
          />
          <span style={{ color: isTampering ? 'var(--bad)' : 'var(--muted)', fontWeight: 600 }}>
            Simulasi Pemalsuan Data (Tamper Test)
          </span>
        </label>
      </div>

      {isTampering && (
        <div style={{
          backgroundColor: 'var(--bad-bg)',
          border: '1px solid var(--bad)',
          borderRadius: 'var(--radius)',
          padding: '10px 14px',
          color: 'var(--bad)',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
          <strong>Mode Pemalsuan Aktif:</strong> Anda dapat mengedit nilai User ID atau Total Pembayaran di struk di bawah ini, lalu klik tombol <em>Verifikasi di Browser</em> untuk membuktikan bahwa manipulasi 1 karakter pun akan menggagalkan tanda tangan digital RSA.
        </div>
      )}

      {/* Tampilan Struk */}
      <ReceiptPaper
        receipt={orderData.receipt}
        isTampering={isTampering}
        tamperedReceipt={tamperedReceipt}
        onTamperField={handleTamperField}
      />

      {/* Panel Verifikasi Tanda Tangan */}
      <VerifyPanel
        signature={orderData.signature}
        fingerprint={orderData.keyFingerprint}
        verifyResult={verifyResult}
        onVerify={() => handleVerify(false)}
        keyChanged={keyChanged}
        onVerifyArchiveKey={() => handleVerify(true)}
      />
    </div>
  );
}
