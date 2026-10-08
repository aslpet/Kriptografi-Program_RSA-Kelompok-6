import { describe, it, expect } from 'vitest';
import { SMALL_PRIMES, millerRabin, isProbablePrime, generatePrime, assertPrime } from '../src/prime.js';
import { bitLength } from '../src/bytes.js';

describe('prime.js', () => {
  it('SMALL_PRIMES berisi tepat 168 bilangan prima di bawah 1000', () => {
    expect(SMALL_PRIMES.length).toBe(168);
    expect(SMALL_PRIMES[0]).toBe(2n);
    expect(SMALL_PRIMES[1]).toBe(3n);
    expect(SMALL_PRIMES[SMALL_PRIMES.length - 1]).toBe(997n);
  });

  it('millerRabin MENOLAK bilangan Carmichael (pseudoprime)', () => {
    // Bilangan Carmichael yang lolos uji Fermat tetapi harus ditolak Miller-Rabin
    const carmichaelNumbers = [561n, 1105n, 1729n, 2465n, 2821n];
    for (const cn of carmichaelNumbers) {
      expect(millerRabin(cn, 25)).toBe(false);
    }
  });

  it('millerRabin MENERIMA prima Mersenne dan prima besar yang dikenal', () => {
    // 2^13 - 1 = 8191 (Mersenne)
    expect(millerRabin(8191n)).toBe(true);

    // 2^89 - 1 (prima Mersenne 89-bit)
    const m89 = (1n << 89n) - 1n;
    expect(millerRabin(m89, 20)).toBe(true);

    // 2^127 - 1 (prima Mersenne 127-bit)
    const m127 = (1n << 127n) - 1n;
    expect(millerRabin(m127, 20)).toBe(true);
  });

  it('isProbablePrime memverifikasi bilangan prima dan komposit kecil', () => {
    expect(isProbablePrime(2n)).toBe(true);
    expect(isProbablePrime(3n)).toBe(true);
    expect(isProbablePrime(61n)).toBe(true);
    expect(isProbablePrime(53n)).toBe(true);

    // Komposit
    expect(isProbablePrime(1n)).toBe(false);
    expect(isProbablePrime(4n)).toBe(false);
    expect(isProbablePrime(100n)).toBe(false);
    expect(isProbablePrime(3233n)).toBe(false); // 61 * 53
  });

  it('generatePrime membangkitkan prima dengan panjang bit tepat dan 2 bit teratas = 1', () => {
    for (const bits of [16, 32, 64, 128]) {
      const { prime, candidates } = generatePrime(bits);
      expect(candidates).toBeGreaterThanOrEqual(1);
      expect(bitLength(prime)).toBe(bits);

      // Cek 2 bit teratas bernilai 1
      const topBit = 1n << BigInt(bits - 1);
      const secondTopBit = 1n << BigInt(bits - 2);
      expect((prime & topBit) !== 0n).toBe(true);
      expect((prime & secondTopBit) !== 0n).toBe(true);

      // Cek ganjil
      expect((prime & 1n)).toBe(1n);

      // Cek prima
      expect(isProbablePrime(prime)).toBe(true);
    }
  });

  it('assertPrime memverifikasi atau melempar error bila bukan prima', () => {
    expect(assertPrime(61n)).toBe(true);
    expect(() => assertPrime(60n)).toThrow();
    expect(() => assertPrime(561n)).toThrow();
  });
});
