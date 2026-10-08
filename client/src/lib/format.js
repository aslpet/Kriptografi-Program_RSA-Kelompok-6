const idrFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

export function rupiah(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Rp 0';
  return idrFormatter.format(amount);
}

export function truncHex(hex, head = 12, tail = 8) {
  if (typeof hex !== 'string') return '';
  if (hex.length <= head + tail) return hex;
  return `${hex.slice(0, head)}...${hex.slice(-tail)}`;
}

export function formatTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function formatDateTime(ts) {
  if (!ts) return '-';
  const d = new Date(ts);
  return d.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'medium'
  });
}
