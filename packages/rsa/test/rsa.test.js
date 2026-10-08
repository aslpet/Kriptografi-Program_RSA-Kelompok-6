import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPair, buildKeyPairFrom } from '../src/keygen.js';
import {
  encryptRaw,
  decryptRaw,
  encryptText,
  decryptText,
  encryptTextbook,
  decryptTextbook
} from '../src/rsa.js';
import { PaddingError } from '../src/padding.js';

describe('rsa.js - Operasi Enkripsi & Dekripsi', () => {
  let keyPair512;
  let eduKey;

  beforeAll(() => {
    keyPair512 = generateKeyPair(512);
    eduKey = buildKeyPairFrom(61n, 53n, 17n); // n=3233, d=2753
  });

  it('Textbook raw: m=65 menghasilkan c=2790 dan dekripsi kembali 65', () => {
    const m = 65n;
    const c = encryptRaw(m, eduKey);
    expect(c).toBe(2790n);

    const decrypted = decryptRaw(c, eduKey);
    expect(decrypted).toBe(65n);
  });

  it('Textbook string mode roundtrip', () => {
    const text = 'RSA TEST 123';
    const cipherArr = encryptTextbook(text, eduKey);
    expect(Array.isArray(cipherArr)).toBe(true);

    const decryptedText = decryptTextbook(cipherArr, eduKey);
    expect(decryptedText).toBe(text);
  });

  it('Textbook menolak karakter yang code point-nya melampaui modulus n', () => {
    // Emoji bernilai code point > 3233
    expect(() => encryptTextbook('💎', eduKey)).toThrow(RangeError);
  });

  it('Enkripsi ber-padding menghasilkan ciphertext berbeda untuk teks yang sama (non-deterministik)', () => {
    const text = 'Halo Lapak Diamond!';
    const c1 = encryptText(text, keyPair512);
    const c2 = encryptText(text, keyPair512);
    expect(c1).not.toEqual(c2);

    expect(decryptText(c1, keyPair512)).toBe(text);
    expect(decryptText(c2, keyPair512)).toBe(text);
  });

  it('Roundtrip 500 pesan acak (multi-blok, UTF-8, panjang bervariasi) kembali persis sama', () => {
    const sampleStrings = [
      '',
      'A',
      'Pesan checkout singkat',
      '{"playerId":"12345678","zoneId":"2201","item":"abl-86","method":"ewallet","payNo":"081234567890"}',
      'Teks bahasa Indonesia dengan aksen dan simbol: Rp 150.000, 100% aman & terpercaya!',
      'Unicode multibyte: 🎮 💎 ⚔️ 🛡️ 🚀 🔥'
    ];

    // Buat variasi pesan
    for (let i = 0; i < 500; i++) {
      let text;
      if (i < sampleStrings.length) {
        text = sampleStrings[i];
      } else {
        // Pesan panjang multi-blok (panjang antara 50 sampai 250 karakter)
        const len = 50 + (i % 200);
        text = `Order #${i} - ` + 'X'.repeat(len) + ` - ts:${Date.now()}`;
      }

      const blocks = encryptText(text, keyPair512);
      expect(Array.isArray(blocks)).toBe(true);

      const decrypted = decryptText(blocks, keyPair512);
      expect(decrypted).toBe(text);
    }
  });

  it('Dekripsi menolak blok ciphertext yang rusak atau tidak valid', () => {
    const blocks = encryptText('Pesan Rahasia', keyPair512);

    // Ubah 1 blok
    const badBlocks = [...blocks];
    badBlocks[0] = 'ff'.repeat(64); // Nilai sangat mungkin melampaui n atau format padding rusak
    expect(() => decryptText(badBlocks, keyPair512)).toThrow();
  });
});
