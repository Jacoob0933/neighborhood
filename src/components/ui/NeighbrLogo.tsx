interface Props {
  size?: number
  showText?: boolean
}

export function NeighbrLogo({ size = 32, showText = false }: Props) {
  return (
    <div className="flex items-center gap-2.5">
      {/* Icon mark */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="40" height="40" rx="11" fill="#1d9bf0" />

        {/* Left house — slightly back */}
        <path d="M6 22 L14 13 L22 22 L22 32 L6 32 Z" fill="white" fillOpacity="0.55" />
        {/* Left door */}
        <rect x="11" y="26" width="5" height="6" rx="1" fill="#1d9bf0" fillOpacity="0.6" />

        {/* Right house — front */}
        <path d="M16 21 L25 11 L34 21 L34 32 L16 32 Z" fill="white" />
        {/* Right door */}
        <rect x="21" y="25" width="5" height="7" rx="1" fill="#1d9bf0" />

        {/* Window right */}
        <rect x="27" y="22" width="4" height="4" rx="1" fill="#1d9bf0" />
      </svg>

      {showText && (
        <span
          className="font-black text-xl tracking-tight"
          style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}
        >
          neighbr
        </span>
      )}
    </div>
  )
}
