import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rsaRoot = path.resolve(__dirname, '../packages/rsa');
const srcDir = path.join(rsaRoot, 'src');
const pkgJsonPath = path.join(rsaRoot, 'package.json');

console.log('--- Memeriksa Dependensi @topup/rsa ---');

// 1. Cek package.json @topup/rsa
if (!fs.existsSync(pkgJsonPath)) {
  console.error('FAIL: packages/rsa/package.json tidak ditemukan!');
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
if (pkg.dependencies && Object.keys(pkg.dependencies).length > 0) {
  console.error('FAIL: packages/rsa tidak boleh memiliki "dependencies"!');
  console.error(pkg.dependencies);
  process.exit(1);
}

if (pkg.peerDependencies && Object.keys(pkg.peerDependencies).length > 0) {
  console.error('FAIL: packages/rsa tidak boleh memiliki "peerDependencies"!');
  process.exit(1);
}

// 2. Token terlarang di dalam kode produksi src/
const forbiddenTokens = [
  'node:crypto',
  "require('crypto')",
  'require("crypto")',
  'subtle',
  'bn.js',
  'node-forge',
  'jsencrypt',
  'big-integer',
  'jsbn',
  'crypto-js'
];

let failed = false;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      const content = fs.readFileSync(fullPath, 'utf8');

      // Hapus komentar agar tidak terjadi false positive pada dokumentasi/komentar
      const codeWithoutComments = content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*/g, '');

      // Cek forbidden tokens
      for (const token of forbiddenTokens) {
        if (codeWithoutComments.includes(token)) {
          console.error(`FAIL: Token terlarang "${token}" ditemukan di file ${path.relative(rsaRoot, fullPath)}`);
          failed = true;
        }
      }

      // Cek bahwa semua import dan export berasal dari path relatif './'
      const importMatches = content.matchAll(/(?:from\s+['"]([^'"]+)['"]|import\s*\(['"]([^'"]+)['"]\))/g);
      for (const match of importMatches) {
        const specifier = match[1] || match[2];
        if (specifier && !specifier.startsWith('.')) {
          console.error(`FAIL: Non-relative import "${specifier}" ditemukan di file ${path.relative(rsaRoot, fullPath)}`);
          failed = true;
        }
      }
    }
  }
}

if (fs.existsSync(srcDir)) {
  scanDir(srcDir);
} else {
  console.error('FAIL: packages/rsa/src tidak ditemukan!');
  process.exit(1);
}

if (failed) {
  console.error('PEMERIKSAAN GAGAL: Terdeteksi pelanggaran aturan independensi modul RSA.');
  process.exit(1);
} else {
  console.log('SUKSES: Modul @topup/rsa murni 100% tanpa dependensi eksternal.');
  process.exit(0);
}
