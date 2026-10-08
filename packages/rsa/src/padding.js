/**
 * Modul padding PKCS#1 v1.5 (Tipe 2 untuk enkripsi dan Tipe 1 untuk tanda tangan)
 * serta utilitas pemecahan dan visualisasi blok.
 */

import { concat, bytesToHex } from './bytes.js';
import { randomNonZeroBytes } from './random.js';

export class PaddingError extends Error {
  constructor(message = 'Padding enkripsi/dekripsi tidak valid') {
    super(message);
    this.name = 'PaddingError';
  }
}

/**
 * Padding enkripsi (PKCS#1 v1.5 tipe 2):
 * EM = 0x00 || 0x02 || PS || 0x00 || M
 * PS = byte acak non-nol dengan panjang minimal 8 byte.
 */
export function padEncrypt(msgBytes, k) {
  if (!(msgBytes instanceof Uint8Array)) {
    throw new TypeError('Pesan harus berupa Uint8Array');
  }
  if (k < 12) {
    throw new RangeError('Modulus k minimal 12 byte (96 bit) untuk skema padding enkripsi');
  }
  const maxMsgLen = k - 11;
  if (msgBytes.length > maxMsgLen) {
    throw new RangeError(`Pesan terlalu panjang (${msgBytes.length} byte), maksimal ${maxMsgLen} byte per blok`);
  }

  const psLen = k - 3 - msgBytes.length;
  const ps = randomNonZeroBytes(psLen);

  const header = new Uint8Array([0x00, 0x02]);
  const sep = new Uint8Array([0x00]);

  return concat(header, ps, sep, msgBytes);
}

/**
 * Menghapus padding enkripsi PKCS#1 v1.5 tipe 2.
 */
export function unpadEncrypt(emBytes) {
  if (!(emBytes instanceof Uint8Array)) {
    throw new TypeError('EM harus berupa Uint8Array');
  }
  if (emBytes.length < 11 || emBytes[0] !== 0x00 || emBytes[1] !== 0x02) {
    throw new PaddingError();
  }

  // Cari separator 0x00 mulai indeks 2
  let sepIndex = -1;
  for (let i = 2; i < emBytes.length; i++) {
    if (emBytes[i] === 0x00) {
      sepIndex = i;
      break;
    }
  }

  // Separator harus ada dan PS (antara indeks 2 dan sepIndex) harus minimal 8 byte
  if (sepIndex === -1 || sepIndex < 10) {
    throw new PaddingError();
  }

  return emBytes.subarray(sepIndex + 1);
}

/**
 * Padding tanda tangan digital (PKCS#1 v1.5 tipe 1):
 * EM = 0x00 || 0x01 || PS || 0x00 || Hash
 * PS = byte 0xFF berulang, minimal 8 byte.
 */
export function padSign(hashBytes, k) {
  if (!(hashBytes instanceof Uint8Array)) {
    throw new TypeError('Hash harus berupa Uint8Array');
  }
  if (k < hashBytes.length + 11) {
    throw new RangeError(`Modulus k minimal ${hashBytes.length + 11} byte untuk tanda tangan`);
  }

  const psLen = k - 3 - hashBytes.length;
  const ps = new Uint8Array(psLen).fill(0xff);

  const header = new Uint8Array([0x00, 0x01]);
  const sep = new Uint8Array([0x00]);

  return concat(header, ps, sep, hashBytes);
}

/**
 * Memvalidasi format EM tanda tangan dan mengekstrak hash asli.
 */
export function parseSignEM(emBytes, hashLen = 32) {
  if (!(emBytes instanceof Uint8Array)) {
    return null;
  }
  if (emBytes.length < hashLen + 11) {
    return null;
  }
  if (emBytes[0] !== 0x00 || emBytes[1] !== 0x01) {
    return null;
  }

  let sepIndex = -1;
  for (let i = 2; i < emBytes.length; i++) {
    if (emBytes[i] === 0x00) {
      sepIndex = i;
      break;
    }
    if (emBytes[i] !== 0xff) {
      // PS pada tipe 1 harus seluruhnya 0xFF
      return null;
    }
  }

  if (sepIndex === -1 || sepIndex < 10) {
    return null;
  }

  const extractedHash = emBytes.subarray(sepIndex + 1);
  if (extractedHash.length !== hashLen) {
    return null;
  }

  return extractedHash;
}

/**
 * Memecah data byte menjadi blok-blok dengan ukuran maksimal chunkSize.
 */
export function splitBlocks(bytes, chunkSize) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('Argumen harus berupa Uint8Array');
  }
  if (chunkSize <= 0) {
    throw new RangeError('Ukuran blok harus lebih dari 0');
  }
  if (bytes.length === 0) {
    return [new Uint8Array(0)];
  }

  const blocks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    blocks.push(bytes.subarray(i, Math.min(bytes.length, i + chunkSize)));
  }
  return blocks;
}

/**
 * Mengurai struktur EM menjadi bagian-bagian (header, PS, separator, data)
 * dalam format heksadesimal untuk kebutuhan visualisasi di UI DevTools/Dock.
 */
export function describeEM(emBytes) {
  if (!(emBytes instanceof Uint8Array) || emBytes.length < 3) {
    return null;
  }
  const type = emBytes[1];
  let sepIndex = -1;
  for (let i = 2; i < emBytes.length; i++) {
    if (emBytes[i] === 0x00) {
      sepIndex = i;
      break;
    }
  }

  if (sepIndex === -1) {
    return {
      header: bytesToHex(emBytes.subarray(0, 2)),
      ps: bytesToHex(emBytes.subarray(2)),
      sep: '',
      data: ''
    };
  }

  return {
    type: type === 0x02 ? 'ENCRYPT (Tipe 2)' : (type === 0x01 ? 'SIGN (Tipe 1)' : 'UNKNOWN'),
    header: bytesToHex(emBytes.subarray(0, 2)),
    ps: bytesToHex(emBytes.subarray(2, sepIndex)),
    sep: bytesToHex(emBytes.subarray(sepIndex, sepIndex + 1)),
    data: bytesToHex(emBytes.subarray(sepIndex + 1))
  };
}
