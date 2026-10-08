import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto'; // Diperbolehkan HANYA di file test sebagai tolok ukur verifikasi
import { sha256Hex, sha256 } from '../src/sha256.js';
import { utf8Encode } from '../src/bytes.js';

describe('sha256.js', () => {
  it('vektor uji resmi 1: string kosong', () => {
    const hash = sha256Hex(utf8Encode(''));
    expect(hash).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });

  it('vektor uji resmi 2: "abc"', () => {
    const hash = sha256Hex(utf8Encode('abc'));
    expect(hash).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('vektor uji resmi 3: teks 56-byte abcdbcdecdef...', () => {
    const str = 'abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq';
    const hash = sha256Hex(utf8Encode(str));
    expect(hash).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });

  it('vektor uji 1.000.000 karakter "a"', () => {
    const millionA = new Uint8Array(1000000).fill(0x61);
    const hash = sha256Hex(millionA);
    expect(hash).toBe('cdc76e5c9914fb9281a1c7e284d73e67f1809a48a497200e046d39ccc7112cd0');
  });

  it('uji batas blok (boundary lengths: 55, 56, 63, 64, 119, 120)', () => {
    const lengths = [55, 56, 63, 64, 119, 120];
    for (const len of lengths) {
      const data = new Uint8Array(len);
      for (let i = 0; i < len; i++) data[i] = (i * 7) & 0xff;

      const manualHash = sha256Hex(data);
      const nodeHash = crypto.createHash('sha256').update(data).digest('hex');
      expect(manualHash).toBe(nodeHash);
    }
  });

  it('uji 200 input acak identik dengan node:crypto', () => {
    for (let i = 0; i < 200; i++) {
      const len = i === 0 ? 0 : Math.floor(Math.random() * 500);
      const data = crypto.randomBytes(len);

      const manualHash = sha256Hex(new Uint8Array(data));
      const nodeHash = crypto.createHash('sha256').update(data).digest('hex');
      expect(manualHash).toBe(nodeHash);
    }
  });
});
