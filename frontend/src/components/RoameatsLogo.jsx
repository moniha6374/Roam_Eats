import React from 'react'

// SVG recreation of the ROAMEATS logo (food truck with steam, orange+green)
export default function RoameatsLogo({ size = 40, showText = true, textSize = 'text-xl' }) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size * 0.85}
        viewBox="0 0 120 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Truck body - green */}
        <rect x="5" y="52" width="90" height="32" rx="4" fill="#7CB342" />
        {/* Truck cab */}
        <path d="M85 52 L85 84 L108 84 L108 64 L98 52 Z" fill="#7CB342" />
        {/* Cab window */}
        <path d="M88 56 L88 68 L105 68 L105 64 L97 56 Z" fill="#1a1a2e" opacity="0.6" />
        {/* Serving window box - orange */}
        <rect x="18" y="30" width="55" height="24" rx="3" fill="#E65100" />
        {/* Serving counter */}
        <rect x="14" y="50" width="63" height="6" rx="2" fill="#BF360C" />
        {/* Menu bars on box */}
        <rect x="26" y="37" width="8" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="26" y="43" width="8" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="40" y="37" width="8" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
        <rect x="40" y="43" width="8" height="3" rx="1" fill="rgba(255,255,255,0.5)" />
        {/* Steam swirls */}
        <path d="M38 26 C38 18, 44 18, 44 10 C44 4, 40 4, 40 0" stroke="#E65100" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        <path d="M52 24 C52 16, 58 16, 58 8 C58 2, 54 2, 54 -2" stroke="#E65100" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
        {/* Wheels */}
        <circle cx="28" cy="84" r="11" fill="#1a1a2e" />
        <circle cx="28" cy="84" r="6" fill="#9E9E9E" />
        <circle cx="28" cy="84" r="2.5" fill="#1a1a2e" />
        <circle cx="80" cy="84" r="11" fill="#1a1a2e" />
        <circle cx="80" cy="84" r="6" fill="#9E9E9E" />
        <circle cx="80" cy="84" r="2.5" fill="#1a1a2e" />
      </svg>
      {showText && (
        <span className={`text-white ${textSize}`} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '0.06em' }}>
          ROAMEATS
        </span>
      )}
    </div>
  )
}
