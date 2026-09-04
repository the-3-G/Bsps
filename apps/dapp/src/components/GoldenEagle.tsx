import React from 'react';

export function GoldenEagle({
  className = '',
  style = {},
  width = 240,
  height = 95,
}: {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <svg
      viewBox="0 0 340 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        width,
        height,
        maxWidth: '100%',
        display: 'block',
        margin: '0 auto',
        ...style,
      }}
    >
      {/* Golden Eagle Graphic Silhouette */}
      <g fill="#FFD34D">
        {/* Head & Beak Profile */}
        <path d="M162 30 C160 25, 163 18, 168 15 C172 13, 175 15, 176 19 C179 17, 182 18, 182 23 C182 28, 177 34, 170 34 Z" />
        <path d="M160 20 Q153 22 150 26 Q156 28 162 26 Z" />
        <circle cx="167" cy="20" r="1.8" fill="#0A192F" />

        {/* ── TOP HORIZONTAL WING BARS ── */}
        {/* Left Wing Top Bar */}
        <path d="M28 42 L160 42 L160 47 L30 47 Q24 44 28 42 Z" />
        {/* Right Wing Top Bar */}
        <path d="M180 42 L312 42 Q316 44 310 47 L180 47 L180 42 Z" />

        {/* ── SECOND HORIZONTAL WING BARS ── */}
        <path d="M36 50 L160 50 L160 55 L42 55 L36 50 Z" />
        <path d="M180 50 L304 50 L298 55 L180 55 Z" />

        {/* ── THIRD HORIZONTAL WING BARS ── */}
        <path d="M48 58 L160 58 L160 63 L56 63 L48 58 Z" />
        <path d="M180 58 L292 58 L284 63 L180 63 Z" />

        {/* ── FOURTH HORIZONTAL WING BARS ── */}
        <path d="M62 66 L160 66 L160 71 L72 71 L62 66 Z" />
        <path d="M180 66 L278 66 L268 71 L180 71 Z" />

        {/* ── FIFTH HORIZONTAL WING BARS ── */}
        <path d="M80 74 L160 74 L160 79 L92 79 L80 74 Z" />
        <path d="M180 74 L260 74 L248 79 L180 79 Z" />

        {/* ── FLIGHT FEATHER SLITS (ROW 1 Left) ── */}
        <rect x="40" y="44" width="7" height="3" rx="1" />
        <rect x="52" y="44" width="7" height="3" rx="1" />
        <rect x="64" y="44" width="7" height="3" rx="1" />
        <rect x="76" y="44" width="7" height="3" rx="1" />
        <rect x="88" y="44" width="7" height="3" rx="1" />
        <rect x="100" y="44" width="7" height="3" rx="1" />
        <rect x="112" y="44" width="7" height="3" rx="1" />
        <rect x="124" y="44" width="7" height="3" rx="1" />
        <rect x="136" y="44" width="7" height="3" rx="1" />
        <rect x="148" y="44" width="7" height="3" rx="1" />

        {/* ── FLIGHT FEATHER SLITS (ROW 1 Right) ── */}
        <rect x="185" y="44" width="7" height="3" rx="1" />
        <rect x="197" y="44" width="7" height="3" rx="1" />
        <rect x="209" y="44" width="7" height="3" rx="1" />
        <rect x="221" y="44" width="7" height="3" rx="1" />
        <rect x="233" y="44" width="7" height="3" rx="1" />
        <rect x="245" y="44" width="7" height="3" rx="1" />
        <rect x="257" y="44" width="7" height="3" rx="1" />
        <rect x="269" y="44" width="7" height="3" rx="1" />
        <rect x="281" y="44" width="7" height="3" rx="1" />
        <rect x="293" y="44" width="7" height="3" rx="1" />

        {/* ── FLIGHT FEATHER SLITS (ROW 2 Left) ── */}
        <rect x="50" y="52" width="7" height="3" rx="1" />
        <rect x="62" y="52" width="7" height="3" rx="1" />
        <rect x="74" y="52" width="7" height="3" rx="1" />
        <rect x="86" y="52" width="7" height="3" rx="1" />
        <rect x="98" y="52" width="7" height="3" rx="1" />
        <rect x="110" y="52" width="7" height="3" rx="1" />
        <rect x="122" y="52" width="7" height="3" rx="1" />
        <rect x="134" y="52" width="7" height="3" rx="1" />
        <rect x="146" y="52" width="7" height="3" rx="1" />

        {/* ── FLIGHT FEATHER SLITS (ROW 2 Right) ── */}
        <rect x="187" y="52" width="7" height="3" rx="1" />
        <rect x="199" y="52" width="7" height="3" rx="1" />
        <rect x="211" y="52" width="7" height="3" rx="1" />
        <rect x="223" y="52" width="7" height="3" rx="1" />
        <rect x="235" y="52" width="7" height="3" rx="1" />
        <rect x="247" y="52" width="7" height="3" rx="1" />
        <rect x="259" y="52" width="7" height="3" rx="1" />
        <rect x="271" y="52" width="7" height="3" rx="1" />
        <rect x="283" y="52" width="7" height="3" rx="1" />

        {/* ── FLIGHT FEATHER SLITS (ROW 3 Left) ── */}
        <rect x="62" y="60" width="7" height="3" rx="1" />
        <rect x="74" y="60" width="7" height="3" rx="1" />
        <rect x="86" y="60" width="7" height="3" rx="1" />
        <rect x="98" y="60" width="7" height="3" rx="1" />
        <rect x="110" y="60" width="7" height="3" rx="1" />
        <rect x="122" y="60" width="7" height="3" rx="1" />
        <rect x="134" y="60" width="7" height="3" rx="1" />
        <rect x="146" y="60" width="7" height="3" rx="1" />

        {/* ── FLIGHT FEATHER SLITS (ROW 3 Right) ── */}
        <rect x="187" y="60" width="7" height="3" rx="1" />
        <rect x="199" y="60" width="7" height="3" rx="1" />
        <rect x="211" y="60" width="7" height="3" rx="1" />
        <rect x="223" y="60" width="7" height="3" rx="1" />
        <rect x="235" y="60" width="7" height="3" rx="1" />
        <rect x="247" y="60" width="7" height="3" rx="1" />
        <rect x="259" y="60" width="7" height="3" rx="1" />
        <rect x="271" y="60" width="7" height="3" rx="1" />

        {/* ── EAGLE TORSO & BREAST ── */}
        <path d="M160 34 Q170 34 180 34 L177 82 Q170 88 163 82 Z" />
        {/* Scalloped chest feathers */}
        <path d="M163 42 Q170 45 177 42 L176 49 Q170 52 164 49 Z" opacity="0.9" />
        <path d="M164 51 Q170 54 176 51 L175 58 Q170 61 165 58 Z" opacity="0.9" />
        <path d="M165 60 Q170 63 175 60 L174 67 Q170 70 166 67 Z" opacity="0.9" />
        <path d="M166 69 Q170 72 174 69 L173 76 Q170 79 167 76 Z" opacity="0.9" />

        {/* ── TAIL FEATHERS ── */}
        <path d="M160 84 L148 106 L156 107 L164 88 Z" />
        <path d="M163 86 L159 111 L166 112 L168 88 Z" />
        <path d="M168 88 L170 114 L176 113 L173 88 Z" />
        <path d="M172 88 L174 111 L181 111 L177 86 Z" />
        <path d="M176 84 L184 107 L192 106 L180 84 Z" />

        {/* ── TALONS & LAUREL BRANCH ── */}
        <ellipse cx="158" cy="85" rx="4" ry="3" />
        <ellipse cx="182" cy="85" rx="4" ry="3" />
        <path
          d="M140 90 Q170 96 200 90"
          stroke="#FFD34D"
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Branch / Leaves */}
        <path d="M142 88 Q146 84 150 88" stroke="#FFD34D" strokeWidth="2" fill="none" />
        <path d="M148 93 Q152 97 156 93" stroke="#FFD34D" strokeWidth="2" fill="none" />
        <path d="M184 93 Q188 97 192 93" stroke="#FFD34D" strokeWidth="2" fill="none" />
        <path d="M190 88 Q194 84 198 88" stroke="#FFD34D" strokeWidth="2" fill="none" />
      </g>
    </svg>
  );
}
