interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
}

const GRADIENTS = [
  'linear-gradient(135deg,#1d9bf0,#0d47a1)',
  'linear-gradient(135deg,#bc8cff,#6e40c9)',
  'linear-gradient(135deg,#3fb950,#1a7f37)',
  'linear-gradient(135deg,#f78166,#c0392b)',
  'linear-gradient(135deg,#e3b341,#b8860b)',
  'linear-gradient(135deg,#58a6ff,#0550ae)',
  'linear-gradient(135deg,#ff7b72,#a0290c)',
  'linear-gradient(135deg,#56d364,#116329)',
]

function getGradient(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]
}

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
        style={{ border: '2px solid var(--border)' }}
      />
    )
  }

  return (
    <div
      className={`${sizes[size]} rounded-full font-bold flex items-center justify-center shrink-0 text-white`}
      style={{ background: getGradient(name ?? '?'), border: '2px solid var(--border)' }}
    >
      {initials}
    </div>
  )
}
