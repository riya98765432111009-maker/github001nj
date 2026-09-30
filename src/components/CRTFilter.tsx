import React from 'react';

interface CRTFilterProps {
  enabled: boolean;
}

export const CRTFilter: React.FC<CRTFilterProps> = ({ enabled }) => {
  if (!enabled) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden mix-blend-overlay"
      aria-hidden="true"
    >
      {/* Scanline horizontal grid */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0px, rgba(0, 0, 0, 0.5) 1px, transparent 1px, transparent 2px)',
          backgroundSize: '100% 2px',
        }}
      />
      {/* CRT Vignette & Screen curve shadow */}
      <div
        className="absolute inset-0"
        style={{
          boxShadow: 'inset 0 0 100px rgba(0, 0, 0, 0.8)',
        }}
      />
    </div>
  );
};
