import { describe, it, expect } from 'vitest';
import { canonicalize } from '../src/canonical.js';

describe('canonical.js', () => {
  it('objek dengan urutan kunci berbeda menghasilkan representasi kanonik identik', () => {
    const obj1 = { b: 2, a: 1, c: { y: 20, x: 10 } };
    const obj2 = { a: 1, c: { x: 10, y: 20 }, b: 2 };
    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
    expect(canonicalize(obj1)).toBe('{"a":1,"b":2,"c":{"x":10,"y":20}}');
  });

  it('array mempertahankan urutan asli elemen', () => {
    const arr1 = [3, 1, 2];
    expect(canonicalize(arr1)).toBe('[3,1,2]');
  });

  it('mengabaikan kunci dengan nilai undefined', () => {
    const obj = { a: 1, b: undefined, c: 3 };
    expect(canonicalize(obj)).toBe('{"a":1,"c":3}');
  });

  it('menolak bilangan NaN dan Infinity', () => {
    expect(() => canonicalize({ x: NaN })).toThrow(TypeError);
    expect(() => canonicalize({ x: Infinity })).toThrow(TypeError);
  });
});
