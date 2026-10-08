import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair } from '../src/keygen.js';
import { signText, verifyText } from '../src/rsa.js';

describe('signText & verifyText', () => {
  let keyPair;
  let otherKeyPair;

  beforeAll(() => {
    keyPair = generateKeyPair(512);
    otherKeyPair = generateKeyPair(512);
  });

  it('tanda tangan valid diverifikasi dengan sukses di peramban', () => {
    const text = 'TRX-20261008-0001: Arena of Blades, 86 Gems, Rp 20.000';
    const sig = signText(text, keyPair);

    const result = verifyText(text, sig, keyPair);
    expect(result.valid).toBe(true);
    expect(result.hashComputed).toBe(result.hashFromSignature);
    expect(typeof result.hashComputed).toBe('string');
  });

  it('GAGAL verifikasi bila pesan teks diubah 1 karakter saja (tamper simulation)', () => {
    const originalText = 'TRX-20261008-0001: Arena of Blades, 86 Gems, Rp 20.000';
    const tamperedText = 'TRX-20261008-0001: Arena of Blades, 86 Gems, Rp 50.000';
    const sig = signText(originalText, keyPair);

    const result = verifyText(tamperedText, sig, keyPair);
    expect(result.valid).toBe(false);
    expect(result.hashComputed).not.toBe(result.hashFromSignature);
  });

  it('GAGAL verifikasi bila signature diubah atau rusak', () => {
    const text = 'Data Transaksi Sah';
    const sig = signText(text, keyPair);

    // Ganti 1 karakter hex terakhir
    const lastChar = sig.slice(-1);
    const flippedChar = lastChar === '0' ? '1' : '0';
    const corruptedSig = sig.slice(0, -1) + flippedChar;

    const result = verifyText(text, corruptedSig, keyPair);
    expect(result.valid).toBe(false);
  });

  it('GAGAL verifikasi bila diverifikasi dengan kunci publik yang berbeda', () => {
    const text = 'Data Transaksi Sah';
    const sig = signText(text, keyPair);

    const result = verifyText(text, sig, otherKeyPair);
    expect(result.valid).toBe(false);
  });

  it('menolak pembuatan tanda tangan pada kunci yang terlalu kecil (< 344 bit)', () => {
    const smallKey = generateKeyPair(256);
    expect(() => signText('halo', smallKey)).toThrow(RangeError);
  });
});
