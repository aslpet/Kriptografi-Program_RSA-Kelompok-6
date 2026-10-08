import fs from 'node:fs';
import path from 'node:path';
import {
  generateKeyPair,
  serializePublicKey,
  serializePrivateKey,
  parsePublicKey,
  parsePrivateKey,
  fingerprint
} from '@topup/rsa';
import { DATA_DIR } from '../paths.js';

export class KeyStore {
  constructor({ memory = false, filePath, initialKey } = {}) {
    this.memory = memory;
    this.filePath = filePath || path.join(DATA_DIR, 'server-keys.json');
    this.currentKey = initialKey || null;
  }

  async init() {
    if (this.currentKey) return;

    if (!this.memory && fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const data = JSON.parse(raw);
        this.currentKey = parsePrivateKey(data);
        this.currentKey.bits = data.bits;
        return;
      } catch (err) {
        console.error('Gagal memuat server-keys.json, membuat kunci baru:', err);
      }
    }

    // Default pembangkitan kunci 512-bit saat awal jalan
    await this.regenerate(512);
  }

  getPublic() {
    if (!this.currentKey) throw new Error('Kunci server belum diinisialisasi');
    const pub = serializePublicKey(this.currentKey);
    return {
      bits: pub.bits,
      e: pub.e,
      n: pub.n,
      fingerprint: fingerprint(this.currentKey)
    };
  }

  getPrivate() {
    if (!this.currentKey) throw new Error('Kunci server belum diinisialisasi');
    return this.currentKey;
  }

  getDebug() {
    if (!this.currentKey) throw new Error('Kunci server belum diinisialisasi');
    return serializePrivateKey(this.currentKey);
  }

  async regenerate(bits = 512) {
    if (bits !== 512 && bits !== 1024) {
      throw new RangeError('Ukuran kunci server hanya diizinkan 512 atau 1024 bit demi performa');
    }

    const trace = [];
    const newKey = generateKeyPair(bits, {
      onStep: (stepInfo) => {
        trace.push(stepInfo);
      }
    });

    this.currentKey = newKey;

    if (!this.memory) {
      try {
        const serialized = serializePrivateKey(newKey);
        await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
        const tempPath = `${this.filePath}.tmp.${Date.now()}`;
        await fs.promises.writeFile(tempPath, JSON.stringify(serialized, null, 2), 'utf8');
        await fs.promises.rename(tempPath, this.filePath);
      } catch (err) {
        console.error('Gagal menyimpan server-keys.json:', err);
      }
    }

    return {
      pubkey: this.getPublic(),
      trace
    };
  }
}
