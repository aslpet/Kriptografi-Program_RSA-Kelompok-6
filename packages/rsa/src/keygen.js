/**
 * Modul pembangkit pasangan kunci RSA (kunci publik dan privat).
 * Mendukung callback langkah (onStep) untuk visualisasi UI dan mode edukasi.
 */

import { bitLength, byteLength, bigToBytes, bytesToHex } from './bytes.js';
import { randomRange } from './random.js';
import { gcd, modInv, modPow, egcdTrace } from './math.js';
import { generatePrime, assertPrime } from './prime.js';

export function generateKeyPair(bits, { e = 65537n, onStep } = {}) {
  if (typeof bits !== 'number' || !Number.isInteger(bits) || bits < 16 || bits % 2 !== 0) {
    throw new RangeError('Jumlah bit kunci harus bilangan bulat genap dan minimal 16');
  }

  const halfBits = bits / 2;
  const halfBytes = Math.ceil(halfBits / 8);

  while (true) {
    // 1. Bangkitkan p
    const t0 = Date.now();
    const pResult = generatePrime(halfBits);
    const p = pResult.prime;
    const msP = Date.now() - t0;
    if (onStep) {
      onStep({
        step: 'gen-p',
        title: `Bangkitkan prima p (${halfBits} bit)`,
        values: {
          candidates: pResult.candidates,
          bitLength: bitLength(p),
          hex: bytesToHex(bigToBytes(p, halfBytes))
        },
        ms: msP
      });
    }

    // 2. Bangkitkan q (pastikan q ≠ p)
    const t1 = Date.now();
    let qResult;
    let q;
    do {
      qResult = generatePrime(halfBits);
      q = qResult.prime;
    } while (q === p);
    const msQ = Date.now() - t1;
    if (onStep) {
      onStep({
        step: 'gen-q',
        title: `Bangkitkan prima q (${halfBits} bit)`,
        values: {
          candidates: qResult.candidates,
          bitLength: bitLength(q),
          hex: bytesToHex(bigToBytes(q, halfBytes))
        },
        ms: msQ
      });
    }

    // 3. Hitung n = p * q
    const t2 = Date.now();
    const n = p * q;
    const nBits = bitLength(n);
    if (nBits !== bits) {
      // Sangat jarang terjadi karena 2 bit teratas diset 1, namun jika berbeda, ulang
      continue;
    }
    const msN = Date.now() - t2;
    if (onStep) {
      onStep({
        step: 'n',
        title: `Hitung modulus n = p × q (${bits} bit)`,
        values: {
          bitLength: nBits,
          hex: bytesToHex(bigToBytes(n, Math.ceil(bits / 8)))
        },
        ms: msN
      });
    }

    // 4. Hitung totient Euler φ(n) = (p - 1)(q - 1)
    const t3 = Date.now();
    const phi = (p - 1n) * (q - 1n);
    const msPhi = Date.now() - t3;
    if (onStep) {
      onStep({
        step: 'phi',
        title: 'Hitung totient Euler φ(n) = (p - 1) × (q - 1)',
        values: {
          bitLength: bitLength(phi),
          hex: bytesToHex(bigToBytes(phi, Math.ceil(bits / 8)))
        },
        ms: msPhi
      });
    }

    // 5. Periksa eksponen publik e dan gcd(e, φ) = 1
    const t4 = Date.now();
    const g = gcd(e, phi);
    const msE = Date.now() - t4;
    if (g !== 1n) {
      // gcd(e, phi) != 1, coba pasang p dan q baru
      continue;
    }
    if (onStep) {
      onStep({
        step: 'e',
        title: 'Tetapkan eksponen publik e dan verifikasi gcd(e, φ) = 1',
        values: {
          eHex: e.toString(16),
          eDec: e.toString(),
          gcd: g.toString()
        },
        ms: msE
      });
    }

    // 6. Hitung eksponen privat d = e⁻¹ mod φ
    const t5 = Date.now();
    const d = modInv(e, phi);
    const msD = Date.now() - t5;
    if (onStep) {
      onStep({
        step: 'd',
        title: 'Hitung eksponen privat d = e⁻¹ mod φ(n) (Extended Euclid)',
        values: {
          bitLength: bitLength(d),
          dHex: bytesToHex(bigToBytes(d, Math.ceil(bits / 8)))
        },
        ms: msD
      });
    }

    // 7. Self-test enkripsi dan dekripsi
    const t6 = Date.now();
    const testM = randomRange(2n, n - 2n);
    const testC = modPow(testM, e, n);
    const testDecrypted = modPow(testC, d, n);
    const msTest = Date.now() - t6;

    if (testDecrypted !== testM) {
      throw new Error('Self-test verifikasi kunci RSA gagal! Dekripsi tidak menghasilkan pesan awal.');
    }

    if (onStep) {
      onStep({
        step: 'test',
        title: 'Self-test verifikasi: c = m^e mod n, lalu c^d mod n = m',
        values: {
          status: 'SUCCESS',
          testPassed: true
        },
        ms: msTest
      });
    }

    return { n, e, d, p, q, phi, bits };
  }
}

/**
 * Membangun pasangan kunci RSA dari p, q, e yang dimasukkan sendiri (mode edukasi bilangan kecil).
 */
export function buildKeyPairFrom(p, q, e = 65537n, { onStep } = {}) {
  if (typeof p !== 'bigint' || typeof q !== 'bigint' || typeof e !== 'bigint') {
    throw new TypeError('Parameter p, q, dan e harus berupa BigInt');
  }

  assertPrime(p);
  assertPrime(q);

  if (p === q) {
    throw new Error('Bilangan prima p dan q tidak boleh sama');
  }

  const n = p * q;
  const phi = (p - 1n) * (q - 1n);

  if (e <= 1n || e >= phi) {
    throw new RangeError(`Eksponen publik e harus berada pada rentang 1 < e < φ(n) (φ = ${phi})`);
  }

  const g = gcd(e, phi);
  if (g !== 1n) {
    throw new Error(`gcd(e, φ(n)) = ${g} ≠ 1; e dan φ(n) tidak relatif prima`);
  }

  const d = modInv(e, phi);

  // Self-test dengan m acak
  const testM = n > 3n ? randomRange(2n, n - 1n) : 1n;
  const testC = modPow(testM, e, n);
  const testDec = modPow(testC, d, n);
  if (testDec !== testM) {
    throw new Error('Self-test verifikasi manual gagal');
  }

  let trace = [];
  if (phi <= 4294967296n) {
    trace = egcdTrace(e, phi).trace;
  }

  if (onStep) {
    onStep({
      step: 'edu-summary',
      title: 'Pembuatan Kunci Berhasil',
      values: {
        p: p.toString(),
        q: q.toString(),
        n: n.toString(),
        phi: phi.toString(),
        e: e.toString(),
        d: d.toString(),
        egcdTrace: trace
      },
      ms: 0
    });
  }

  return {
    n,
    e,
    d,
    p,
    q,
    phi,
    bits: bitLength(n),
    egcdTrace: trace
  };
}
