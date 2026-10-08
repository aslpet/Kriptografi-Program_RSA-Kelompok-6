import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from '../paths.js';

function formatLocalDate(ts = Date.now()) {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

export class OrderStore {
  constructor({ memory = false, filePath } = {}) {
    this.memory = memory;
    this.filePath = filePath || path.join(DATA_DIR, 'orders.json');
    this.orders = new Map();
    this.dailyCounts = new Map();
    this.writeQueue = Promise.resolve();

    this.init();
  }

  init() {
    if (this.memory) return;

    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item && item.id) {
              this.orders.set(item.id, item);
              const match = item.id.match(/^TRX-(\d{8})-(\d{4})$/);
              if (match) {
                const dateKey = match[1];
                const seq = parseInt(match[2], 10);
                const currentMax = this.dailyCounts.get(dateKey) || 0;
                if (seq > currentMax) {
                  this.dailyCounts.set(dateKey, seq);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Gagal membaca orders.json, memulai dengan penyimpanan kosong:', err);
      }
    }
  }

  /**
   * Mereservasi order ID secara sinkron untuk mencegah tabrakan ID pada permintaan paralel.
   */
  reserveId(ts = Date.now()) {
    const dateKey = formatLocalDate(ts);
    const nextSeq = (this.dailyCounts.get(dateKey) || 0) + 1;
    this.dailyCounts.set(dateKey, nextSeq);
    return `TRX-${dateKey}-${String(nextSeq).padStart(4, '0')}`;
  }

  async save(order) {
    if (!order || !order.id) {
      throw new Error('Order harus memiliki id');
    }
    this.orders.set(order.id, order);

    if (this.memory) return order;

    // Antrean penulisan file berantai yang aman
    this.writeQueue = this.writeQueue.then(async () => {
      try {
        const list = Array.from(this.orders.values());
        const tempPath = `${this.filePath}.tmp.${Date.now()}`;
        await fs.promises.mkdir(path.dirname(this.filePath), { recursive: true });
        await fs.promises.writeFile(tempPath, JSON.stringify(list, null, 2), 'utf8');
        await fs.promises.rename(tempPath, this.filePath);
      } catch (err) {
        console.error('Gagal menyimpan orders.json:', err);
      }
    });

    await this.writeQueue;
    return order;
  }

  get(id) {
    return this.orders.get(id) || null;
  }

  snapshot() {
    return Array.from(this.orders.values());
  }
}
