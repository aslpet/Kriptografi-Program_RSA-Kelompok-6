/**
 * Modul serialisasi dan deserialisasi kunci RSA (publik dan privat)
 * ke/dari format JSON / Hex string, serta pembuatan fingerprint kunci.
 */

import { bytesToHex, hexToBytes, bytesToBig, bigToBytes, byteLength, utf8Encode } from './bytes.js';
import { sha256Hex } from './sha256.js';

export function serializePublicKey(key) {
  if (!key || typeof key.n !== 'bigint' || typeof key.e !== 'bigint') {
    throw new TypeError('Kunci publik tidak valid untuk serialisasi');
  }
  const k = byteLength(key.n);
  return {
    bits: Number(key.bits || (k * 8)),
    e: key.e.toString(16).toLowerCase(),
    n: bytesToHex(bigToBytes(key.n, k))
  };
}

export function parsePublicKey(obj) {
  if (!obj || typeof obj.n !== 'string' || typeof obj.e !== 'string') {
    throw new TypeError('Objek kunci publik harus memuat string n dan e dalam format heksadesimal');
  }
  return {
    bits: Number(obj.bits || (hexToBytes(obj.n).length * 8)),
    e: BigInt('0x' + obj.e),
    n: bytesToBig(hexToBytes(obj.n))
  };
}

export function serializePrivateKey(key) {
  if (!key || typeof key.n !== 'bigint' || typeof key.d !== 'bigint') {
    throw new TypeError('Kunci privat tidak valid untuk serialisasi');
  }
  const k = byteLength(key.n);
  const halfK = key.bits ? Math.ceil(key.bits / 16) : Math.ceil(k / 2);

  return {
    bits: Number(key.bits || (k * 8)),
    p: key.p ? bytesToHex(bigToBytes(key.p, halfK)) : undefined,
    q: key.q ? bytesToHex(bigToBytes(key.q, halfK)) : undefined,
    n: bytesToHex(bigToBytes(key.n, k)),
    phi: key.phi ? bytesToHex(bigToBytes(key.phi, k)) : undefined,
    e: key.e ? key.e.toString(16).toLowerCase() : undefined,
    d: bytesToHex(bigToBytes(key.d, k))
  };
}

export function parsePrivateKey(obj) {
  if (!obj || typeof obj.n !== 'string' || typeof obj.d !== 'string') {
    throw new TypeError('Objek kunci privat harus memuat string n dan d dalam format heksadesimal');
  }
  return {
    bits: Number(obj.bits || (hexToBytes(obj.n).length * 8)),
    p: obj.p ? bytesToBig(hexToBytes(obj.p)) : undefined,
    q: obj.q ? bytesToBig(hexToBytes(obj.q)) : undefined,
    n: bytesToBig(hexToBytes(obj.n)),
    phi: obj.phi ? bytesToBig(hexToBytes(obj.phi)) : undefined,
    e: obj.e ? BigInt('0x' + obj.e) : undefined,
    d: bytesToBig(hexToBytes(obj.d))
  };
}

/**
 * Menghasilkan fingerprint kunci publik: 16 karakter heksadesimal pertama dari SHA-256(n).
 */
export function fingerprint(pub) {
  if (!pub) throw new TypeError('Kunci publik tidak boleh kosong');
  let nHex;
  if (typeof pub === 'string') {
    nHex = pub.toLowerCase();
  } else if (typeof pub.n === 'string') {
    nHex = pub.n.toLowerCase();
  } else if (typeof pub.n === 'bigint') {
    nHex = bytesToHex(bigToBytes(pub.n, byteLength(pub.n)));
  } else {
    throw new TypeError('Format kunci publik untuk fingerprint tidak dikenal');
  }
  return sha256Hex(utf8Encode(nHex)).slice(0, 16);
}
