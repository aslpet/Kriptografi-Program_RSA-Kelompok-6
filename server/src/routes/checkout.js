import { Router } from 'express';
import {
  decryptText,
  signText,
  canonicalize,
  byteLength
} from '@topup/rsa';
import { maskPhone } from '@topup/shared';
import { AppError } from '../middleware/errorHandler.js';
import { validatePayload } from '../services/validator.js';
import { redact } from '../services/logger.js';

export function checkoutRouter({ keyStore, orderStore, nonceStore, logger, clock = Date.now }) {
  const router = Router();

  router.post('/', async (req, res, next) => {
    const trace = [];
    try {
      const { blocks } = req.body || {};
      if (!Array.isArray(blocks) || blocks.length === 0) {
        throw new AppError('BAD_REQUEST', 400, 'Permintaan harus memuat array blocks heksadesimal');
      }

      const privKey = keyStore.getPrivate();
      const pubKey = keyStore.getPublic();
      const k = byteLength(privKey.n);

      // 1. Validasi bentuk setiap blok
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        if (typeof b !== 'string' || b.length !== 2 * k || !/^[0-9a-fA-F]+$/.test(b)) {
          throw new AppError(
            'BAD_REQUEST',
            400,
            `Format blok ke-${i + 1} tidak valid (panjang harus ${2 * k} karakter heksadesimal)`
          );
        }
      }

      // 2. Dekripsi RSA dengan kunci privat server
      let decryptedText;
      try {
        const t0 = Date.now();
        decryptedText = decryptText(blocks, privKey, {
          onStep: (stepInfo) => {
            trace.push({
              step: stepInfo.step,
              title: `Dekripsi blok ${stepInfo.blockIndex} dari ${stepInfo.totalBlocks}`,
              values: {
                cHex: stepInfo.cHex.slice(0, 16) + '...',
                chunkBytes: stepInfo.chunkBytes
              },
              ms: 0
            });
          }
        });
        trace.push({
          step: 'decrypt-summary',
          title: 'Dekripsi seluruh blok berhasil',
          values: { totalBlocks: blocks.length, payloadLength: decryptedText.length },
          ms: Date.now() - t0
        });
      } catch (err) {
        if (logger) logger.warn('Gagal mendekripsi payload RSA checkout', { err: err.message });
        throw new AppError('DECRYPT_FAILED', 400, 'Dekripsi RSA gagal atau format padding rusak');
      }

      // 3. Parse JSON hasil dekripsi
      let payload;
      try {
        payload = JSON.parse(decryptedText);
      } catch (err) {
        if (logger) logger.warn('Hasil dekripsi bukan JSON valid');
        throw new AppError('PAYLOAD_INVALID', 400, 'Hasil dekripsi bukan merupakan JSON yang valid');
      }

      trace.push({
        step: 'parse',
        title: 'Parse payload JSON',
        values: {
          game: payload.game,
          item: payload.item,
          playerId: payload.playerId,
          method: payload.method,
          hasPin: !!payload.pin
        },
        ms: 0
      });

      // 4. Validasi isi payload
      const validation = validatePayload(payload);
      if (!validation.ok) {
        throw new AppError('VALIDATION_FAILED', 422, 'Validasi data checkout gagal', {
          errors: validation.errors
        });
      }

      // 5. Cek batas kedaluwarsa timestamp (±5 menit)
      const now = clock();
      const FIVE_MINUTES_MS = 5 * 60 * 1000;
      if (typeof payload.ts !== 'number' || Math.abs(now - payload.ts) > FIVE_MINUTES_MS) {
        throw new AppError(
          'TIMESTAMP_EXPIRED',
          422,
          'Waktu permintaan transaksi sudah kedaluwarsa (di luar batas toleransi ±5 menit)'
        );
      }

      // 6. Cek serangan replay (Nonce)
      if (!payload.nonce || typeof payload.nonce !== 'string' || nonceStore.has(payload.nonce)) {
        if (logger) logger.warn('Terdeteksi replay transaksi dengan nonce yang sama', { nonce: payload.nonce });
        throw new AppError('REPLAY_DETECTED', 409, 'Nonce transaksi sudah pernah digunakan (replay terdeteksi)');
      }

      // Seluruh validasi lolos: catat nonce agar tidak bisa dipakai ulang
      nonceStore.add(payload.nonce);

      // 7. Ambil harga resmi dari katalog (Harga DIJAMIN dari server, bukan dari client)
      const officialAmount = validation.item.price;

      // 8. Buat Order ID dan susun receipt resmi
      const orderId = orderStore.reserveId(now);
      const receipt = {
        orderId,
        game: validation.game.name,
        item: validation.item.label,
        playerId: payload.playerId,
        amount: officialAmount,
        method: validation.method.label,
        ts: payload.ts
      };

      if (payload.zoneId) {
        receipt.zoneId = payload.zoneId;
      }
      if (payload.payNo) {
        receipt.payNo = maskPhone(payload.payNo);
      }
      // PIN TIDAK PERNAH MASUK KE DALAM STRUK

      // 9. Tanda tangani struk: canonical -> sha256 -> signText
      const canonicalReceipt = canonicalize(receipt);
      const signature = signText(canonicalReceipt, privKey, {
        onStep: (stepInfo) => {
          trace.push({
            step: 'sign',
            title: 'Tanda tangan digital server: s = EM^d mod n',
            values: {
              hashHex: stepInfo.hashHex,
              signaturePrefix: stepInfo.signatureHex.slice(0, 16) + '...'
            },
            ms: 0
          });
        }
      });

      // 10. Simpan transaksi ke penyimpanan order
      const orderRecord = {
        id: orderId,
        status: 'PAID',
        createdAt: now,
        receipt,
        signature,
        keyFingerprint: pubKey.fingerprint,
        signerPub: {
          n: pubKey.n,
          e: pubKey.e,
          bits: pubKey.bits
        }
      };

      await orderStore.save(orderRecord);

      if (logger) {
        logger.info(`Transaksi ${orderId} berhasil diproses`, {
          orderId,
          game: receipt.game,
          amount: receipt.amount,
          method: receipt.method,
          payNo: receipt.payNo
        });
      }

      res.status(201).json({
        order: {
          id: orderId,
          status: 'PAID',
          createdAt: now
        },
        receipt,
        signature,
        keyFingerprint: pubKey.fingerprint,
        trace: redact(trace)
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
