import fs from 'node:fs';
import { createApp } from './app.js';
import { KeyStore } from './services/keyStore.js';
import { OrderStore } from './services/orderStore.js';
import { NonceStore } from './services/nonceStore.js';
import { ServerLogger } from './services/logger.js';
import { CLIENT_DIST } from './paths.js';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  console.log('--- Menginisialisasi Lapak Diamond Server ---');

  const logger = new ServerLogger(200);
  const nonceStore = new NonceStore();
  const orderStore = new OrderStore({ memory: false });
  const keyStore = new KeyStore({ memory: false });

  await keyStore.init();
  const pub = keyStore.getPublic();
  console.log(`Kunci RSA Server Siap: ${pub.bits}-bit [Fingerprint: ${pub.fingerprint}]`);

  const staticDir = fs.existsSync(CLIENT_DIST) ? CLIENT_DIST : undefined;
  if (staticDir) {
    console.log(`Menyajikan frontend dari: ${staticDir}`);
  }

  const app = createApp({
    keyStore,
    orderStore,
    nonceStore,
    logger,
    staticDir
  });

  const server = app.listen(PORT, () => {
    console.log(`Server aktif berjalan di http://localhost:${PORT}`);
  });

  const shutdown = () => {
    console.log('Menutup server...');
    nonceStore.close();
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch(err => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
