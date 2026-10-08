import React from 'react';
import { Link } from 'react-router-dom';

function GameCover({ gameId }) {
  if (gameId === 'abl') {
    // Arena of Blades - Flat Vector Icon
    return (
      <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%', display: 'block', backgroundColor: '#181f2c' }}>
        <rect width="200" height="120" fill="#181f2c" />
        {/* Shield */}
        <path d="M100 25 L135 40 L135 75 Q100 100 100 100 Q65 75 65 75 L65 40 Z" fill="#232d3f" stroke="#f2a93b" strokeWidth="2.5" />
        {/* Crossed Swords */}
        <line x1="80" y1="45" x2="120" y2="85" stroke="#f2a93b" strokeWidth="3" strokeLinecap="round" />
        <line x1="120" y1="45" x2="80" y2="85" stroke="#f2a93b" strokeWidth="3" strokeLinecap="round" />
        <circle cx="100" cy="65" r="4" fill="#ffffff" />
      </svg>
    );
  }

  // Pixel Racers - Flat Vector Icon
  return (
    <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%', display: 'block', backgroundColor: '#1e241c' }}>
      <rect width="200" height="120" fill="#1e241c" />
      {/* Checkered flag accents */}
      <rect x="30" y="25" width="10" height="10" fill="#f2a93b" />
      <rect x="40" y="25" width="10" height="10" fill="#2d362a" />
      <rect x="30" y="35" width="10" height="10" fill="#2d362a" />
      <rect x="40" y="35" width="10" height="10" fill="#f2a93b" />
      {/* Sports car silhouette */}
      <path d="M60 75 L75 55 L130 55 L150 75 L165 75 L165 85 L35 85 L35 75 Z" fill="#f2a93b" />
      {/* Wheels */}
      <circle cx="65" cy="85" r="8" fill="#111610" stroke="#f2a93b" strokeWidth="2" />
      <circle cx="135" cy="85" r="8" fill="#111610" stroke="#f2a93b" strokeWidth="2" />
    </svg>
  );
}

export function GameCard({ game }) {
  return (
    <Link
      to={`/game/${game.id}`}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--radius)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'border-color var(--dur) var(--ease), transform var(--dur) var(--ease)'
      }}
      className="game-card"
    >
      <div style={{ height: '130px', width: '100%', borderBottom: '1px solid var(--line)' }}>
        <GameCover gameId={game.id} />
      </div>
      <div style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '4px' }}>
          {game.name}
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>
          Top up resmi {game.currencyName} instan
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="badge badge-accent">
            {game.items.length} Pilihan Nominal
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--accent)' }}>
            Pilih →
          </span>
        </div>
      </div>
    </Link>
  );
}
