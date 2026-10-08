import { describe, it, expect } from 'vitest';
import { generateKeyPair } from '../src/keygen.js';
import {
  serializePublicKey,
  parsePublicKey,
  serializePrivateKey,
  parsePrivateKey,
  fingerprint
} from '../src/keyio.js';

describe('keyio.js', () => {
  it('serializePublicKey dan parsePublicKey bekerja bolak-balik', () => {
    const key = generateKeyPair(512);
    const serialized = serializePublicKey(key);

    expect(typeof serialized.n).toBe('string');
    expect(typeof serialized.e).toBe('string');
    expect(serialized.bits).toBe(512);

    const parsed = parsePublicKey(serialized);
    expect(parsed.n).toBe(key.n);
    expect(parsed.e).toBe(key.e);
    expect(parsed.bits).toBe(512);
  });

  it('serializePrivateKey dan parsePrivateKey bekerja bolak-balik', () => {
    const key = generateKeyPair(512);
    const serialized = serializePrivateKey(key);

    expect(typeof serialized.d).toBe('string');
    const parsed = parsePrivateKey(serialized);
    expect(parsed.n).toBe(key.n);
    expect(parsed.d).toBe(key.d);
  });

  it('fingerprint menghasilkan 16 hex string deterministik', () => {
    const key = generateKeyPair(512);
    const fp1 = fingerprint(key);
    const fp2 = fingerprint(serializePublicKey(key));

    expect(fp1).toHaveLength(16);
    expect(fp1).toBe(fp2);
    expect(/^[0-9a-f]{16}$/.test(fp1)).toBe(true);
  });
});
