/**
 * Implementasi manual SHA-256 (FIPS 180-4).
 * Ditulis murni dalam JavaScript tanpa modul eksternal.
 */

import { bytesToHex } from './bytes.js';

// Konstanta 64 kata putaran (K)
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function rotr(x, n) {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

function ch(x, y, z) {
  return ((x & y) ^ (~x & z)) >>> 0;
}

function maj(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z)) >>> 0;
}

function sigma0(x) {
  return (rotr(x, 2) ^ rotr(x, 13) ^ rotr(x, 22)) >>> 0;
}

function sigma1(x) {
  return (rotr(x, 6) ^ rotr(x, 11) ^ rotr(x, 25)) >>> 0;
}

function gamma0(x) {
  return (rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3)) >>> 0;
}

function gamma1(x) {
  return (rotr(x, 17) ^ rotr(x, 19) ^ (x >>> 10)) >>> 0;
}

export function sha256(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError('Argumen harus berupa Uint8Array');
  }

  // 1. Padding pesan
  const byteLen = bytes.length;
  const bitLen = BigInt(byteLen) * 8n;

  // Panjang baru harus kelipatan 64 byte (512 bit)
  // Pesan asli + 1 byte (0x80) + k byte nol + 8 byte panjang (64-bit)
  const remainder = (byteLen + 1 + 8) % 64;
  const paddingZeroes = remainder === 0 ? 0 : 64 - remainder;
  const totalLen = byteLen + 1 + paddingZeroes + 8;

  const padded = new Uint8Array(totalLen);
  padded.set(bytes, 0);
  padded[byteLen] = 0x80;

  // Tulis panjang pesan 64-bit big endian di akhir
  const highBits = Number(bitLen >> 32n) >>> 0;
  const lowBits = Number(bitLen & 0xffffffffn) >>> 0;

  const view = new DataView(padded.buffer, padded.byteOffset, padded.byteLength);
  view.setUint32(totalLen - 8, highBits, false);
  view.setUint32(totalLen - 4, lowBits, false);

  // 2. Inisialisasi nilai hash (H)
  let h0 = 0x6a09e667 >>> 0;
  let h1 = 0xbb67ae85 >>> 0;
  let h2 = 0x3c6ef372 >>> 0;
  let h3 = 0xa54ff53a >>> 0;
  let h4 = 0x510e527f >>> 0;
  let h5 = 0x9b05688c >>> 0;
  let h6 = 0x1f83d9ab >>> 0;
  let h7 = 0x5be0cd19 >>> 0;

  const W = new Uint32Array(64);

  // 3. Proses blok 512-bit (64 byte)
  for (let offset = 0; offset < totalLen; offset += 64) {
    // Siapkan message schedule W
    for (let t = 0; t < 16; t++) {
      W[t] = view.getUint32(offset + t * 4, false);
    }
    for (let t = 16; t < 64; t++) {
      const s0 = gamma0(W[t - 15]);
      const s1 = gamma1(W[t - 2]);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }

    // Inisialisasi variabel kerja
    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    // 64 ronde kompresi
    for (let t = 0; t < 64; t++) {
      const T1 = (h + sigma1(e) + ch(e, f, g) + K[t] + W[t]) >>> 0;
      const T2 = (sigma0(a) + maj(a, b, c)) >>> 0;
      h = g;
      g = f;
      f = e;
      e = (d + T1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (T1 + T2) >>> 0;
    }

    // Tambahkan ke hash state
    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  // 4. Susun output 32-byte (256-bit)
  const result = new Uint8Array(32);
  const outView = new DataView(result.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);

  return result;
}

export function sha256Hex(bytes) {
  return bytesToHex(sha256(bytes));
}
