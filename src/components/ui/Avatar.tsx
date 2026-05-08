interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
}

const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }

export function Avatar({ src, name, size = 'md' }: AvatarProps) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? ''}
        className={`${sizes[size]} rounded-full object-cover shrink-0`}
        style={{ background: 'var(--bg-2)' }}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full font-semibold flex items-center justify-center shrink-0`}
      style={{ background: 'rgba(29,155,240,0.18)', color: '#1d9bf0' }}
    >
      {initials}
    </div>
  )
}
