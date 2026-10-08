import { describe, it, expect } from 'vitest';
import { randomBytes, randomBigInt, randomRange, randomNonZeroBytes } from '../src/random.js';
import { bitLength } from '../src/bytes.js';

describe('random.js', () => {
  it('randomBytes menghasilkan byte acak dengan panjang yang tepat', () => {
    const b0 = randomBytes(0);
    expect(b0.length).toBe(0);

    const b32 = randomBytes(32);
    expect(b32.length).toBe(32);

    // Memastikan tidak semua byte 0
    let nonZero = false;
    for (const b of b32) {
      if (b !== 0) nonZero = true;
    }
    expect(nonZero).toBe(true);
  });

  it('randomBigInt menghasilkan bilangan dengan jumlah bit maksimum yang tepat', () => {
    for (const bits of [8, 16, 64, 128]) {
      const n = randomBigInt(bits);
      expect(n >= 0n).toBe(true);
      expect(bitLength(n)).toBeLessThanOrEqual(bits);
    }
  });

  it('randomRange menghasilkan bilangan selalu dalam rentang [min, max] tanpa bias', () => {
    const min = 2n;
    const max = 3n;
    let count2 = 0;
    let count3 = 0;

    for (let i = 0; i < 2000; i++) {
      const val = randomRange(min, max);
      expect(val >= min && val <= max).toBe(true);
      if (val === 2n) count2++;
      if (val === 3n) count3++;
    }

    // Keduanya harus muncul secara signifikan
    expect(count2).toBeGreaterThan(600);
    expect(count3).toBeGreaterThan(600);
  });

  it('randomNonZeroBytes tidak pernah memuat byte bernilai 0x00', () => {
    const bytes = randomNonZeroBytes(500);
    expect(bytes.length).toBe(500);
    for (let i = 0; i < bytes.length; i++) {
      expect(bytes[i]).not.toBe(0);
    }
  });

  it('menolak input batas acak yang tidak valid', () => {
    expect(() => randomRange(10n, 5n)).toThrow(RangeError);
    expect(() => randomBytes(-1)).toThrow(RangeError);
  });
});
