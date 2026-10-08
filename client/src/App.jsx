import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ServerKeyProvider } from './context/ServerKeyContext.jsx';
import { CryptoLogProvider } from './context/CryptoLogContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { CryptoDock } from './components/CryptoDock.jsx';

import { Home } from './views/Home.jsx';
import { Game } from './views/Game.jsx';
import { Receipt } from './views/Receipt.jsx';
import { Keys } from './views/Keys.jsx';
import { Playground } from './views/Playground.jsx';

import { useCryptoLog } from './context/CryptoLogContext.jsx';

function AppLayout() {
  const { dockOpen, dockHeight } = useCryptoLog();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: dockOpen ? `${dockHeight + 20}px` : '44px',
        transition: 'padding-bottom 0.15s ease'
      }}
    >
      <Navbar />
      <div style={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/game/:id" element={<Game />} />
          <Route path="/receipt/:id" element={<Receipt />} />
          <Route path="/keys" element={<Keys />} />
          <Route path="/playground" element={<Playground />} />
        </Routes>
      </div>
      <CryptoDock />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ServerKeyProvider>
        <CryptoLogProvider>
          <AppLayout />
        </CryptoLogProvider>
      </ServerKeyProvider>
    </BrowserRouter>
  );
}
