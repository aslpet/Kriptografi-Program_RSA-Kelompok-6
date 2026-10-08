/**
 * Modul aritmetika matematika RSA: GCD, Extended Euclidean Algorithm,
 * Invers Modular, dan Perpangkatan Modular (Square-and-Multiply).
 * Ditulis manual menggunakan BigInt murni.
 */

export function gcd(a, b) {
  if (typeof a !== 'bigint' || typeof b !== 'bigint') {
    throw new TypeError('Argumen harus berupa BigInt');
  }
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y !== 0n) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x;
}

export function egcd(a, b) {
  if (typeof a !== 'bigint' || typeof b !== 'bigint') {
    throw new TypeError('Argumen harus berupa BigInt');
  }
  let [oldR, r] = [a, b];
  let [oldS, s] = [1n, 0n];
  let [oldT, t] = [0n, 1n];

  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
    [oldT, t] = [t, oldT - q * t];
  }

  return { g: oldR, x: oldS, y: oldT };
}

export function modInv(a, m) {
  if (typeof a !== 'bigint' || typeof m !== 'bigint') {
    throw new TypeError('Argumen harus berupa BigInt');
  }
  if (m <= 0n) {
    throw new RangeError('Modulus m harus lebih besar dari 0');
  }
  const normalizedA = ((a % m) + m) % m;
  const { g, x } = egcd(normalizedA, m);
  if (g !== 1n) {
    throw new Error(`Tidak memiliki invers modular (gcd(${a}, ${m}) = ${g} ≠ 1)`);
  }
  return ((x % m) + m) % m;
}

export function modPow(base, exp, mod) {
  if (typeof base !== 'bigint' || typeof exp !== 'bigint' || typeof mod !== 'bigint') {
    throw new TypeError('Argumen harus berupa BigInt');
  }
  if (mod <= 0n) {
    throw new RangeError('Modulus harus positif (> 0)');
  }
  if (mod === 1n) return 0n;
  if (exp < 0n) {
    throw new RangeError('Eksponen negatif tidak didukung secara langsung pada modPow');
  }

  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;

  while (e > 0n) {
    if (e & 1n) {
      result = (result * b) % mod;
    }
    e >>= 1n;
    b = (b * b) % mod;
  }

  return result;
}

/**
 * Menghasilkan tabel jejak langkah Extended Euclidean untuk mode edukasi UI.
 */
export function egcdTrace(a, b) {
  if (typeof a !== 'bigint' || typeof b !== 'bigint') {
    throw new TypeError('Argumen harus berupa BigInt');
  }
  let [oldR, r] = [a, b];
  let [oldS, s] = [1n, 0n];
  let [oldT, t] = [0n, 1n];
  const steps = [];

  let stepNum = 0;
  steps.push({
    step: stepNum++,
    q: '-',
    r: oldR.toString(),
    s: oldS.toString(),
    t: oldT.toString()
  });

  steps.push({
    step: stepNum++,
    q: '-',
    r: r.toString(),
    s: s.toString(),
    t: t.toString()
  });

  while (r !== 0n) {
    const q = oldR / r;
    const newR = oldR - q * r;
    const newS = oldS - q * s;
    const newT = oldT - q * t;

    oldR = r; r = newR;
    oldS = s; s = newS;
    oldT = t; t = newT;

    steps.push({
      step: stepNum++,
      q: q.toString(),
      r: r.toString(),
      s: s.toString(),
      t: t.toString()
    });
  }

  return {
    g: oldR,
    x: oldS,
    y: oldT,
    trace: steps
  };
}

/**
 * Menghasilkan jejak square-and-multiply untuk Playground mode edukasi.
 */
export function modPowTrace(base, exp, mod) {
  if (mod <= 0n) throw new RangeError('Modulus harus positif');
  if (exp < 0n) throw new RangeError('Eksponen tidak boleh negatif');
  if (exp > 0xffffffffffffffffn) {
    throw new RangeError('Eksponen terlalu besar untuk pembuatan trace langkah demi langkah (> 64-bit)');
  }

  const steps = [];
  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp;
  let bitIndex = 0;

  while (e > 0n) {
    const isOne = (e & 1n) === 1n;
    const prevResult = result;
    if (isOne) {
      result = (result * b) % mod;
    }
    steps.push({
      bitIndex,
      bit: isOne ? 1 : 0,
      base: b.toString(),
      prevResult: prevResult.toString(),
      result: result.toString(),
      action: isOne ? 'Multiply & Square' : 'Square'
    });
    e >>= 1n;
    b = (b * b) % mod;
    bitIndex++;
  }

  return {
    result,
    steps
  };
}
