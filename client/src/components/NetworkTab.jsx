import React, { useState } from 'react';
import { useCryptoLog } from '../context/CryptoLogContext.jsx';
import { request } from '../lib/api.js';
import { HexBlock } from './HexBlock.jsx';
import { Icon } from './Icon.jsx';

export function NetworkTab() {
  const { lastPacket, log } = useCryptoLog();
  const [replaying, setReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState(null);
  const [selectedBlockIdx, setSelectedBlockIdx] = useState(0);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!lastPacket) {
    return (
      <div style={{ color: 'var(--muted)', fontSize: '13px', textAlign: 'center', padding: '48px 16px' }}>
        <Icon name="terminal" size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
        <div>Belum ada paket transaksi yang dikirimkan.</div>
        <div style={{ fontSize: '11px', marginTop: '4px' }}>
          Lakukan transaksi top up diamond pada katalog game untuk mengamati proses enkripsi dan paket ciphertext RSA.
        </div>
      </div>
    );
  }

  const handleReplay = async () => {
    try {
      setReplaying(true);
      setReplayResult(null);
      log({
        kind: 'replay',
        title: 'Mengirimkan ulang paket transaksi persis sama (Uji Replay Attack)...',
        values: { blocksCount: lastPacket.blocks.length }
      });

      const res = await request('/api/checkout', {
        method: 'POST',
        body: { blocks: lastPacket.blocks }
      });
      setReplayResult({ ok: true, data: res });
    } catch (err) {
      setReplayResult({ ok: false, error: err });
      log({
        kind: 'error',
        title: `Server Menolak Replay: [${err.code}] ${err.message}`,
        values: { status: err.status, code: err.code }
      });
    } finally {
      setReplaying(false);
    }
  };

  const copyPlaintext = () => {
    navigator.clipboard.writeText(lastPacket.plaintext);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 1200);
  };

  // Format Plaintext JSON
  let formattedPlaintext = lastPacket.plaintext;
  try {
    formattedPlaintext = JSON.stringify(JSON.parse(lastPacket.plaintext), null, 2);
  } catch {
    // Tetap gunakan string asli
  }

  const payloadByteLen = new TextEncoder().encode(lastPacket.plaintext).length;
  const totalBlocks = lastPacket.blocks.length;
  const currentBlockIdx = Math.min(selectedBlockIdx, totalBlocks - 1);
  const blockDetail = lastPacket.blockDetails?.[currentBlockIdx];

  // Hitung byte segment padding EM untuk blok terpilih
  const kBytes = Math.floor(lastPacket.bits / 8);
  const emDesc = blockDetail?.emDesc;
  const psBytes = emDesc?.ps ? emDesc.ps.length / 2 : Math.max(kBytes - 11 - 16, 8);
  const dataBytes = emDesc?.data ? emDesc.data.length / 2 : Math.min(payloadByteLen, kBytes - 11);

  return (
    <div>
      {/* 1. Summary Bar */}
      <div className="net-summary-bar">
        <div className="net-meta-tags">
          <span className="badge badge-accent">RSA {lastPacket.bits}-bit</span>
          <span style={{ color: 'var(--muted)' }}>
            Server FP: <strong className="mono" style={{ color: 'var(--text)' }}>{lastPacket.fingerprint}</strong>
          </span>
          <span style={{ color: 'var(--muted)' }}>
            Ukuran Payload: <strong style={{ color: 'var(--text)' }}>{payloadByteLen} B</strong>
          </span>
          <span style={{ color: 'var(--muted)' }}>
            Jumlah Blok: <strong style={{ color: 'var(--text)' }}>{totalBlocks}</strong>
          </span>
          <span style={{ color: 'var(--muted)' }}>
            Enkripsi Browser: <strong style={{ color: 'var(--text)' }}>{lastPacket.durationMs} ms</strong>
          </span>
        </div>

        <button
          onClick={handleReplay}
          disabled={replaying}
          className="btn-danger"
          style={{ fontSize: '11px', padding: '4px 10px', flexShrink: 0 }}
          title="Kirim ulang blok ciphertext yang sama ke server untuk menguji verifikasi nonce anti-replay"
        >
          {replaying ? 'Menguji Replay...' : '⚡ Demo Replay Attack'}
        </button>
      </div>

      {/* 2. Replay Alert Result */}
      {replayResult && (
        <div
          style={{
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            fontSize: '12px',
            marginBottom: '12px',
            backgroundColor: replayResult.ok ? 'var(--bad-bg)' : 'rgba(129, 201, 149, 0.1)',
            border: `1px solid ${replayResult.ok ? 'var(--bad)' : 'var(--ok)'}`,
            color: replayResult.ok ? 'var(--bad)' : 'var(--ok)'
          }}
        >
          {replayResult.ok ? (
            <div>
              <strong>PERINGATAN:</strong> Server menerima paket replay! (Perlindungan nonce tidak aktif)
            </div>
          ) : (
            <div>
              <strong>PROTEKSI REPLAY BERHASIL:</strong> Server menolak transaksi berulang ({replayResult.error.code}): {replayResult.error.message}
            </div>
          )}
        </div>
      )}

      {/* 3. Visualisasi Padding EM (Encoded Message PKCS#1 v1.5 Tipe 2) */}
      <div className="em-inspector-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 700 }}>
            Visualisasi Struktur Blok EM (Encoded Message, Modulus k = {kBytes} Byte):
          </div>

          {totalBlocks > 1 && (
            <div className="em-block-tabs">
              <span style={{ fontSize: '10px', color: 'var(--muted)' }}>Pilih Blok:</span>
              {lastPacket.blocks.map((_, idx) => (
                <button
                  key={idx}
                  className={`em-block-btn ${idx === currentBlockIdx ? 'is-active' : ''}`}
                  onClick={() => setSelectedBlockIdx(idx)}
                >
                  Blok {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Proportional EM Bar */}
        <div className="em-bar" style={{ display: 'flex', width: '100%', height: '24px' }}>
          <div
            className="em-seg-header"
            style={{ flex: 2, minWidth: '42px' }}
            title="00 02 (Header enkripsi PKCS#1 v1.5 Tipe 2 - 2 Byte)"
          >
            00 02 (2 B)
          </div>
          <div
            className="em-seg-ps"
            style={{ flex: Math.max(psBytes, 10), minWidth: '80px' }}
            title={`PS: Random non-zero padding string (${psBytes} Byte)`}
          >
            PS Acak ({psBytes} B)
          </div>
          <div
            className="em-seg-sep"
            style={{ flex: 1, minWidth: '44px' }}
            title="00 (Byte pemisah/separator padding dan payload - 1 Byte)"
          >
            00 (1B)
          </div>
          <div
            className="em-seg-data"
            style={{ flex: Math.max(dataBytes, 10), minWidth: '70px' }}
            title={`M: Potongan payload data plaintext (${dataBytes} Byte)`}
          >
            Data M ({dataBytes} B)
          </div>
        </div>

        {/* Breakdown Card */}
        <div className="em-breakdown-grid">
          <div className="em-breakdown-card">
            <div className="title">Header (2 B)</div>
            <div className="val mono" style={{ color: '#92b6f0' }}>00 02</div>
          </div>
          <div className="em-breakdown-card">
            <div className="title">Padding PS ({psBytes} B)</div>
            <div className="val mono" style={{ color: 'var(--accent)' }} title={emDesc?.ps || ''}>
              {emDesc?.ps ? emDesc.ps.slice(0, 16) + '...' : 'Acak non-nol'}
            </div>
          </div>
          <div className="em-breakdown-card">
            <div className="title">Separator (1 B)</div>
            <div className="val mono" style={{ color: '#f28b82' }}>00</div>
          </div>
          <div className="em-breakdown-card">
            <div className="title">Data Payload M ({dataBytes} B)</div>
            <div className="val mono" style={{ color: 'var(--ok)' }} title={emDesc?.data || ''}>
              {emDesc?.data ? emDesc.data.slice(0, 16) + '...' : 'UTF-8 Hex'}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Plaintext JSON vs Ciphertext Grid */}
      <div className="net-compare-grid">
        {/* Kolom 1: Plaintext */}
        <div className="net-pane">
          <div className="net-pane-header">
            <span>1. Plaintext Sebelum Enkripsi (JSON):</span>
            <button
              onClick={copyPlaintext}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent)',
                fontSize: '10px',
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              {copiedJson ? 'Disalin!' : 'Salin JSON'}
            </button>
          </div>
          <pre className="code-view">
            {formattedPlaintext}
          </pre>
        </div>

        {/* Kolom 2: Ciphertext */}
        <div className="net-pane">
          <div className="net-pane-header">
            <span>2. Ciphertext yang Dikirimkan ({totalBlocks} Blok):</span>
            <span style={{ fontSize: '10px', color: 'var(--muted)' }}>c = m^e mod n</span>
          </div>
          <div style={{ minHeight: '140px', flex: 1, overflowY: 'auto' }}>
            {lastPacket.blocks.map((b, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedBlockIdx(idx)}
                style={{
                  cursor: 'pointer',
                  border: idx === currentBlockIdx ? '1px solid var(--accent)' : '1px solid transparent',
                  borderRadius: 'var(--radius)',
                  marginBottom: '4px'
                }}
              >
                <HexBlock hex={b} label={`Blok ${idx + 1} (${b.length / 2} Byte):`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
