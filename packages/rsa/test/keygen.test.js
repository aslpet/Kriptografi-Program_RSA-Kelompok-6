import { describe, it, expect } from 'vitest';
import { generateKeyPair, buildKeyPairFrom } from '../src/keygen.js';
import { bitLength } from '../src/bytes.js';

describe('keygen.js', () => {
  it('generateKeyPair(512) menghasilkan kunci 512-bit yang valid dan lolos self-test', () => {
    const steps = [];
    const key = generateKeyPair(512, {
      onStep: (stepInfo) => {
        steps.push(stepInfo.step);
        // Pastikan values dapat di-JSON.stringify (tidak ada BigInt telanjang)
        expect(() => JSON.stringify(stepInfo.values)).not.toThrow();
      }
    });

    expect(key.bits).toBe(512);
    expect(bitLength(key.n)).toBe(512);
    expect(key.p).not.toBe(key.q);
    expect((key.e * key.d) % key.phi).toBe(1n);

    // Pastikan seluruh 7 langkah onStep terekam
    expect(steps).toContain('gen-p');
    expect(steps).toContain('gen-q');
    expect(steps).toContain('n');
    expect(steps).toContain('phi');
    expect(steps).toContain('e');
    expect(steps).toContain('d');
    expect(steps).toContain('test');
  });

  it('buildKeyPairFrom membangun kunci dari p=61, q=53, e=17 sesuai buku teks', () => {
    const key = buildKeyPairFrom(61n, 53n, 17n);
    expect(key.n).toBe(3233n);
    expect(key.phi).toBe(3120n);
    expect(key.e).toBe(17n);
    expect(key.d).toBe(2753n);
    expect(Array.isArray(key.egcdTrace)).toBe(true);
  });

  it('generateKeyPair menolak bits ganjil atau kurang dari 16', () => {
    expect(() => generateKeyPair(511)).toThrow(RangeError);
    expect(() => generateKeyPair(14)).toThrow(RangeError);
    expect(() => generateKeyPair('512')).toThrow(RangeError);
  });

  it('buildKeyPairFrom menolak bilangan komposit atau p === q', () => {
    expect(() => buildKeyPairFrom(60n, 53n, 17n)).toThrow(); // 60 bukan prima
    expect(() => buildKeyPairFrom(61n, 61n, 17n)).toThrow(); // p === q
    expect(() => buildKeyPairFrom(61n, 53n, 2n)).toThrow(); // gcd(2, 3120) != 1
  });
});
