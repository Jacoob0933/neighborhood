export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-full flex" style={{ background: 'var(--bg)' }}>
      {/* Left - branding */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-between px-16 py-12"
        style={{ background: '#000', borderRight: '1px solid var(--border)' }}
      >
        <div className="text-4xl">🏘️</div>
        <div>
          <h1 className="text-5xl font-black leading-tight mb-4" style={{ color: 'var(--text)' }}>
            What&apos;s happening<br />in your street.
          </h1>
          <p className="text-lg" style={{ color: 'var(--text-2)' }}>
            Connect with your neighbors today.
          </p>
        </div>
        <p className="text-sm" style={{ color: 'var(--text-3)' }}>© 2025 Neighborhood</p>
      </div>

      {/* Right - form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="text-3xl mb-8 lg:hidden">🏘️</div>
          {children}
        </div>
      </div>
    </div>
  )
}
