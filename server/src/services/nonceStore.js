export class NonceStore {
  constructor(defaultTtlMs = 10 * 60 * 1000) {
    this.defaultTtlMs = defaultTtlMs;
    this.nonces = new Map();

    // Pembersihan periodik berkala
    this.intervalId = setInterval(() => {
      this.cleanup();
    }, 60000);

    // Agar interval tidak menahan event loop proses keluar
    if (this.intervalId && typeof this.intervalId.unref === 'function') {
      this.intervalId.unref();
    }
  }

  has(nonce) {
    this.cleanup();
    return this.nonces.has(nonce);
  }

  add(nonce, ttlMs = this.defaultTtlMs) {
    const expiresAt = Date.now() + ttlMs;
    this.nonces.set(nonce, expiresAt);
  }

  cleanup() {
    const now = Date.now();
    for (const [nonce, expiresAt] of this.nonces.entries()) {
      if (now > expiresAt) {
        this.nonces.delete(nonce);
      }
    }
  }

  close() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}
