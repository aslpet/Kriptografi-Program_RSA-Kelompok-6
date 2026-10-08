/**
 * Utilitas konversi byte, hex, BigInt, dan manipulasi buffer Uint8Array.
 * Ditulis manual tanpa dependensi eksternal.
 */

export function bytesToHex(u8) {
  if (!(u8 instanceof Uint8Array)) {
    throw new TypeError('Argumen harus berupa Uint8Array');
  }
  let hex = '';
  for (let i = 0; i < u8.length; i++) {
    hex += u8[i].toString(16).padStart(2, '0');
  }
  return hex.toLowerCase();
}

export function hexToBytes(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Argumen harus berupa string heksadesimal');
  }
  const cleanStr = str.trim();
  if (cleanStr.length % 2 !== 0) {
    throw new TypeError('Panjang string heksadesimal harus genap');
  }
  if (!/^([0-9a-fA-F]{2})*$/.test(cleanStr)) {
    throw new TypeError('String memuat karakter heksadesimal yang tidak valid');
  }
  const len = cleanStr.length / 2;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = parseInt(cleanStr.substr(i * 2, 2), 16);
  }
  return out;
}

export function bytesToBig(u8) {
  if (!(u8 instanceof Uint8Array)) {
    throw new TypeError('Argumen harus berupa Uint8Array');
  }
  if (u8.length === 0) return 0n;
  return BigInt('0x' + bytesToHex(u8));
}

export function bitLength(n) {
  if (typeof n !== 'bigint') {
    throw new TypeError('Argumen harus berupa BigInt');
  }
  if (n < 0n) {
    throw new RangeError('bitLength hanya mendukung bilangan non-negatif');
  }
  if (n === 0n) return 0;
  return n.toString(2).length;
}

export function byteLength(n) {
  const bits = bitLength(n);
  return bits === 0 ? 0 : Math.ceil(bits / 8);
}

export function bigToBytes(n, len) {
  if (typeof n !== 'bigint') {
    throw new TypeError('Argumen n harus berupa BigInt');
  }
  if (n < 0n) {
    throw new RangeError('bigToBytes hanya mendukung bilangan non-negatif');
  }
  const targetLen = len !== undefined ? len : Math.max(1, byteLength(n));
  let hex = n.toString(16);
  if (hex.length % 2 !== 0) {
    hex = '0' + hex;
  }
  const minBytes = hex.length / 2;
  if (minBytes > targetLen) {
    throw new RangeError(`BigInt tidak muat dalam ${targetLen} byte (butuh minimal ${minBytes} byte)`);
  }
  const paddedHex = hex.padStart(targetLen * 2, '0');
  return hexToBytes(paddedHex);
}

export function concat(...arrays) {
  let totalLen = 0;
  for (const arr of arrays) {
    if (!(arr instanceof Uint8Array)) {
      throw new TypeError('Semua elemen harus berupa Uint8Array');
    }
    totalLen += arr.length;
  }
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function equalBytes(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) {
    return false;
  }
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export function utf8Encode(str) {
  if (typeof str !== 'string') {
    throw new TypeError('Argumen harus berupa string');
  }
  return encoder.encode(str);
}

export function utf8Decode(u8) {
  if (!(u8 instanceof Uint8Array)) {
    throw new TypeError('Argumen harus berupa Uint8Array');
  }
  return decoder.decode(u8);
}
