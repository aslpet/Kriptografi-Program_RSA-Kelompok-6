import React from 'react';
import { sanitizeDigits } from '@topup/shared';

export function AccountForm({
  fields = [],
  values = {},
  onChangeField,
  onBlurField,
  errors = {}
}) {
  // Normalisasi field jika berupa array string atau array object
  const normalizedFields = fields.map(f => {
    if (typeof f === 'string') {
      return {
        key: f,
        label: f === 'zoneId' ? 'Zone ID' : 'User ID Akun Game',
        min: f === 'zoneId' ? 3 : 6,
        max: f === 'zoneId' ? 6 : 12,
        placeholder: f === 'zoneId' ? 'Zone ID (angka)' : 'Masukkan User ID (angka)'
      };
    }
    return f;
  });

  const hasMultiple = normalizedFields.length > 1;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: hasMultiple ? '1fr 160px' : '1fr',
      gap: '14px'
    }}>
      {normalizedFields.map(f => {
        const val = values[f.key] || '';
        const err = errors[f.key];
        const isInvalid = Boolean(err);

        return (
          <div key={f.key} className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor={f.key}>
              {f.label}
            </label>
            <input
              id={f.key}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={f.max}
              className={`form-input mono ${isInvalid ? 'is-invalid' : ''}`}
              placeholder={f.placeholder || `Masukkan ${f.label}`}
              value={val}
              onChange={(e) => {
                const cleaned = sanitizeDigits(e.target.value, f.max);
                onChangeField(f.key, cleaned);
              }}
              onBlur={() => onBlurField && onBlurField(f.key)}
            />
            <div className="field-hint-row">
              <span className={`field-hint ${isInvalid ? 'error' : ''}`}>
                {err || `${f.min}–${f.max} digit angka`}
              </span>
              <span className="field-counter">
                {val.length}/{f.max}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
