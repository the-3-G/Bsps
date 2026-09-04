import React from 'react';

export function GoldenEagle({
  className = '',
  style = {},
  width = 280,
  height = 95,
}: {
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
}) {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        width,
        height,
        maxWidth: '100%',
        display: 'block',
        margin: '0 auto',
        filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))',
        ...style,
      }}
    >
      <g fill="#FFD34D">
        {/* ── 1. EAGLE HEAD & NECK (Facing Left) ── */}
        {/* Crown & Head Profile */}
        <path d="M 194 28 C 190 20, 194 13, 201 10 C 206 8, 210 10, 212 14 C 215 12, 219 13, 219 18 C 219 23, 213 29, 204 29 Z" />
        {/* Hooked Beak */}
        <path d="M 192 16 C 183 17, 180 22, 182 25 C 185 24, 189 23, 194 23 Z" />
        {/* Eye cutout */}
        <circle cx="200" cy="16" r="1.8" fill="#07152B" />

        {/* ── 2. UPPER WING SOLID BARS ── */}
        {/* Left Wing Top Bar */}
        <path d="M 30 36 L 192 36 L 192 41 L 32 41 C 28 39, 28 37, 30 36 Z" />
        {/* Right Wing Top Bar */}
        <path d="M 208 36 L 370 36 C 372 37, 372 39, 368 41 L 208 41 Z" />

        {/* ── 3. LEFT WING FEATHER TIER 1 (Top Slots) ── */}
        <rect x="42" y="44" width="7" height="4" rx="1" />
        <rect x="54" y="44" width="7" height="4" rx="1" />
        <rect x="66" y="44" width="7" height="4" rx="1" />
        <rect x="78" y="44" width="7" height="4" rx="1" />
        <rect x="90" y="44" width="7" height="4" rx="1" />
        <rect x="102" y="44" width="7" height="4" rx="1" />
        <rect x="114" y="44" width="7" height="4" rx="1" />
        <rect x="126" y="44" width="7" height="4" rx="1" />
        <rect x="138" y="44" width="7" height="4" rx="1" />
        <rect x="150" y="44" width="7" height="4" rx="1" />
        <rect x="162" y="44" width="7" height="4" rx="1" />
        <rect x="174" y="44" width="7" height="4" rx="1" />

        {/* ── 3. RIGHT WING FEATHER TIER 1 (Top Slots) ── */}
        <rect x="219" y="44" width="7" height="4" rx="1" />
        <rect x="231" y="44" width="7" height="4" rx="1" />
        <rect x="243" y="44" width="7" height="4" rx="1" />
        <rect x="255" y="44" width="7" height="4" rx="1" />
        <rect x="267" y="44" width="7" height="4" rx="1" />
        <rect x="279" y="44" width="7" height="4" rx="1" />
        <rect x="291" y="44" width="7" height="4" rx="1" />
        <rect x="303" y="44" width="7" height="4" rx="1" />
        <rect x="315" y="44" width="7" height="4" rx="1" />
        <rect x="327" y="44" width="7" height="4" rx="1" />
        <rect x="339" y="44" width="7" height="4" rx="1" />
        <rect x="351" y="44" width="7" height="4" rx="1" />

        {/* ── 4. MIDDLE HORIZONTAL BARS ── */}
        <path d="M 46 51 L 192 51 L 192 54 L 48 54 Z" />
        <path d="M 208 51 L 354 51 L 352 54 L 208 54 Z" />

        {/* ── 5. LEFT WING FEATHER TIER 2 (Middle Slots) ── */}
        <rect x="52" y="57" width="7" height="4.5" rx="1" />
        <rect x="64" y="57" width="7" height="4.5" rx="1" />
        <rect x="76" y="57" width="7" height="4.5" rx="1" />
        <rect x="88" y="57" width="7" height="4.5" rx="1" />
        <rect x="100" y="57" width="7" height="4.5" rx="1" />
        <rect x="112" y="57" width="7" height="4.5" rx="1" />
        <rect x="124" y="57" width="7" height="4.5" rx="1" />
        <rect x="136" y="57" width="7" height="4.5" rx="1" />
        <rect x="148" y="57" width="7" height="4.5" rx="1" />
        <rect x="160" y="57" width="7" height="4.5" rx="1" />
        <rect x="172" y="57" width="7" height="4.5" rx="1" />

        {/* ── 5. RIGHT WING FEATHER TIER 2 (Middle Slots) ── */}
        <rect x="221" y="57" width="7" height="4.5" rx="1" />
        <rect x="233" y="57" width="7" height="4.5" rx="1" />
        <rect x="245" y="57" width="7" height="4.5" rx="1" />
        <rect x="257" y="57" width="7" height="4.5" rx="1" />
        <rect x="269" y="57" width="7" height="4.5" rx="1" />
        <rect x="281" y="57" width="7" height="4.5" rx="1" />
        <rect x="293" y="57" width="7" height="4.5" rx="1" />
        <rect x="305" y="57" width="7" height="4.5" rx="1" />
        <rect x="317" y="57" width="7" height="4.5" rx="1" />
        <rect x="329" y="57" width="7" height="4.5" rx="1" />
        <rect x="341" y="57" width="7" height="4.5" rx="1" />

        {/* ── 6. LOWER HORIZONTAL BARS ── */}
        <path d="M 62 64 L 192 64 L 192 67 L 66 67 Z" />
        <path d="M 208 64 L 338 64 L 334 67 L 208 67 Z" />

        {/* ── 7. PRIMARY FLIGHT FEATHERS (LEFT WING) ── */}
        <path d="M 68 70 L 64 78 L 71 78 L 74 70 Z" />
        <path d="M 78 70 L 75 80 L 82 80 L 84 70 Z" />
        <path d="M 88 70 L 86 82 L 93 82 L 94 70 Z" />
        <path d="M 98 70 L 97 84 L 104 84 L 104 70 Z" />
        <path d="M 108 70 L 108 85 L 115 85 L 114 70 Z" />
        <path d="M 118 70 L 119 86 L 126 86 L 124 70 Z" />
        <path d="M 128 70 L 130 87 L 137 87 L 134 70 Z" />
        <path d="M 138 70 L 141 87 L 148 87 L 144 70 Z" />
        <path d="M 148 70 L 152 87 L 159 87 L 154 70 Z" />
        <path d="M 158 70 L 163 87 L 170 87 L 164 70 Z" />
        <path d="M 168 70 L 174 86 L 181 86 L 174 70 Z" />

        {/* ── 7. PRIMARY FLIGHT FEATHERS (RIGHT WING) ── */}
        <path d="M 226 70 L 219 86 L 226 86 L 232 70 Z" />
        <path d="M 236 70 L 230 87 L 237 87 L 242 70 Z" />
        <path d="M 246 70 L 241 87 L 248 87 L 252 70 Z" />
        <path d="M 256 70 L 252 87 L 259 87 L 262 70 Z" />
        <path d="M 266 70 L 263 87 L 270 87 L 272 70 Z" />
        <path d="M 276 70 L 274 86 L 281 86 L 282 70 Z" />
        <path d="M 286 70 L 285 85 L 292 85 L 292 70 Z" />
        <path d="M 296 70 L 296 84 L 303 84 L 302 70 Z" />
        <path d="M 306 70 L 307 82 L 314 82 L 312 70 Z" />
        <path d="M 316 70 L 318 80 L 325 80 L 322 70 Z" />
        <path d="M 326 70 L 329 78 L 336 78 L 332 70 Z" />

        {/* ── 8. EAGLE TORSO & BREAST (Centered) ── */}
        <path d="M 191 30 Q 200 30 209 30 L 206 78 Q 200 84 194 78 Z" />
        {/* Scalloped chest feather scales */}
        <path d="M 194 38 Q 200 41 206 38 L 205 44 Q 200 47 195 44 Z" opacity="0.9" />
        <path d="M 194 46 Q 200 49 206 46 L 205 52 Q 200 55 195 52 Z" opacity="0.9" />
        <path d="M 194 54 Q 200 57 206 54 L 205 60 Q 200 63 195 60 Z" opacity="0.9" />
        <path d="M 195 62 Q 200 65 205 62 L 204 68 Q 200 71 196 68 Z" opacity="0.9" />
        <path d="M 196 70 Q 200 73 204 70 L 203 76 Q 200 79 197 76 Z" opacity="0.9" />

        {/* ── 9. TAIL FEATHERS (5 Fanned Blades) ── */}
        {/* Far Left */}
        <path d="M 192 78 L 178 102 L 186 103 L 195 82 Z" />
        {/* Mid Left */}
        <path d="M 195 80 L 190 107 L 198 108 L 200 84 Z" />
        {/* Center Tail */}
        <path d="M 199 82 L 200 111 L 205 111 L 203 82 Z" />
        {/* Mid Right */}
        <path d="M 202 84 L 204 108 L 212 107 L 207 80 Z" />
        {/* Far Right */}
        <path d="M 207 82 L 216 103 L 224 102 L 210 78 Z" />

        {/* ── 10. TALONS & LAUREL WREATH ── */}
        <circle cx="188" cy="81" r="3.5" />
        <circle cx="214" cy="81" r="3.5" />
        {/* Horizontal Clutch Bar / Branch */}
        <path
          d="M 166 86 Q 200 92 236 86"
          stroke="#FFD34D"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Laurel Leaves left & right */}
        <path d="M 168 84 Q 173 79 178 84" stroke="#FFD34D" strokeWidth="2.5" fill="none" />
        <path d="M 176 89 Q 181 94 186 89" stroke="#FFD34D" strokeWidth="2.5" fill="none" />
        <path d="M 216 89 Q 221 94 226 89" stroke="#FFD34D" strokeWidth="2.5" fill="none" />
        <path d="M 224 84 Q 229 79 234 84" stroke="#FFD34D" strokeWidth="2.5" fill="none" />
      </g>
    </svg>
  );
}
