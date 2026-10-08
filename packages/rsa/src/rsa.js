/**
 * Modul inti operasi RSA: Enkripsi, Dekripsi, Tanda Tangan, dan Verifikasi.
 * Mendukung mode ber-padding (PKCS#1 v1.5) serta mode edukasi buku teks (Textbook).
 */

import {
  bytesToHex,
  hexToBytes,
  bytesToBig,
  bigToBytes,
  byteLength,
  concat,
  equalBytes,
  utf8Encode,
  utf8Decode
} from './bytes.js';
import { modPow } from './math.js';
import { padEncrypt, unpadEncrypt, padSign, parseSignEM, splitBlocks, describeEM, PaddingError } from './padding.js';
import { sha256 } from './sha256.js';

export function encryptRaw(m, pub) {
  if (typeof m !== 'bigint' || typeof pub?.n !== 'bigint' || typeof pub?.e !== 'bigint') {
    throw new TypeError('Pesan m dan kunci publik (n, e) harus berupa BigInt');
  }
  if (m < 0n || m >= pub.n) {
    throw new RangeError('Pesan integer m harus berada dalam rentang 0 <= m < n');
  }
  return modPow(m, pub.e, pub.n);
}

export function decryptRaw(c, priv) {
  if (typeof c !== 'bigint' || typeof priv?.n !== 'bigint' || typeof priv?.d !== 'bigint') {
    throw new TypeError('Ciphertext c dan kunci privat (n, d) harus berupa BigInt');
  }
  if (c < 0n || c >= priv.n) {
    throw new RangeError('Ciphertext integer c harus berada dalam rentang 0 <= c < n');
  }
  return modPow(c, priv.d, priv.n);
}

/**
 * Enkripsi teks ber-padding (PKCS#1 v1.5).
 * Menghasilkan array string heksadesimal dengan lebar tetap 2*k per blok.
 */
export function encryptText(text, pub, { onStep } = {}) {
  if (typeof text !== 'string') {
    throw new TypeError('Teks yang dienkripsi harus berupa string');
  }
  const k = byteLength(pub.n);
  if (k < 12) {
    throw new RangeError('Ukuran modulus minimal 96 bit (12 byte) untuk skema enkripsi dengan padding');
  }

  const rawBytes = utf8Encode(text);
  const maxBlockPayload = k - 11;
  const chunks = splitBlocks(rawBytes, maxBlockPayload);
  const blocks = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const em = padEncrypt(chunk, k);
    const m = bytesToBig(em);
    const c = encryptRaw(m, pub);
    const hexBlock = bytesToHex(bigToBytes(c, k));

    if (onStep) {
      onStep({
        step: 'encrypt-block',
        blockIndex: i + 1,
        totalBlocks: chunks.length,
        emHex: bytesToHex(em),
        emDesc: describeEM(em),
        mDec: m.toString(),
        cHex: hexBlock
      });
    }

    blocks.push(hexBlock);
  }

  return blocks;
}

/**
 * Dekripsi array blok heksadesimal ke teks asli.
 */
export function decryptText(blocks, priv, { onStep } = {}) {
  if (!Array.isArray(blocks)) {
    throw new TypeError('Argumen blocks harus berupa array string heksadesimal');
  }
  const k = byteLength(priv.n);
  const decryptedChunks = [];

  for (let i = 0; i < blocks.length; i++) {
    const hexBlock = blocks[i];
    if (typeof hexBlock !== 'string' || hexBlock.length !== 2 * k) {
      throw new PaddingError('Panjang blok ciphertext heksadesimal tidak sesuai ukuran modulus');
    }

    const blockBytes = hexToBytes(hexBlock);
    const c = bytesToBig(blockBytes);
    if (c >= priv.n) {
      throw new PaddingError('Nilai integer blok ciphertext melampaui modulus n');
    }

    const m = decryptRaw(c, priv);
    const em = bigToBytes(m, k);
    const chunk = unpadEncrypt(em);

    if (onStep) {
      onStep({
        step: 'decrypt-block',
        blockIndex: i + 1,
        totalBlocks: blocks.length,
        cHex: hexBlock,
        mHex: bytesToHex(em),
        chunkBytes: chunk.length
      });
    }

    decryptedChunks.push(chunk);
  }

  const combined = concat(...decryptedChunks);
  return utf8Decode(combined);
}

