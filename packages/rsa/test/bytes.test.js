import { describe, it, expect } from 'vitest';
import {
  bytesToHex,
  hexToBytes,
  bytesToBig,
  bigToBytes,
  bitLength,
  byteLength,
  concat,
  equalBytes,
  utf8Encode,
  utf8Decode
} from '../src/bytes.js';

describe('bytes.js', () => {
  it('konversi bytes <-> hex', () => {
    const raw = new Uint8Array([0x00, 0x0f, 0xa5, 0xff]);
    const hex = bytesToHex(raw);
    expect(hex).toBe('000fa5ff');
    expect(hexToBytes(hex)).toEqual(raw);
    expect(bytesToHex(new Uint8Array(0))).toBe('');
    expect(hexToBytes('')).toEqual(new Uint8Array(0));
  });

  it('hexToBytes menolak string ganjil atau non-heksadesimal', () => {
    expect(() => hexToBytes('abc')).toThrow(TypeError);
    expect(() => hexToBytes('zz')).toThrow(TypeError);
    expect(() => hexToBytes(123)).toThrow(TypeError);
  });

  it('konversi bytes <-> BigInt', () => {
    const raw = new Uint8Array([0x01, 0x02]);
    const n = bytesToBig(raw);
    expect(n).toBe(258n);
    expect(bytesToBig(new Uint8Array(0))).toBe(0n);

    const back = bigToBytes(258n, 2);
    expect(back).toEqual(raw);

    const padded = bigToBytes(258n, 4);
    expect(padded).toEqual(new Uint8Array([0, 0, 1, 2]));
  });

  it('bigToBytes menolak jika tidak muat dalam len byte atau bernilai negatif', () => {
    expect(() => bigToBytes(65536n, 2)).toThrow(RangeError);
    expect(() => bigToBytes(-5n, 2)).toThrow(RangeError);
  });

  it('bitLength dan byteLength', () => {
    expect(bitLength(0n)).toBe(0);
    expect(byteLength(0n)).toBe(0);
    expect(bitLength(1n)).toBe(1);
    expect(byteLength(1n)).toBe(1);
    expect(bitLength(255n)).toBe(8);
    expect(byteLength(255n)).toBe(1);
    expect(bitLength(256n)).toBe(9);
    expect(byteLength(256n)).toBe(2);
  });

  it('concat dan equalBytes', () => {
    const a = new Uint8Array([1, 2]);
    const b = new Uint8Array([3, 4, 5]);
    const c = concat(a, b);
    expect(c).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
    expect(equalBytes(c, new Uint8Array([1, 2, 3, 4, 5]))).toBe(true);
    expect(equalBytes(c, new Uint8Array([1, 2, 3, 4, 6]))).toBe(false);
    expect(equalBytes(a, b)).toBe(false);
  });

  it('utf8Encode dan utf8Decode', () => {
    const text = 'Halo Kripto! 💎 12345';
    const encoded = utf8Encode(text);
    expect(utf8Decode(encoded)).toBe(text);
  });

  it('utf8Decode melempar error saat menerima byte UTF-8 invalid (fatal mode)', () => {
    const invalidUtf8 = new Uint8Array([0xff, 0xff]);
    expect(() => utf8Decode(invalidUtf8)).toThrow();
  });
});
