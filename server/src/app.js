import express from 'express';
import path from 'node:path';
import { catalogRouter } from './routes/catalog.js';
import { keysRouter } from './routes/keys.js';
import { checkoutRouter } from './routes/checkout.js';
import { ordersRouter } from './routes/orders.js';
import { logsRouter } from './routes/logs.js';
import { errorHandler, AppError } from './middleware/errorHandler.js';

export function createApp({
  keyStore,
  orderStore,
  nonceStore,
  logger,
  clock = Date.now,
  staticDir
} = {}) {
  const app = express();

  // Parsing JSON body dengan batas wajar 64KB
  app.use(express.json({ limit: '64kb' }));

  // Endpoint cek kesehatan
  app.get('/api/health', (req, res) => {
    res.json({ ok: true, serverTime: clock() });
  });

  // Routing API
  if (keyStore && logger) {
    app.use('/api/server', keysRouter({ keyStore, logger }));
  }
  if (keyStore && orderStore && nonceStore) {
    app.use('/api/checkout', checkoutRouter({ keyStore, orderStore, nonceStore, logger, clock }));
  }
  if (orderStore) {
    app.use('/api/orders', ordersRouter({ orderStore }));
  }
  if (logger) {
    app.use('/api/logs', logsRouter({ logger }));
  }
  app.use('/api/catalog', catalogRouter());

  // 404 untuk rute API yang tidak dikenal
  app.all('/api/{*splat}', (req, res, next) => {
    next(new AppError('NOT_FOUND', 404, `Endpoint API '${req.path}' tidak ditemukan`));
  });

  // Sajikan aset statis frontend SPA jika direktori build ada
  if (staticDir) {
    app.use(express.static(staticDir));
    app.get('/{*splat}', (req, res) => {
      res.sendFile(path.join(staticDir, 'index.html'));
    });
  }

  // Error handler middleware
  app.use(errorHandler(logger));

  return app;
}
