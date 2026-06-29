import React from 'react';

const SIZE_CLASS = {
  hero: 'w-full max-w-[300px] lg:max-w-[340px]',
  medium: 'w-full max-w-[240px]',
  sidebar: 'h-11 w-auto max-w-[150px]',
  compact: 'w-full max-w-[180px]',
};

/**
 * Logo com mix-blend-mode: screen para fundo preto do JPEG sumir no tema escuro.
 */
export default function BrandLogo({ size = 'hero', className = '', showGlow = true }) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.hero;

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {showGlow && (
        <div
          className="absolute inset-0 -m-8 rounded-full opacity-50 blur-3xl pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(0,170,255,0.35) 0%, rgba(0,232,122,0.2) 40%, transparent 72%)',
          }}
        />
      )}
      <img
        src="/logo.png"
        alt="Personal Fit Up"
        className={`relative z-10 object-contain ${sizeClass}`}
        style={{
          filter: showGlow ? 'drop-shadow(0 8px 32px rgba(0,170,255,0.2))' : undefined,
        }}
      />
    </div>
  );
}
