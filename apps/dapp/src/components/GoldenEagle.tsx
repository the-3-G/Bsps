import React from 'react';

export function GoldenEagle({
  className = '',
  style = {},
  width = 280,
  height = 110,
}: {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <div
      className={className}
      style={{
        width,
        maxWidth: '100%',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <img
        src="/images/golden-eagle.jpg"
        alt="Golden Eagle Emblem"
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: typeof height === 'number' ? height * 1.3 : height,
          objectFit: 'contain',
          mixBlendMode: 'screen',
          filter: 'drop-shadow(0 4px 16px rgba(255, 211, 77, 0.2))',
          display: 'block',
        }}
      />
    </div>
  );
}
