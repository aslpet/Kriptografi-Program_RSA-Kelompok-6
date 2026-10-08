import { maskPhone, maskPin } from '@topup/shared';

export function redact(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map(item => redact(item));
  }

  const out = {};
  for (const [k, v] of Object.entries(data)) {
    const keyLower = k.toLowerCase();
    if (keyLower === 'pin') {
      out[k] = maskPin(v);
    } else if (keyLower === 'payno') {
      out[k] = maskPhone(String(v));
    } else if (['p', 'q', 'phi', 'd'].includes(keyLower)) {
      // Hilangkan kunci privat dari log
      out[k] = '[DIRAHASIAKAN]';
    } else if (typeof v === 'object' && v !== null) {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export class ServerLogger {
  constructor(maxEntries = 200) {
    this.maxEntries = maxEntries;
    this.entries = [];
    this.currentId = 0;
  }

  log(level, msg, meta = {}) {
    this.currentId++;
    const entry = {
      id: this.currentId,
      ts: Date.now(),
      level,
      msg,
      meta: redact(meta)
    };

    this.entries.push(entry);
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
    return entry;
  }

  info(msg, meta) {
    return this.log('info', msg, meta);
  }

  warn(msg, meta) {
    return this.log('warn', msg, meta);
  }

  error(msg, meta) {
    return this.log('error', msg, meta);
  }

  getEntries(afterId = 0) {
    const after = Number(afterId) || 0;
    const filtered = this.entries.filter(e => e.id > after);
    return {
      entries: filtered,
      lastId: this.entries.length > 0 ? this.entries[this.entries.length - 1].id : after
    };
  }
}
