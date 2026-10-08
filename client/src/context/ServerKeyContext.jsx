import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { parsePublicKey } from '@topup/rsa';
import { request } from '../lib/api.js';

const ServerKeyContext = createContext(null);

export function ServerKeyProvider({ children }) {
  const [pubHex, setPubHex] = useState(null);
  const [pubBig, setPubBig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await request('/api/server/pubkey');
      setPubHex(data);
      setPubBig(parsePublicKey(data));
    } catch (err) {
      setError(err.message || 'Gagal mengambil kunci publik server');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ServerKeyContext.Provider
      value={{
        pubHex,
        pubBig,
        fingerprint: pubHex?.fingerprint || null,
        bits: pubHex?.bits || null,
        loading,
        error,
        refresh
      }}
    >
      {children}
    </ServerKeyContext.Provider>
  );
}

export function useServerKey() {
  const ctx = useContext(ServerKeyContext);
  if (!ctx) {
    throw new Error('useServerKey harus digunakan di dalam ServerKeyProvider');
  }
  return ctx;
}
