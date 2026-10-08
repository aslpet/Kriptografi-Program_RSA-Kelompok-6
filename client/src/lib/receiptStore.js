import { request } from './api.js';

const STORAGE_PREFIX = 'lapak_receipt_';

export function saveReceiptLocal(orderId, data) {
  try {
    sessionStorage.setItem(`${STORAGE_PREFIX}${orderId}`, JSON.stringify(data));
  } catch (err) {
    console.warn('Gagal menyimpan struk ke sessionStorage:', err);
  }
}

export async function getReceipt(orderId) {
  // Cek sessionStorage terlebih dahulu
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${orderId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    // Abaikan error session storage
  }

  // Jika tidak ada di storage, ambil dari endpoint server
  const serverOrder = await request(`/api/orders/${orderId}`);
  saveReceiptLocal(orderId, serverOrder);
  return serverOrder;
}
