import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../server/src/data');

const filesToRemove = [
  path.join(dataDir, 'server-keys.json'),
  path.join(dataDir, 'orders.json')
];

console.log('--- Reset Data Demo Top-Up RSA ---');

for (const file of filesToRemove) {
  if (fs.existsSync(file)) {
    fs.rmSync(file, { force: true });
    console.log(`Dihapus: ${path.basename(file)}`);
  } else {
    console.log(`Sudah bersih: ${path.basename(file)}`);
  }
}

console.log('Reset selesai. Kunci baru dan daftar order bersih akan dibuat saat server dimulai ulang.');
