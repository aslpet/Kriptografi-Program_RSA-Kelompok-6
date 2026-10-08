import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { request } from '../lib/api.js';

const CryptoLogContext = createContext(null);

export function CryptoLogProvider({ children }) {
  const [clientLogs, setClientLogs] = useState([]);
  const [serverLogs, setServerLogs] = useState([]);
  const [lastPacket, setLastPacket] = useState(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('network');
  const [dockHeight, setDockHeightState] = useState(() => {
    try {
      const saved = Number(localStorage.getItem('lapak_dock_h'));
      if (saved >= 200 && saved <= 900) return saved;
    } catch {}
    return 340;
  });

  const setDockHeight = useCallback((valOrFn) => {
    setDockHeightState(prev => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn;
      try {
        localStorage.setItem('lapak_dock_h', String(next));
      } catch {}
      return next;
    });
  }, []);

  const lastServerIdRef = useRef(0);

  const logClient = useCallback((entry) => {
    const item = {
      id: Date.now() + Math.random(),
      ts: Date.now(),
      ...entry
    };
    setClientLogs(prev => [item, ...prev].slice(0, 300));
  }, []);

  const clearLogs = useCallback(() => {
    setClientLogs([]);
  }, []);

  // Polling log server setiap 2 detik hanya saat dock terbuka dan tab 'logs' aktif
  useEffect(() => {
    if (!dockOpen || activeTab !== 'logs') return;

    let isMounted = true;
    const fetchServerLogs = async () => {
      try {
        const res = await request(`/api/logs?after=${lastServerIdRef.current}`);
        if (isMounted && res?.entries?.length > 0) {
          lastServerIdRef.current = res.lastId;
          setServerLogs(prev => [...prev, ...res.entries].slice(-200));
        }
      } catch (err) {
        // Abaikan error polling
      }
    };

    fetchServerLogs();
    const interval = setInterval(fetchServerLogs, 2000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [dockOpen, activeTab]);

  return (
    <CryptoLogContext.Provider
      value={{
        clientLogs,
        serverLogs,
        log: logClient,
        clear: clearLogs,
        lastPacket,
        setLastPacket,
        dockOpen,
        setDockOpen,
        activeTab,
        setActiveTab,
        dockHeight,
        setDockHeight
      }}
    >
      {children}
    </CryptoLogContext.Provider>
  );
}

export function useCryptoLog() {
  const ctx = useContext(CryptoLogContext);
  if (!ctx) {
    throw new Error('useCryptoLog harus digunakan di dalam CryptoLogProvider');
  }
  return ctx;
}
