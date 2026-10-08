import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';

export function keysRouter({ keyStore, logger }) {
  const router = Router();

  router.get('/pubkey', (req, res) => {
    const pub = keyStore.getPublic();
    res.json(pub);
  });

  router.get('/keys/debug', (req, res) => {
    res.setHeader('X-Edu-Warning', 'KUNCI PRIVAT INI HANYA BOLEH DITAMPILKAN DALAM LINGKUNGAN DEMO EDUKASI');
    const debugKeys = keyStore.getDebug();
    res.json(debugKeys);
  });

  router.post('/keys/regenerate', async (req, res, next) => {
    try {
      const bits = Number(req.body?.bits || 512);
      if (bits !== 512 && bits !== 1024) {
        throw new AppError(
          'INVALID_KEY_SIZE',
          400,
          'Ukuran kunci yang diizinkan untuk regenerasi hanya 512 atau 1024 bit'
        );
      }

      const result = await keyStore.regenerate(bits);
      if (logger) {
        logger.info(`Kunci RSA server berhasil di-generate ulang (${bits}-bit)`, {
          fingerprint: result.pubkey.fingerprint
        });
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
