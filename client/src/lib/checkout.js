import {
  encryptText,
  parsePublicKey,
  randomBytes,
  bytesToHex
} from '@topup/rsa';
import { request } from './api.js';
import { saveReceiptLocal } from './receiptStore.js';

export function buildPayload(form) {
  const nonceBytes = randomBytes(8);
  const nonce = bytesToHex(nonceBytes);
  const ts = Date.now();

  const payload = {
    v: 1,
    game: form.gameId,
    item: form.itemId,
    playerId: form.playerId.trim(),
    method: form.method,
    nonce,
    ts
  };

  if (form.zoneId) {
    payload.zoneId = form.zoneId.trim();
  }

  if (form.method === 'ewallet') {
    payload.payNo = form.payNo.trim();
  } else if (form.method === 'saldo') {
    payload.pin = form.pin.trim();
  }

  return payload;
}

export async function executeCheckout(form, { onLog, setLastPacket }) {
  // 1. Ambil kunci publik server terbaru (menjamin tidak ada desinkronisasi kunci)
  const pubHex = await request('/api/server/pubkey');
  const pubBig = parsePublicKey(pubHex);

  // 2. Susun payload checkout
  const payloadObj = buildPayload(form);
  const plaintext = JSON.stringify(payloadObj);

  // 3. Enkripsi di browser dengan RSA
  const blockDetails = [];
  const t0 = performance.now();
  const blocks = encryptText(plaintext, pubBig, {
    onStep: (stepInfo) => {
      blockDetails.push(stepInfo);
      if (onLog) {
        onLog({
          kind: 'encrypt',
          title: `Enkripsi RSA Blok ${stepInfo.blockIndex}/${stepInfo.totalBlocks}`,
          values: stepInfo
        });
      }
    }
  });
  const encryptDurationMs = Math.round(performance.now() - t0);

  // 4. Simpan paket untuk Network Inspector & tombol replay
  if (setLastPacket) {
    setLastPacket({
      plaintext,
      blocks,
      blockDetails,
      bits: pubHex.bits,
      fingerprint: pubHex.fingerprint,
      durationMs: encryptDurationMs,
      ts: payloadObj.ts
    });
  }

  if (onLog) {
    onLog({
      kind: 'network',
      title: `Mengirimkan ${blocks.length} blok ciphertext ke /api/checkout`,
      values: {
        totalBlocks: blocks.length,
        fingerprint: pubHex.fingerprint,
        durationMs: encryptDurationMs
      }
    });
  }

  // 5. Kirim ke backend server
  const response = await request('/api/checkout', {
    method: 'POST',
    body: { blocks }
  });

  // 6. Simpan hasil struk ke sessionStorage
  saveReceiptLocal(response.order.id, response);

  if (onLog) {
    onLog({
      kind: 'receipt',
      title: `Checkout Berhasil: ${response.order.id}`,
      values: {
        amount: response.receipt.amount,
        signature: response.signature.slice(0, 16) + '...'
      }
    });
  }

  return response;
}
