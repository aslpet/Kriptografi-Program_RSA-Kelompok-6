import React from 'react';
import { NavLink } from 'react-router-dom';
import { useServerKey } from '../context/ServerKeyContext.jsx';
import { useCryptoLog } from '../context/CryptoLogContext.jsx';
import { Icon } from './Icon.jsx';

export function Navbar() {
  const { fingerprint, bits } = useServerKey();
  const { dockOpen, setDockOpen } = useCryptoLog();

  return (
    <header style={{
      height: '56px',
      backgroundColor: 'var(--surface)',
      borderBottom: '1px solid var(--line)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 500
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            backgroundColor: 'var(--accent)',
            borderRadius: 'var(--radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--on-accent)',
            fontWeight: 900,
            fontFamily: 'var(--font-head)'
          }}>
            ◆
          </div>
          <span style={{
            fontFamily: 'var(--font-head)',
            fontWeight: 800,
            fontSize: '18px',
            letterSpacing: '0.04em',
            color: 'var(--text)'
          }}>
            LAPAK DIAMOND
          </span>
        </NavLink>

        <nav style={{ display: 'flex', gap: '16px', fontSize: '13px', fontWeight: 600 }}>
          <NavLink
            to="/"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              transition: 'color var(--dur)'
            })}
          >
            Beranda
          </NavLink>
          <NavLink
            to="/keys"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              transition: 'color var(--dur)'
            })}
          >
            Kunci Server
          </NavLink>
          <NavLink
            to="/playground"
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--muted)',
              transition: 'color var(--dur)'
            })}
          >
            Playground RSA
          </NavLink>
        </nav>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {fingerprint && (
          <NavLink
            to="/keys"
            title={`Fingerprint Kunci Server: ${fingerprint} (16 hex awal dari SHA-256(modulus n)). Berubah saat kunci server di-generate ulang. Klik untuk kelola kunci.`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--line)',
              borderRadius: 'var(--radius)',
              padding: '4px 10px',
              textDecoration: 'none',
              transition: 'border-color var(--dur)'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--line)')}
          >
            <Icon name="key" size={14} color="var(--accent)" />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
              <span style={{ fontSize: '9px', color: 'var(--muted)', fontWeight: 700, letterSpacing: '0.04em' }}>
                KUNCI SERVER
              </span>
              <span className="mono" style={{ fontSize: '11px', color: 'var(--text)' }}>
                {bits}-bit <span style={{ color: 'var(--accent)', fontWeight: 600 }}>#{fingerprint.slice(0, 8)}</span>
              </span>
            </div>
          </NavLink>
        )}

        <button
          onClick={() => setDockOpen(!dockOpen)}
          className="btn-secondary"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            borderColor: dockOpen ? 'var(--accent)' : 'var(--line)'
          }}
        >
          <Icon name="terminal" size={14} color={dockOpen ? 'var(--accent)' : 'var(--muted)'} />
          <span>Panel Kripto</span>
        </button>
      </div>
    </header>
  );
}
