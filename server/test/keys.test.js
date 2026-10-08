import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { KeyStore } from '../src/services/keyStore.js';
import { OrderStore } from '../src/services/orderStore.js';
import { NonceStore } from '../src/services/nonceStore.js';
import { ServerLogger } from '../src/services/logger.js';
import { generateKeyPair, encryptText, canonicalize, verifyText, parsePublicKey } from '@topup/rsa';

describe('Server - Pengujian Manajemen Kunci (/api/server)', () => {
  let app;
  let keyStore;
  let serverKeyPair;

  beforeAll(async () => {
    serverKeyPair = generateKeyPair(512);
    keyStore = new KeyStore({ memory: true, initialKey: serverKeyPair });
    const orderStore = new OrderStore({ memory: true });
    const nonceStore = new NonceStore();
    const logger = new ServerLogger(50);

    app = createApp({
      keyStore,
      orderStore,
      nonceStore,
      logger
    });
  });

  it('GET /api/server/pubkey mengembalikan kunci publik dan fingerprint yang valid', async () => {
    const res = await request(app).get('/api/server/pubkey');
    expect(res.status).toBe(200);
    expect(res.body.bits).toBe(512);
    expect(typeof res.body.n).toBe('string');
    expect(typeof res.body.e).toBe('string');
    expect(res.body.fingerprint).toHaveLength(16);
  });

  it('GET /api/server/keys/debug mengembalikan parameter lengkap termasuk d (dengan header edukasi)', async () => {
    const res = await request(app).get('/api/server/keys/debug');
    expect(res.status).toBe(200);
    expect(res.headers['x-edu-warning']).toBeDefined();
    expect(res.body.d).toBeDefined();
    expect(res.body.p).toBeDefined();
    expect(res.body.q).toBeDefined();
  });

  it('POST /api/server/keys/regenerate menolak ukuran bit selain 512 atau 1024', async () => {
    const res = await request(app)
      .post('/api/server/keys/regenerate')
      .send({ bits: 256 });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_KEY_SIZE');
  });

  it('regenerasi kunci menghasilkan fingerprint baru, dan struk lama terdeteksi menggunakan kunci lama', async () => {
    // 1. Buat checkout sebelum regenerasi
    const oldKey = keyStore.getPublic();
    const payload = {
      v: 1,
      game: 'abl',
      item: 'abl-86',
      playerId: '12345678',
      zoneId: '2201',
      method: 'ewallet',
      payNo: '081234567890',
      nonce: 'nonce-old-key-1',
      ts: Date.now()
    };
    const checkRes = await request(app)
      .post('/api/checkout')
      .send({ blocks: encryptText(JSON.stringify(payload), keyStore.getPrivate()) });
    expect(checkRes.status).toBe(201);
    const oldReceipt = checkRes.body.receipt;
    const oldSignature = checkRes.body.signature;
    const oldFingerprint = checkRes.body.keyFingerprint;

    // 2. Regenerate kunci server
    const regenRes = await request(app)
      .post('/api/server/keys/regenerate')
      .send({ bits: 512 });
    expect(regenRes.status).toBe(200);
    const newFingerprint = regenRes.body.pubkey.fingerprint;
    expect(newFingerprint).not.toBe(oldFingerprint);

    // 3. Verifikasi struk lama terhadap kunci baru: GAGAL
    const newPubBig = parsePublicKey(regenRes.body.pubkey);
    const verifyWithNewKey = verifyText(canonicalize(oldReceipt), oldSignature, newPubBig);
    expect(verifyWithNewKey.valid).toBe(false);

    // 4. Verifikasi struk lama terhadap kunci penandatangan aslinya (signerPub): VALID
    const oldPubBig = parsePublicKey(oldKey);
    const verifyWithOldKey = verifyText(canonicalize(oldReceipt), oldSignature, oldPubBig);
    expect(verifyWithOldKey.valid).toBe(true);
  });
});
