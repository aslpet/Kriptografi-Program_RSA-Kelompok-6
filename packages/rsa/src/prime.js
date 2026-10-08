/**
 * Modul uji primalitas dan pembangkitan bilangan prima.
 * Mengimplementasikan Uji Miller-Rabin murni dan saringan prima kecil.
 */

import { randomBigInt, randomRange } from './random.js';
import { modPow } from './math.js';

// Saringan Eratosthenes untuk mengumpulkan prima kecil <= 1000
function sievePrimes(max) {
  const isPrime = new Uint8Array(max + 1).fill(1);
  isPrime[0] = isPrime[1] = 0;
  for (let p = 2; p * p <= max; p++) {
    if (isPrime[p]) {
      for (let i = p * p; i <= max; i += p) {
        isPrime[i] = 0;
      }
    }
  }
  const primes = [];
  for (let i = 2; i <= max; i++) {
    if (isPrime[i]) primes.push(BigInt(i));
  }
  return primes;
}

export const SMALL_PRIMES = sievePrimes(1000);

/**
 * Uji Miller-Rabin murni.
 * Diekspor terpisah agar dapat diuji secara independen (termasuk pada bilangan Carmichael).
 */
export function millerRabin(n, rounds = 20) {
  if (typeof n !== 'bigint') {
    throw new TypeError('Argumen n harus berupa BigInt');
  }
  if (n < 2n) return false;
  if (n === 2n || n === 3n) return true;
  if ((n & 1n) === 0n) return false;

  // Faktorkan n - 1 menjadi d * 2^s dengan d ganjil
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }

  witnessLoop: for (let i = 0; i < rounds; i++) {
    // Pilih basis acak a dalam rentang [2, n - 2]
    const a = randomRange(2n, n - 2n);
    let x = modPow(a, d, n);

    if (x === 1n || x === n - 1n) {
      continue witnessLoop;
    }

    for (let r = 1; r < s; r++) {
      x = (x * x) % n;
      if (x === n - 1n) {
        continue witnessLoop;
      }
    }

    // Pasti komposit
    return false;
  }

  // Kemungkinan besar prima (peluang kesalahan <= 4^-rounds)
  return true;
}

export function isProbablePrime(n, rounds = 20) {
  if (typeof n !== 'bigint') {
    throw new TypeError('Argumen n harus berupa BigInt');
  }
  if (n < 2n) return false;

  // Cek cepat pembagian dengan prima kecil
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }

  return millerRabin(n, rounds);
}

export function generatePrime(bits, { onCandidate } = {}) {
  if (typeof bits !== 'number' || !Number.isInteger(bits) || bits < 8) {
    throw new RangeError('Jumlah bit prima harus bilangan bulat minimal 8');
  }

  let tries = 0;
  const topBit = 1n << BigInt(bits - 1);
  const secondTopBit = 1n << BigInt(bits - 2);

  while (true) {
    let candidate = randomBigInt(bits);
    // Pastikan 2 bit teratas = 1 dan bit terendah = 1 (ganjil)
    // Dua bit teratas 1 menjamin perkalian p * q (masing-masing bits/2) menghasilkan tepat bits
    candidate |= topBit | secondTopBit | 1n;

    tries++;
    if (onCandidate) {
      onCandidate(tries);
    }

    if (isProbablePrime(candidate)) {
      return {
        prime: candidate,
        candidates: tries
      };
    }
  }
}

export function assertPrime(n) {
  if (typeof n !== 'bigint') {
    throw new TypeError('Argumen n harus berupa BigInt');
  }
  if (n < 2n) {
    throw new Error(`${n} bukan bilangan prima (kurang dari 2)`);
  }

  // Untuk bilangan kecil (muat di 32-bit), lakukan trial division deterministik
  if (n <= 4294967296n) {
    if (n === 2n) return true;
    if ((n & 1n) === 0n) throw new Error(`${n} bukan bilangan prima (bilangan genap)`);
    for (let i = 3n; i * i <= n; i += 2n) {
      if (n % i === 0n) {
        throw new Error(`${n} bukan bilangan prima (habis dibagi ${i})`);
      }
    }
    return true;
  }

  if (!isProbablePrime(n, 30)) {
    throw new Error(`${n} bukan bilangan prima`);
  }
  return true;
}
