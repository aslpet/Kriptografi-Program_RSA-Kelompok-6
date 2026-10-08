import { findGame, findItem, findMethod } from '../data/catalog.js';
import { validateField, validateDigits } from '@topup/shared';

export function validatePayload(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: [{ field: 'payload', message: 'Payload harus berupa objek JSON' }] };
  }

  if (payload.v !== 1) {
    errors.push({ field: 'v', message: 'Versi payload tidak didukung (harus v=1)' });
  }

  const game = findGame(payload.game);
  if (!game) {
    errors.push({ field: 'game', message: `Game dengan ID '${payload.game}' tidak ditemukan dalam katalog` });
  }

  const item = findItem(game, payload.item);
  if (!item) {
    errors.push({ field: 'item', message: `Item dengan ID '${payload.item}' tidak ditemukan pada game ini` });
  }

  const method = findMethod(payload.method);
  if (!method) {
    errors.push({ field: 'method', message: `Metode pembayaran '${payload.method}' tidak valid` });
  }

  // Validasi field akun game sesuai game.fields
  if (game && Array.isArray(game.fields)) {
    for (const field of game.fields) {
      if (typeof field === 'string') {
        const err = validateField(field, payload[field]);
        if (err) {
          errors.push({ field, message: err });
        }
      } else if (field && field.key) {
        const err = validateDigits(payload[field.key], field);
        if (err) {
          errors.push({ field: field.key, message: err });
        }
      }
    }
  }

  // Validasi data pembayaran
  if (method) {
    if (method.id === 'ewallet') {
      const err = validateField('payNo', payload.payNo);
      if (err) errors.push({ field: 'payNo', message: err });
    } else if (method.id === 'saldo') {
      const err = validateField('pin', payload.pin);
      if (err) errors.push({ field: 'pin', message: err });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    game,
    item,
    method
  };
}
