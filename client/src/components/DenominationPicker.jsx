import React from 'react';
import { rupiah } from '../lib/format.js';

export function DenominationPicker({ items = [], selectedItemId, onSelect }) {
  return (
    <div className="denom-grid">
      {items.map(item => {
        const isSelected = item.id === selectedItemId;
        return (
          <div
            key={item.id}
            className={`denom-card ${isSelected ? 'is-selected' : ''}`}
            onClick={() => onSelect(item.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(item.id);
              }
            }}
          >
            {isSelected && <div className="denom-check">✓</div>}
            <div className="denom-label">{item.label}</div>
            <div className="denom-price">{rupiah(item.price)}</div>
          </div>
        );
      })}
    </div>
  );
}
