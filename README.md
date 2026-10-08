# Lapak Diamond — RSA Top-Up Hub

Aplikasi web toko top-up game bertema kriptografi edukatif dengan implementasi manual algoritma RSA (zero-dependency).

## Fitur Utama
1. **Enkripsi Payload Checkout (Kerahasiaan)**: Payload transaksi (User ID, Zone ID, Nomor HP / PIN) dienkripsi di peramban menggunakan kunci publik server.
2. **Tanda Tangan Digital Struk (Integritas & Otentisitas)**: Struk transaksi ditandatangani server (SHA-256 + RSA), dan dapat diverifikasi langsung di peramban.
3. **Crypto Dock & Network Inspector**: Inspeksi plaintext vs ciphertext, struktur padding PKCS#1 v1.5, serta log langkah dekripsi & verifikasi.
4. **Key Generator**: Pembangkitan kunci 512/1024-bit dengan trace langkah demi langkah dan mode edukasi numerik kecil (misal p=61, q=53).
5. **Playground**: Eksplorasi enkripsi/dekripsi mode textbook dan padding, serta tanda tangan digital mandiri.

## Aturan Implementasi RSA
Modul `@topup/rsa` dibangun **100% manual tanpa library kriptografi pihak ketiga**:
- Menggunakan `BigInt` bawaan bahasa dan `crypto.getRandomValues` (sebagai sumber entropi).
- Algoritma Miller-Rabin, Extended Euclidean, Modular Inversion, Modular Exponentiation, Padding PKCS#1 v1.5, dan SHA-256 seluruhnya ditulis manual.

## Cara Menjalankan

### Persyaratan
- Node.js >= 20 (Direkomendasikan v24+)
- npm >= 10

### Instalasi Dependensi
```bash
npm install
```

### Menjalankan Mode Pengembangan
Menjalankan backend Express (port 3000) dan frontend Vite (port 5173) secara bersamaan:
```bash
npm run dev
```
Buka peramban di `http://localhost:5173`.

### Menjalankan Pengujian (Vitest)
```bash
npm test
```
Memeriksa aturan dependensi RSA:
```bash
npm run check:deps
```

### Menjalankan Mode Produksi (Single Port)
```bash
npm run build
npm start
```
Buka peramban di `http://localhost:3000`.

### Reset Data Demo
```bash
npm run reset-data
```
