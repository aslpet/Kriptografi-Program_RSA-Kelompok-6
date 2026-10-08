/**
 * Aturan validasi bersama antara Frontend dan Backend.
 */

export const RULES = {
  playerId: {
    re: /^\d{6,12}$/,
    msg: 'User ID harus 6–12 digit angka'
  },
  zoneId: {
    re: /^\d{3,6}$/,
    msg: 'Zone ID harus 3–6 digit angka'
  },
  payNo: {
    re: /^08\d{8,11}$/,
    msg: 'Nomor HP diawali 08 dengan panjang 10–13 digit angka'
  },
  pin: {
    re: /^\d{6}$/,
    msg: 'PIN harus 6 digit angka'
  }
};

/**
 * Membersihkan input agar hanya menyisakan angka, dibatasi maksimum panjangnya.
 */
export function sanitizeDigits(value, max) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return typeof max === 'number' ? digits.slice(0, max) : digits;
}

/**
 * Validasi umum untuk field numerik per game (misal User ID / Zone ID).
 */
export function validateDigits(value, { min = 1, max = 20, label = 'Field' } = {}) {
  const v = String(value ?? '').trim();
  if (!v) {
    return `${label} wajib diisi`;
  }
  if (!/^\d+$/.test(v)) {
    return `${label} hanya boleh berisi angka`;
  }
  if (v.length < min || v.length > max) {
    return min === max
      ? `${label} harus ${min} digit angka`
      : `${label} harus ${min}–${max} digit angka`;
  }
  return null;
}

/**
 * Validasi spesifik field standar seperti payNo dan pin.
 */
export function validateField(fieldName, value) {
  const strVal = String(value ?? '').trim();
  if (!strVal) {
    return 'Field ini wajib diisi';
  }

  if (fieldName === 'payNo') {
    if (!/^\d+$/.test(strVal)) return 'Nomor HP hanya boleh berisi angka';
    if (!strVal.startsWith('08')) return 'Nomor HP harus diawali 08';
    if (strVal.length < 10 || strVal.length > 13) return 'Nomor HP harus 10–13 digit angka';
    return null;
  }

  if (fieldName === 'pin') {
    if (!/^\d+$/.test(strVal)) return 'PIN hanya boleh berisi angka';
    if (strVal.length !== 6) return 'PIN harus 6 digit angka';
    return null;
  }

  const rule = RULES[fieldName];
  if (!rule) return null;
  if (!rule.re.test(strVal)) {
    return rule.msg;
  }
  return null;
}

export function maskPhone(phone) {
  if (typeof phone !== 'string') return '';
  const clean = phone.trim();
  if (clean.length < 8) return clean;
  return clean.slice(0, 4) + '****' + clean.slice(-4);
}

export function maskPin(pin) {
  return '******';
}
