import { describe, it, expect } from 'vitest';
import {
  padEncrypt,
  unpadEncrypt,
  padSign,
  parseSignEM,
  splitBlocks,
  describeEM,
  PaddingError
} from '../src/padding.js';

describe('padding.js', () => {
  it('padEncrypt dan unpadEncrypt bekerja bolak-balik (roundtrip)', () => {
    const msg = new Uint8Array([1, 2, 3, 4, 5]);
    const k = 64; // modulus 512 bit = 64 byte
    const em = padEncrypt(msg, k);

    expect(em.length).toBe(k);
    expect(em[0]).toBe(0x00);
    expect(em[1]).toBe(0x02);

    // Cari separator 0x00
    let sepIndex = -1;
    for (let i = 2; i < em.length; i++) {
      if (em[i] === 0x00) {
        sepIndex = i;
        break;
      }
    }
    expect(sepIndex).toBeGreaterThanOrEqual(10); // PS minimal 8 byte (indeks 2 s/d 9)

    // Unpad
    const unpadded = unpadEncrypt(em);
    expect(unpadded).toEqual(msg);
  });

  it('padEncrypt menghasilkan padding acak non-deterministik untuk pesan yang sama', () => {
    const msg = new Uint8Array([10, 20, 30]);
    const k = 64;
    const em1 = padEncrypt(msg, k);
    const em2 = padEncrypt(msg, k);
    expect(em1).not.toEqual(em2); // PS acak
    expect(unpadEncrypt(em1)).toEqual(unpadEncrypt(em2));
  });

  it('unpadEncrypt menolak format padding yang rusak', () => {
    const validEM = padEncrypt(new Uint8Array([1, 2]), 32);

    // Header rusak
    const badHeader = new Uint8Array(validEM);
    badHeader[1] = 0x01;
    expect(() => unpadEncrypt(badHeader)).toThrow(PaddingError);

    // Tanpa separator 0x00
    const noSep = new Uint8Array(validEM);
    for (let i = 2; i < noSep.length; i++) {
      if (noSep[i] === 0x00) noSep[i] = 0x01;
    }
    expect(() => unpadEncrypt(noSep)).toThrow(PaddingError);
  });

  it('padSign dan parseSignEM memverifikasi format tipe 1 (00 01 FF..FF 00 Hash)', () => {
    const fakeHash = new Uint8Array(32).fill(0xaa);
    const k = 64;
    const em = padSign(fakeHash, k);

    expect(em.length).toBe(k);
    expect(em[0]).toBe(0x00);
    expect(em[1]).toBe(0x01);

    const parsedHash = parseSignEM(em, 32);
    expect(parsedHash).toEqual(fakeHash);

    // Rusak salah satu byte PS
    const corrupted = new Uint8Array(em);
    corrupted[5] = 0xfe; // harus 0xff
    expect(parseSignEM(corrupted, 32)).toBeNull();
  });

  it('splitBlocks memecah data byte secara akurat', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5, 6, 7]);
    const blocks = splitBlocks(data, 3);
    expect(blocks.length).toBe(3);
    expect(blocks[0]).toEqual(new Uint8Array([1, 2, 3]));
    expect(blocks[1]).toEqual(new Uint8Array([4, 5, 6]));
    expect(blocks[2]).toEqual(new Uint8Array([7]));

    const empty = splitBlocks(new Uint8Array(0), 10);
    expect(empty.length).toBe(1);
    expect(empty[0].length).toBe(0);
  });

  it('describeEM menghasilkan rincian visual komponen padding', () => {
    const msg = new Uint8Array([0xde, 0xad]);
    const em = padEncrypt(msg, 16);
    const desc = describeEM(em);
    expect(desc.header).toBe('0002');
    expect(desc.sep).toBe('00');
    expect(desc.data).toBe('dead');
  });
});
