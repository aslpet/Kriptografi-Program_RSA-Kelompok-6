import { Router } from 'express';
import { catalog, paymentMethods } from '../data/catalog.js';

export function catalogRouter() {
  const router = Router();

  router.get('/', (req, res) => {
    res.json({
      games: catalog,
      paymentMethods
    });
  });

  return router;
}
