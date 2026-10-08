/**
 * Modul pembangkit bilangan acak berbasis kriptografis.
 * Satu-satunya modul yang mengakses globalThis.crypto.getRandomValues.
 */

import { bytesToBig, bitLength } from './bytes.js';

export function randomBytes(n) {
  if (typeof n !== 'number' || n < 0 || !Number.isInteger(n)) {
    throw new RangeError('Panjang byte harus bilangan bulat non-negatif');
  }
  const out = new Uint8Array(n);
  if (n === 0) return out;

  // Safeguard: batasi chunk ke 65536 byte sesuai batas WebCrypto getRandomValues
  const CHUNK_SIZE = 65536;
  for (let offset = 0; offset < n; offset += CHUNK_SIZE) {
    const sliceLen = Math.min(CHUNK_SIZE, n - offset);
    const chunk = new Uint8Array(sliceLen);
    globalThis.crypto.getRandomValues(chunk);
    out.set(chunk, offset);
  }
  return out;
}

export function randomBigInt(bits) {
  if (typeof bits !== 'number' || bits < 0 || !Number.isInteger(bits)) {
    throw new RangeError('Jumlah bit harus bilangan bulat non-negatif');
  }
  if (bits === 0) return 0n;

  const numBytes = Math.ceil(bits / 8);
  const bytes = randomBytes(numBytes);
  const extraBits = numBytes * 8 - bits;
  if (extraBits > 0) {
    bytes[0] &= 0xff >>> extraBits;
  }
  return bytesToBig(bytes);
}

export function randomRange(min, max) {
  if (typeof min !== 'bigint' || typeof max !== 'bigint') {
    throw new TypeError('Batas min dan max harus berupa BigInt');
  }
  if (max < min) {
    throw new RangeError('Batas maksimum tidak boleh lebih kecil dari batas minimum');
  }
  const range = max - min + 1n;
  const bits = bitLength(range);

  // Rejection sampling untuk mencegah bias modulo
  let r;
  do {
    r = randomBigInt(bits);
  } while (r >= range);

  return min + r;
}

export function randomNonZeroBytes(n) {
  if (typeof n !== 'number' || n < 0 || !Number.isInteger(n)) {
    throw new RangeError('Panjang byte harus bilangan bulat non-negatif');
  }
  const out = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    let b;
    do {
      b = randomBytes(1)[0];
    } while (b === 0);
    out[i] = b;
  }
  return out;
}
