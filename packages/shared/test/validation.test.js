import { describe, it, expect } from 'vitest';
import { validateField, validateDigits, sanitizeDigits, maskPhone, maskPin } from '../src/validation.js';

describe('validation.js', () => {
  it('validasi playerId dengan validateField', () => {
    expect(validateField('playerId', '12345678')).toBeNull();
    expect(validateField('playerId', '12345')).not.toBeNull(); // < 6 digit
    expect(validateField('playerId', '1234567890123')).not.toBeNull(); // > 12 digit
    expect(validateField('playerId', 'abcdef')).not.toBeNull();
  });

  it('validasi zoneId dengan validateField', () => {
    expect(validateField('zoneId', '2201')).toBeNull();
    expect(validateField('zoneId', '12')).not.toBeNull(); // < 3 digit
    expect(validateField('zoneId', '1234567')).not.toBeNull(); // > 6 digit
  });

  it('validasi payNo dengan aturan diawali 08 dan panjang 10-13', () => {
    expect(validateField('payNo', '081234567890')).toBeNull();
    expect(validateField('payNo', '071234567890')).toBe('Nomor HP harus diawali 08');
    expect(validateField('payNo', '0812')).toBe('Nomor HP harus 10–13 digit angka');
    expect(validateField('payNo', '0812345678901234')).toBe('Nomor HP harus 10–13 digit angka');
    expect(validateField('payNo', '0812abc456')).toBe('Nomor HP hanya boleh berisi angka');
  });

  it('validasi pin tepat 6 digit angka', () => {
    expect(validateField('pin', '123456')).toBeNull();
    expect(validateField('pin', '12345')).toBe('PIN harus 6 digit angka');
    expect(validateField('pin', '1234567')).toBe('PIN harus 6 digit angka');
    expect(validateField('pin', 'abcdef')).toBe('PIN hanya boleh berisi angka');
  });

  it('validateDigits untuk aturan per-game dengan min/max spesifik', () => {
    const ablRule = { min: 6, max: 10, label: 'User ID' };
    expect(validateDigits('123456', ablRule)).toBeNull();
    expect(validateDigits('1234567890', ablRule)).toBeNull();
    expect(validateDigits('12345', ablRule)).toBe('User ID harus 6–10 digit angka');
    expect(validateDigits('12345678901', ablRule)).toBe('User ID harus 6–10 digit angka');
    expect(validateDigits('12345abc', ablRule)).toBe('User ID hanya boleh berisi angka');
    expect(validateDigits('', ablRule)).toBe('User ID wajib diisi');

    const exactRule = { min: 4, max: 4, label: 'PIN' };
    expect(validateDigits('123', exactRule)).toBe('PIN harus 4 digit angka');
  });

  it('sanitizeDigits menyaring karakter non-angka dan memotong panjang maksimal', () => {
    expect(sanitizeDigits('0812-3456-7890', 13)).toBe('081234567890');
    expect(sanitizeDigits('abc123xyz456', 5)).toBe('12345');
    expect(sanitizeDigits(null)).toBe('');
  });

  it('masking nomor hp dan pin', () => {
    expect(maskPhone('081234567890')).toBe('0812****7890');
    expect(maskPin('123456')).toBe('******');
  });
});
