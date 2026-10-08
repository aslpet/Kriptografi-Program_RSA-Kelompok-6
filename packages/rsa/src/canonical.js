/**
 * Modul kanonikalisasi JSON deterministik.
 * Memastikan urutan kunci objek selalu terurut secara alfabetis tanpa spasi ekstra,
 * sehingga hasil hash SHA-256 identik antara klien dan server.
 */

export function canonicalize(val) {
  if (val === null) {
    return 'null';
  }
  if (typeof val === 'number') {
    if (!Number.isFinite(val)) {
      throw new TypeError('Nilai numerik tidak valid (NaN atau Infinity) tidak dapat dikanonikalisasi');
    }
    return String(val);
  }
  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }
  if (typeof val === 'string') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map(item => canonicalize(item === undefined ? null : item)).join(',') + ']';
  }
  if (typeof val === 'object') {
    const keys = Object.keys(val).sort();
    const parts = [];
    for (const key of keys) {
      const v = val[key];
      if (v !== undefined && typeof v !== 'symbol' && typeof v !== 'function') {
        parts.push(JSON.stringify(key) + ':' + canonicalize(v));
      }
    }
    return '{' + parts.join(',') + '}';
  }
  return JSON.stringify(val);
}
