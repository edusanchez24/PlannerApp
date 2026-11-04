export function NikoAvatar({ size = 52 }) {
  return (
    <div
      className="niko-portrait-box"
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '3px',
        background: '#090714',
        border: '2px solid #3d2f59',
        overflow: 'hidden'
      }}
      title="Niko · Portador de la Bombilla del Sol"
    >
      <svg
        viewBox="0 0 64 64"
        width={size * 0.9}
        height={size * 0.9}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Capa y bufanda de Niko */}
        <path d="M18 52 C18 42, 46 42, 46 52 L50 62 L14 62 Z" fill="#3a1e5c" />
        <path d="M22 48 C22 44, 42 44, 42 48 L44 54 L20 54 Z" fill="#582d85" />

        {/* Cara y cabello azul-violeta */}
        <ellipse cx="32" cy="38" rx="14" ry="12" fill="#4d448a" />
        <ellipse cx="32" cy="40" rx="11" ry="9" fill="#f5cfb0" />

        {/* Ojos dorados de gato de Niko */}
        <ellipse cx="27" cy="40" rx="2.8" ry="3.8" fill="#e69526" />
        <ellipse cx="37" cy="40" rx="2.8" ry="3.8" fill="#e69526" />
        <circle cx="28" cy="39" r="1" fill="#fff" />
        <circle cx="38" cy="39" r="1" fill="#fff" />
        <ellipse cx="27" cy="41" rx="1.2" ry="2" fill="#99580e" />
        <ellipse cx="37" cy="41" rx="1.2" ry="2" fill="#99580e" />

        {/* Sombrero icónico con orejas puntiagudas de gato */}
        <path
          d="M12 34 C12 34, 18 16, 20 8 C22 14, 26 22, 32 22 C38 22, 42 14, 44 8 C46 16, 52 34, 52 34 C58 35, 60 38, 52 39 C46 40, 18 40, 12 39 C4 38, 6 35, 12 34 Z"
          fill="#331e18"
        />
        {/* Ala del sombrero */}
        <path d="M8 36 C18 33, 46 33, 56 36 C58 38, 54 40, 32 40 C10 40, 6 38, 8 36 Z" fill="#22130e" />
        {/* Cinta del sombrero */}
        <path d="M22 28 C28 29, 36 29, 42 28" stroke="#d4881e" strokeWidth="2" strokeLinecap="round" />

        {/* La Bombilla del Sol (The Sunbulb) */}
        <g transform="translate(24, 44)">
          <circle cx="8" cy="8" r="7" fill="url(#bulbColor)" />
          <path d="M6 13 L10 13 L9 15 L7 15 Z" fill="#718096" />
          <path d="M6 8 Q8 6 10 8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        <defs>
          <radialGradient id="bulbColor" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(8 8) scale(7)">
            <stop stopColor="#fffbeb" />
            <stop offset="0.5" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#b45309" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
