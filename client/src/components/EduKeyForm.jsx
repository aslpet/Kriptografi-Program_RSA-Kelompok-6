import React, { useState } from 'react';
import { buildKeyPairFrom } from '@topup/rsa';

export function EduKeyForm() {
  const [pInput, setPInput] = useState('61');
  const [qInput, setQInput] = useState('53');
  const [eInput, setEInput] = useState('17');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCalculate = (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    try {
      const p = BigInt(pInput.trim());
      const q = BigInt(qInput.trim());
      const exp = BigInt(eInput.trim());

      const keys = buildKeyPairFrom(p, q, exp);
      setResult(keys);
    } catch (err) {
      setError(err.message || 'Gagal menghitung kunci dari input');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--radius)', padding: '20px', marginTop: '24px' }}>
      <h3 style={{ fontSize: '16px', color: 'var(--text)', marginBottom: '8px' }}>
        Mode Edukasi: Hitung Kunci Sendiri (Bilangan Kecil)
      </h3>
      <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
        Masukkan dua bilangan prima kecil dan eksponen e untuk melihat perhitungan langkah aritmetika RSA secara langsung di peramban.
      </p>

      <form onSubmit={handleCalculate} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr)) 120px', gap: '12px', alignItems: 'flex-end', marginBottom: '16px' }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="edu-p">Prima p</label>
          <input
            id="edu-p"
            type="number"
            className="form-input mono"
            value={pInput}
            onChange={(e) => setPInput(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="edu-q">Prima q</label>
          <input
            id="edu-q"
            type="number"
            className="form-input mono"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="edu-e">Eksponen e</label>
          <input
            id="edu-e"
            type="number"
            className="form-input mono"
            value={eInput}
            onChange={(e) => setEInput(e.target.value)}
          />
        </div>

        <button type="submit" className="btn-primary" style={{ height: '38px', fontSize: '12px' }}>
          Hitung Kunci
        </button>
      </form>

      {error && (
        <div style={{
          backgroundColor: 'var(--bad-bg)',
          border: '1px solid var(--bad)',
          borderRadius: 'var(--radius)',
          padding: '10px',
          color: 'var(--bad)',
          fontSize: '12px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {result && (
        <div style={{ backgroundColor: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--line)' }}>
          <h4 style={{ fontSize: '13px', color: 'var(--accent)', marginBottom: '12px' }}>
            Hasil Perhitungan Manual:
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontFamily: 'var(--font-mono)', fontSize: '12px', marginBottom: '16px' }}>
            <div>n = p × q: <strong>{result.n.toString()}</strong></div>
            <div>φ(n) = (p-1)(q-1): <strong>{result.phi.toString()}</strong></div>
            <div>e: <strong>{result.e.toString()}</strong></div>
            <div>d = e⁻¹ mod φ: <strong>{result.d.toString()}</strong></div>
          </div>

          {result.egcdTrace && result.egcdTrace.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', marginBottom: '6px' }}>
                Tabel Langkah Extended Euclidean (Menghitung Invers Modular d):
              </div>
              <div className="scroll-x">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--line)', textAlign: 'left', color: 'var(--muted)' }}>
                      <th style={{ padding: '6px' }}>Langkah</th>
                      <th style={{ padding: '6px' }}>q (Hasil Bagi)</th>
                      <th style={{ padding: '6px' }}>r (Sisa)</th>
                      <th style={{ padding: '6px' }}>s</th>
                      <th style={{ padding: '6px' }}>t</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.egcdTrace.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '5px 6px' }}>{row.step}</td>
                        <td style={{ padding: '5px 6px' }}>{row.q}</td>
                        <td style={{ padding: '5px 6px', fontWeight: 'bold', color: 'var(--text)' }}>{row.r}</td>
                        <td style={{ padding: '5px 6px' }}>{row.s}</td>
                        <td style={{ padding: '5px 6px' }}>{row.t}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
