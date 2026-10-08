export const catalog = [
  {
    id: 'abl',
    name: 'Arena of Blades',
    currencyName: 'Gems',
    fields: [
      { key: 'playerId', label: 'User ID', min: 6, max: 10, placeholder: 'Contoh: 12345678' },
      { key: 'zoneId',   label: 'Zone ID', min: 4, max: 5,  placeholder: 'Contoh: 2201' }
    ],
    items: [
      { id: 'abl-86',  label: '86 Gems',  price: 20000 },
      { id: 'abl-172', label: '172 Gems', price: 39000 },
      { id: 'abl-257', label: '257 Gems', price: 58000 },
      { id: 'abl-706', label: '706 Gems', price: 155000 }
    ]
  },
  {
    id: 'pxr',
    name: 'Pixel Racers',
    currencyName: 'Coins',
    fields: [
      { key: 'playerId', label: 'User ID', min: 8, max: 12, placeholder: 'Contoh: 100234567' }
    ],
    items: [
      { id: 'pxr-60',  label: '60 Coins',  price: 15000 },
      { id: 'pxr-300', label: '300 Coins', price: 70000 }
    ]
  }
];

export const paymentMethods = [
  { id: 'ewallet', label: 'E-Wallet', needs: 'payNo' },
  { id: 'saldo',   label: 'Saldo Lapak', needs: 'pin' }
];

export function findGame(gameId) {
  return catalog.find(g => g.id === gameId) || null;
}

export function findItem(game, itemId) {
  if (!game || !game.items) return null;
  return game.items.find(i => i.id === itemId) || null;
}

export function findMethod(methodId) {
  return paymentMethods.find(m => m.id === methodId) || null;
}
