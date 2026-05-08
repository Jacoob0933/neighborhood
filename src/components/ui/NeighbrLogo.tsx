interface Props {
  size?: number
  showText?: boolean
}

export function NeighbrLogo({ size = 32, showText = false }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#1d9bf0" />
            <stop offset="100%" stopColor="#0070c9" />
          </linearGradient>
          <linearGradient id="pinGrad" x1="14" y1="6" x2="34" y2="38" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="100%" stopColor="#d0eaff" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Background rounded square */}
        <rect width="48" height="48" rx="13" fill="url(#bgGrad)" />

        {/* Subtle inner glow */}
        <rect width="48" height="48" rx="13" fill="white" fillOpacity="0.06" />

        {/* Location pin body */}
        <path
          d="M24 5C17.37 5 12 10.37 12 17C12 25.8 24 43 24 43C24 43 36 25.8 36 17C36 10.37 30.63 5 24 5Z"
          fill="url(#pinGrad)"
        />

        {/* Pin shadow/depth */}
        <path
          d="M24 43C24 43 36 25.8 36 17C36 16.5 35.97 16 35.92 15.5C35.97 16 36 16.5 36 17C36 25.8 24 43 24 43Z"
          fill="white"
          fillOpacity="0.2"
        />

        {/* House inside pin */}
        {/* Roof */}
        <path
          d="M24 11L30 16.5H18L24 11Z"
          fill="#1d9bf0"
        />
        {/* House body */}
        <rect x="19" y="16.5" width="10" height="8" rx="0.5" fill="#1d9bf0" />
        {/* Door */}
        <rect x="22" y="20" width="4" height="4.5" rx="1" fill="white" fillOpacity="0.9" />
        {/* Window left */}
        <rect x="19.5" y="17.5" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.6" />
        {/* Window right */}
        <rect x="25.5" y="17.5" width="3" height="2.5" rx="0.5" fill="white" fillOpacity="0.6" />

        {/* Bottom drop shadow of pin */}
        <ellipse cx="24" cy="43.5" rx="4" ry="1.5" fill="#0050a0" fillOpacity="0.25" />
      </svg>

      {showText && (
        <span
          className="font-black text-xl tracking-tight"
          style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}
        >
          Neighborhood
        </span>
      )}
    </div>
  )
}
