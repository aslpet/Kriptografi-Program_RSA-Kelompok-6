import { describe, it, expect } from 'vitest';
import { gcd, egcd, modInv, modPow, egcdTrace, modPowTrace } from '../src/math.js';

describe('math.js', () => {
  it('gcd menghitung pembagi bersama terbesar', () => {
    expect(gcd(54n, 24n)).toBe(6n);
    expect(gcd(17n, 3120n)).toBe(1n);
    expect(gcd(0n, 10n)).toBe(10n);
    expect(gcd(10n, 0n)).toBe(10n);
  });

  it('egcd memenuhi identitas Bézout: a*x + b*y = g', () => {
    const pairs = [
      [17n, 3120n],
      [240n, 46n],
      [1234567n, 7654321n]
    ];
    for (const [a, b] of pairs) {
      const { g, x, y } = egcd(a, b);
      expect(a * x + b * y).toBe(g);
      expect(g).toBe(gcd(a, b));
    }
  });

  it('modInv menghitung invers perkalian modular', () => {
    // Kasus acuan plan.md: 17^-1 mod 3120 = 2753
    expect(modInv(17n, 3120n)).toBe(2753n);
    expect((17n * 2753n) % 3120n).toBe(1n);

    // Kasus acuan kecil lain: 3^-1 mod 7 = 5
    expect(modInv(3n, 7n)).toBe(5n);

    // Melempar error bila tidak koprima (gcd != 1)
    expect(() => modInv(6n, 9n)).toThrow();
  });

  it('modPow menghitung (base^exp) mod modulus dengan benar', () => {
    // Kasus acuan textbook plan.md: 65^17 mod 3233 = 2790
    expect(modPow(65n, 17n, 3233n)).toBe(2790n);
    // Dekripsi: 2790^2753 mod 3233 = 65
    expect(modPow(2790n, 2753n, 3233n)).toBe(65n);

    // Kasus batas
    expect(modPow(123n, 0n, 100n)).toBe(1n);
    expect(modPow(123n, 456n, 1n)).toBe(0n);
    expect(modPow(0n, 5n, 13n)).toBe(0n);
    expect(modPow(15n, 2n, 7n)).toBe(modPow(1n, 2n, 7n)); // base > mod
    expect(modPow(-2n, 3n, 5n)).toBe(2n); // basis negatif dinormalkan
  });

  it('egcdTrace menghasilkan tabel jejak langkah Bézout', () => {
    const { g, x, y, trace } = egcdTrace(17n, 3120n);
    expect(g).toBe(1n);
    expect(17n * x + 3120n * y).toBe(g);
    expect(Array.isArray(trace)).toBe(true);
    expect(trace.length).toBeGreaterThan(2);
  });

  it('modPowTrace menghasilkan langkah perkalian dan pengkuadratan', () => {
    const { result, steps } = modPowTrace(3n, 5n, 7n);
    expect(result).toBe(modPow(3n, 5n, 7n));
    expect(steps.length).toBe(3); // 5 = 101 dalam biner (3 bit)
  });
});
