import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { KeyStore } from '../src/services/keyStore.js';
import { OrderStore } from '../src/services/orderStore.js';
import { NonceStore } from '../src/services/nonceStore.js';
import { ServerLogger } from '../src/services/logger.js';
import { generateKeyPair, encryptText } from '@topup/rsa';

describe('Server - Pengujian Privasi & Redaksi Data Sensitif', () => {
  let app;
  let serverKeyPair;
  let orderStore;
  let logger;

  const SECRET_PIN = '998877';
  const RAW_PHONE = '081234567890';

  beforeAll(async () => {
    serverKeyPair = generateKeyPair(512);
    const keyStore = new KeyStore({ memory: true, initialKey: serverKeyPair });
    orderStore = new OrderStore({ memory: true });
    const nonceStore = new NonceStore();
    logger = new ServerLogger(100);

    app = createApp({
      keyStore,
      orderStore,
      nonceStore,
      logger
    });

    // 1. Transaksi dengan PIN
    const payloadPin = {
      v: 1,
      game: 'abl',
      item: 'abl-86',
      playerId: '12345678',
      zoneId: '2201',
      method: 'saldo',
      pin: SECRET_PIN,
      nonce: 'nonce-pin-1',
      ts: Date.now()
    };
    await request(app)
      .post('/api/checkout')
      .send({ blocks: encryptText(JSON.stringify(payloadPin), serverKeyPair) });

    // 2. Transaksi dengan Nomor HP
    const payloadPhone = {
      v: 1,
      game: 'abl',
      item: 'abl-86',
      playerId: '12345678',
      zoneId: '2201',
      method: 'ewallet',
      payNo: RAW_PHONE,
      nonce: 'nonce-phone-1',
      ts: Date.now()
    };
    await request(app)
      .post('/api/checkout')
      .send({ blocks: encryptText(JSON.stringify(payloadPhone), serverKeyPair) });
  });

  it('PIN tidak pernah muncul dalam respons struk, respons trace, maupun snapshot orderStore', () => {
    const ordersJson = JSON.stringify(orderStore.snapshot());
    expect(ordersJson).not.toContain(SECRET_PIN);
  });

  it('PIN dan nomor HP penuh tidak pernah muncul pada log server (/api/logs)', async () => {
    const res = await request(app).get('/api/logs');
    const logsJson = JSON.stringify(res.body);

    expect(logsJson).not.toContain(SECRET_PIN);
    expect(logsJson).not.toContain(RAW_PHONE);
    expect(logsJson).toContain('0812****7890'); // Format masked
  });
});
