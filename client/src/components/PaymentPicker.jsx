import React, { useState } from 'react';
import { sanitizeDigits } from '@topup/shared';

export function PaymentPicker({
  methods = [],
  selectedMethod,
  onSelectMethod,
  payNo = '',
  onChangePayNo,
  onBlurPayNo,
  pin = '',
  onChangePin,
  onBlurPin,
  errors = {}
}) {
  const [showPin, setShowPin] = useState(false);

  return (
    <div>
      <div className="payment-grid">
        {methods.map(m => {
          const isSelected = m.id === selectedMethod;
          return (
            <div
              key={m.id}
              className={`payment-card ${isSelected ? 'is-selected' : ''}`}
              onClick={() => onSelectMethod(m.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectMethod(m.id);
                }
              }}
            >
              <input
                type="radio"
                name="paymentMethod"
                checked={isSelected}
                onChange={() => onSelectMethod(m.id)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text)' }}>
                  {m.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                  {m.id === 'ewallet' ? 'Verifikasi via Nomor HP' : 'Otorisasi PIN 6 Digit'}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedMethod === 'ewallet' && (
        <div className="form-group" style={{ maxWidth: '340px', marginBottom: 0 }}>
          <label className="form-label" htmlFor="payNo">
            Nomor HP E-Wallet
          </label>
          <input
            id="payNo"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={13}
            className={`form-input mono ${errors.payNo ? 'is-invalid' : ''}`}
            placeholder="Contoh: 081234567890"
            value={payNo}
            onChange={(e) => {
              const cleaned = sanitizeDigits(e.target.value, 13);
              onChangePayNo(cleaned);
            }}
            onBlur={() => onBlurPayNo && onBlurPayNo()}
          />
          <div className="field-hint-row">
            <span className={`field-hint ${errors.payNo ? 'error' : ''}`}>
              {errors.payNo || 'Diawali 08, panjang 10–13 digit'}
            </span>
            <span className="field-counter">
              {payNo.length}/13
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            Nomor HP akan dienkripsi dengan RSA sebelum dikirim ke server.
          </div>
        </div>
      )}

      {selectedMethod === 'saldo' && (
        <div className="form-group" style={{ maxWidth: '280px', marginBottom: 0 }}>
          <label className="form-label" htmlFor="pin">
            PIN Transaksi (6 Digit)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="pin"
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              className={`form-input mono ${errors.pin ? 'is-invalid' : ''}`}
              placeholder="Contoh: 123456"
              value={pin}
              onChange={(e) => {
                const cleaned = sanitizeDigits(e.target.value, 6);
                onChangePin(cleaned);
              }}
              onBlur={() => onBlurPin && onBlurPin()}
              style={{ paddingRight: '60px' }}
            />
            <button
              type="button"
              onClick={() => setShowPin(!showPin)}
              style={{
                position: 'absolute',
                right: '6px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '11px',
                padding: '4px 6px',
                cursor: 'pointer'
              }}
            >
              {showPin ? 'Tutup' : 'Lihat'}
            </button>
          </div>
          <div className="field-hint-row">
            <span className={`field-hint ${errors.pin ? 'error' : ''}`}>
              {errors.pin || 'Tepat 6 digit angka'}
            </span>
            <span className="field-counter">
              {pin.length}/6
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
            PIN dienkripsi di browser & tidak pernah disimpan di struk atau log server.
          </div>
        </div>
      )}
    </div>
  );
}
