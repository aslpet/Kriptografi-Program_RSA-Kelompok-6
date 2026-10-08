import { describe, it, expect } from 'vitest';
import { rupiah, truncHex } from './format.js';

describe('format.js', () => {
  it('rupiah memformat angka ke mata uang IDR', () => {
    expect(rupiah(20000)).toContain('20.000');
    expect(rupiah(0)).toContain('0');
  });

  it('truncHex memotong string heksadesimal panjang dengan aman', () => {
    const longHex = '0123456789abcdef0123456789abcdef';
    const truncated = truncHex(longHex, 6, 4);
    expect(truncated).toBe('012345...cdef');
  });
});
