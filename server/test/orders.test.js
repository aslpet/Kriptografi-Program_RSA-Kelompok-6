import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { KeyStore } from '../src/services/keyStore.js';
import { OrderStore } from '../src/services/orderStore.js';
import { NonceStore } from '../src/services/nonceStore.js';
import { ServerLogger } from '../src/services/logger.js';
import { generateKeyPair, encryptText } from '@topup/rsa';

describe('Server - Pengujian Order Store & Retrieval (/api/orders)', () => {
  let app;
  let serverKeyPair;
  let orderStore;

  beforeAll(() => {
    serverKeyPair = generateKeyPair(512);
    const keyStore = new KeyStore({ memory: true, initialKey: serverKeyPair });
    orderStore = new OrderStore({ memory: true });
    const nonceStore = new NonceStore();
    const logger = new ServerLogger(50);

    app = createApp({
      keyStore,
      orderStore,
      nonceStore,
      logger
    });
  });

  it('mengambil detail order yang tersimpan berdasarkan ID', async () => {
    const payload = {
      v: 1,
      game: 'abl',
      item: 'abl-86',
      playerId: '12345678',
      zoneId: '2201',
      method: 'ewallet',
      payNo: '081234567890',
      nonce: 'nonce-order-get-1',
      ts: Date.now()
    };
    const checkRes = await request(app)
      .post('/api/checkout')
      .send({ blocks: encryptText(JSON.stringify(payload), serverKeyPair) });

    const orderId = checkRes.body.order.id;

    const res = await request(app).get(`/api/orders/${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.order.id).toBe(orderId);
    expect(res.body.receipt.amount).toBe(20000);
    expect(res.body.signerPub).toBeDefined();
  });

  it('mengembalikan 404 ORDER_NOT_FOUND jika ID tidak ada', async () => {
    const res = await request(app).get('/api/orders/TRX-99999999-9999');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('ORDER_NOT_FOUND');
  });

  it('reservasi ID paralel menghasilkan urutan unik tanpa tabrakan', () => {
    const ids = new Set();
    const now = Date.now();
    for (let i = 0; i < 20; i++) {
      const id = orderStore.reserveId(now);
      expect(ids.has(id)).toBe(false);
      ids.add(id);
    }
    expect(ids.size).toBe(20);
  });
});
