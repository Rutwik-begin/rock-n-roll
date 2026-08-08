import React from 'react';

export default function EqualizerIcon({ size = 16, color = 'var(--accent)' }) {
  return (
    <div className="equalizer-bars" style={{ width: size, height: size }}>
      <span className="bar bar-1" style={{ backgroundColor: color }}></span>
      <span className="bar bar-2" style={{ backgroundColor: color }}></span>
      <span className="bar bar-3" style={{ backgroundColor: color }}></span>
    </div>
  );
}
