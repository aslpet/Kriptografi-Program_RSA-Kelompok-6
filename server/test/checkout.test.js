import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { KeyStore } from '../src/services/keyStore.js';
import { OrderStore } from '../src/services/orderStore.js';
import { NonceStore } from '../src/services/nonceStore.js';
import { ServerLogger } from '../src/services/logger.js';
import {
  generateKeyPair,
  encryptText,
  verifyText,
  parsePublicKey
} from '@topup/rsa';

describe('Server - Checkout API', () => {
  let app;
  let keyStore;
  let nonceStore;
  let orderStore;
  let logger;
  let serverKeyPair;
  let clientTime;

  beforeAll(async () => {
    // Bangkitkan 1 kunci 512-bit untuk rangkaian pengujian
    serverKeyPair = generateKeyPair(512);
    keyStore = new KeyStore({ memory: true, initialKey: serverKeyPair });
    orderStore = new OrderStore({ memory: true });
    nonceStore = new NonceStore();
    logger = new ServerLogger(100);

    clientTime = 1791331200000;
    app = createApp({
      keyStore,
      orderStore,
      nonceStore,
      logger,
      clock: () => clientTime
    });
  });

  function makePayload(overrides = {}) {
    return {
      v: 1,
      game: 'abl',
      item: 'abl-86',
      playerId: '12345678',
      zoneId: '2201',
      method: 'ewallet',
      payNo: '081234567890',
      nonce: 'nonce-' + Math.random().toString(36).substring(2, 10),
      ts: clientTime,
      ...overrides
    };
  }

  it('berhasil memproses transaksi checkout valid (E-Wallet) dan mengembalikan struk bertanda tangan', async () => {
    const payload = makePayload();
    const blocks = encryptText(JSON.stringify(payload), serverKeyPair);

    const res = await request(app)
      .post('/api/checkout')
      .send({ blocks });

    expect(res.status).toBe(201);
    expect(res.body.order.id).toMatch(/^TRX-\d{8}-\d{4}$/);
    expect(res.body.receipt.amount).toBe(20000); // Resmi dari katalog
    expect(res.body.receipt.payNo).toBe('0812****7890'); // Dimasking

    // Verifikasi tanda tangan digital di sisi klien
    const canonicalStr = JSON.stringify(res.body.receipt); // Cek verifikasi
    const verifyResult = verifyText(
      (await import('@topup/rsa')).canonicalize(res.body.receipt),
      res.body.signature,
      serverKeyPair
    );
    expect(verifyResult.valid).toBe(true);
  });

  it('berhasil memproses transaksi checkout dengan PIN Saldo Lapak (PIN tidak masuk struk)', async () => {
    const payload = makePayload({
      method: 'saldo',
      payNo: undefined,
      pin: '654321',
      item: 'abl-172'
    });
    delete payload.payNo;

    const blocks = encryptText(JSON.stringify(payload), serverKeyPair);
    const res = await request(app)
      .post('/api/checkout')
      .send({ blocks });

    expect(res.status).toBe(201);
    expect(res.body.receipt.amount).toBe(39000);
    expect(res.body.receipt.pin).toBeUndefined(); // PIN tidak pernah ada di struk
  });

  it('menolak payload jika body request bukan JSON atau blocks bukan array hex valid (400 BAD_REQUEST)', async () => {
    const res1 = await request(app)
      .post('/api/checkout')
      .send('bukan-json')
      .set('Content-Type', 'application/json');
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post('/api/checkout')
      .send({ blocks: ['pendek'] });
    expect(res2.status).toBe(400);
  });

  it('menolak dekripsi jika ciphertext acak atau berasal dari kunci lain (400 DECRYPT_FAILED)', async () => {
    const otherKey = generateKeyPair(512);
    const payload = makePayload();
    // Enkripsi dengan kunci yang SALAH
    const blocks = encryptText(JSON.stringify(payload), otherKey);

    const res = await request(app)
      .post('/api/checkout')
      .send({ blocks });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('DECRYPT_FAILED');
  });

  it('menolak jika hasil dekripsi bukan JSON (400 PAYLOAD_INVALID)', async () => {
    const blocks = encryptText('ini teks biasa bukan JSON', serverKeyPair);
    const res = await request(app)
      .post('/api/checkout')
      .send({ blocks });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('PAYLOAD_INVALID');
  });

  it('menolak jika data akun atau pembayaran tidak memenuhi validasi (422 VALIDATION_FAILED)', async () => {
    const payload = makePayload({
      playerId: '123' // Kurang dari 6 digit
    });
    const blocks = encryptText(JSON.stringify(payload), serverKeyPair);

    const res = await request(app)
      .post('/api/checkout')
      .send({ blocks });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(res.body.error.errors).toBeDefined();
  });

  it('menegakkan batas min/max spesifik per game (Arena of Blades vs Pixel Racers)', async () => {
    // 1. Pixel Racers (min 8 digit): 7 digit ditolak 422
    const pxrPayloadFail = {
      v: 1,
      game: 'pxr',
      item: 'pxr-60',
      playerId: '1234567', // 7 digit
      method: 'ewallet',
      payNo: '081234567890',
      nonce: 'nonce-pxr-fail-' + Date.now(),
      ts: clientTime
    };
    const resPxrFail = await request(app)
      .post('/api/checkout')
      .send({ blocks: encryptText(JSON.stringify(pxrPayloadFail), serverKeyPair) });
    expect(resPxrFail.status).toBe(422);
    expect(resPxrFail.body.error.errors[0].message).toContain('8–12 digit');

    // 2. Pixel Racers (min 8 digit): 8 digit diterima 201
    const pxrPayloadOk = {
      ...pxrPayloadFail,
      playerId: '12345678', // 8 digit
      nonce: 'nonce-pxr-ok-' + Date.now()
    };
    const resPxrOk = await request(app)
      .post('/api/checkout')
      .send({ blocks: encryptText(JSON.stringify(pxrPayloadOk), serverKeyPair) });
    expect(resPxrOk.status).toBe(201);
  });

  it('menolak jika timestamp di luar batas toleransi ±5 menit (422 TIMESTAMP_EXPIRED)', async () => {
    const payload = makePayload({
      ts: clientTime - 6 * 60 * 1000 // 6 menit yang lalu
    });
    const blocks = encryptText(JSON.stringify(payload), serverKeyPair);

    const res = await request(app)
      .post('/api/checkout')
      .send({ blocks });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('TIMESTAMP_EXPIRED');
  });

  it('MENOLAK SERANGAN REPLAY dengan nonce yang sama (409 REPLAY_DETECTED)', async () => {
    const payload = makePayload({ nonce: 'fixed-replay-nonce-123' });
    const blocks = encryptText(JSON.stringify(payload), serverKeyPair);

    // Kirim pertama: sukses
    const res1 = await request(app)
      .post('/api/checkout')
      .send({ blocks });
    expect(res1.status).toBe(201);

    // Kirim ulang (replay) paket yang sama persis: HARUS 409
    const res2 = await request(app)
      .post('/api/checkout')
      .send({ blocks });
    expect(res2.status).toBe(409);
    expect(res2.body.error.code).toBe('REPLAY_DETECTED');
  });

  it('kebal terhadap manipulasi harga oleh client (amount diabaikan)', async () => {
    const payload = makePayload({
      item: 'abl-706', // Harga asli 155000
      amount: 100 // Dicoba dimanipulasi jadi Rp 100
    });
    const blocks = encryptText(JSON.stringify(payload), serverKeyPair);

    const res = await request(app)
      .post('/api/checkout')
      .send({ blocks });

    expect(res.status).toBe(201);
    expect(res.body.receipt.amount).toBe(155000); // Server mengambil harga asli
  });
});