/**
 * Mode edukasi Textbook RSA (tanpa padding).
 * Mengenkripsi per code-point karakter.
 */
export function encryptTextbook(text, pub) {
  if (typeof text !== 'string') throw new TypeError('Teks harus berupa string');
  const result = [];
  for (const char of text) {
    const cp = BigInt(char.codePointAt(0));
    if (cp >= pub.n) {
      throw new RangeError(
        `Modulus n (${pub.n}) harus lebih besar dari code-point karakter terbesar ('${char}' = ${cp})`
      );
    }
    const c = encryptRaw(cp, pub);
    result.push(c.toString());
  }
  return result;
}

export function decryptTextbook(cipherArr, priv) {
  if (!Array.isArray(cipherArr)) throw new TypeError('cipherArr harus berupa array angka');
  let result = '';
  for (const item of cipherArr) {
    const c = BigInt(item);
    if (c >= priv.n) {
      throw new RangeError('Nilai ciphertext melebihi modulus n');
    }
    const m = decryptRaw(c, priv);
    result += String.fromCodePoint(Number(m));
  }
  return result;
}

/**
 * Membuat tanda tangan digital (hash SHA-256 lalu enkripsi dengan kunci privat).
 * Mengembalikan string heksadesimal tanda tangan.
 */
export function signText(text, priv, { onStep } = {}) {
  if (typeof text !== 'string') {
    throw new TypeError('Teks harus berupa string');
  }
  const k = byteLength(priv.n);
  if (k < 43) {
    throw new RangeError('Ukuran modulus minimal 344 bit (43 byte) untuk tanda tangan SHA-256');
  }

  const hashBytes = sha256(utf8Encode(text));
  const em = padSign(hashBytes, k);
  const m = bytesToBig(em);
  const s = decryptRaw(m, priv); // s = em^d mod n
  const sigHex = bytesToHex(bigToBytes(s, k));

  if (onStep) {
    onStep({
      step: 'sign',
      hashHex: bytesToHex(hashBytes),
      emHex: bytesToHex(em),
      signatureHex: sigHex
    });
  }

  return sigHex;
}

/**
 * Memverifikasi tanda tangan digital di peramban / klien.
 * Mengembalikan objek status verifikasi dan kedua nilai hash untuk perbandingan berdampingan.
 */
export function verifyText(text, sigHex, pub, { onStep } = {}) {
  if (typeof text !== 'string') {
    throw new TypeError('Teks harus berupa string');
  }
  const k = byteLength(pub.n);
  const hashComputed = sha256(utf8Encode(text));
  const hashComputedHex = bytesToHex(hashComputed);

  if (typeof sigHex !== 'string' || sigHex.length !== 2 * k) {
    return {
      valid: false,
      hashComputed: hashComputedHex,
      hashFromSignature: null
    };
  }

  let s;
  try {
    s = bytesToBig(hexToBytes(sigHex));
  } catch {
    return {
      valid: false,
      hashComputed: hashComputedHex,
      hashFromSignature: null
    };
  }

  if (s >= pub.n) {
    return {
      valid: false,
      hashComputed: hashComputedHex,
      hashFromSignature: null
    };
  }

  const emVal = encryptRaw(s, pub); // em = s^e mod n
  const em = bigToBytes(emVal, k);
  const extractedHash = parseSignEM(em, 32);

  if (!extractedHash) {
    if (onStep) {
      onStep({
        step: 'verify',
        valid: false,
        error: 'Format padding EM tanda tangan tidak sesuai'
      });
    }
    return {
      valid: false,
      hashComputed: hashComputedHex,
      hashFromSignature: null
    };
  }

  const hashFromSigHex = bytesToHex(extractedHash);
  const isValid = equalBytes(hashComputed, extractedHash);

  if (onStep) {
    onStep({
      step: 'verify',
      valid: isValid,
      hashComputed: hashComputedHex,
      hashFromSignature: hashFromSigHex
    });
  }

  return {
    valid: isValid,
    hashComputed: hashComputedHex,
    hashFromSignature: hashFromSigHex
  };
}
