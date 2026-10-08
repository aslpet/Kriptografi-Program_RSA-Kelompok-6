/**
 * Entry point paket @topup/rsa.
 * Mengekspor seluruh antarmuka publik modul RSA tanpa dependensi eksternal.
 */

export {
  bytesToHex,
  hexToBytes,
  bytesToBig,
  bigToBytes,
  bitLength,
  byteLength,
  concat,
  equalBytes,
  utf8Encode,
  utf8Decode
} from './bytes.js';

export {
  randomBytes,
  randomBigInt,
  randomRange,
  randomNonZeroBytes
} from './random.js';

export {
  gcd,
  egcd,
  modInv,
  modPow,
  egcdTrace,
  modPowTrace
} from './math.js';

export {
  SMALL_PRIMES,
  millerRabin,
  isProbablePrime,
  generatePrime,
  assertPrime
} from './prime.js';

export {
  generateKeyPair,
  buildKeyPairFrom
} from './keygen.js';

export {
  serializePublicKey,
  parsePublicKey,
  serializePrivateKey,
  parsePrivateKey,
  fingerprint
} from './keyio.js';

export {
  padEncrypt,
  unpadEncrypt,
  padSign,
  parseSignEM,
  splitBlocks,
  describeEM,
  PaddingError
} from './padding.js';

export {
  sha256,
  sha256Hex
} from './sha256.js';

export {
  canonicalize
} from './canonical.js';

export {
  encryptRaw,
  decryptRaw,
  encryptText,
  decryptText,
  encryptTextbook,
  decryptTextbook,
  signText,
  verifyText
} from './rsa.js';
