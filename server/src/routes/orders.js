import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';

export function ordersRouter({ orderStore }) {
  const router = Router();

  router.get('/:id', (req, res, next) => {
    try {
      const order = orderStore.get(req.params.id);
      if (!order) {
        throw new AppError('ORDER_NOT_FOUND', 404, `Order dengan ID '${req.params.id}' tidak ditemukan`);
      }

      res.json({
        order: {
          id: order.id,
          status: order.status,
          createdAt: order.createdAt
        },
        receipt: order.receipt,
        signature: order.signature,
        keyFingerprint: order.keyFingerprint,
        signerPub: order.signerPub
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
