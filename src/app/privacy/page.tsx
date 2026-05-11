import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy – Neighbr',
  description: 'How Neighbr collects, uses, and protects your personal data.',
}

const LAST_UPDATED = 'May 11, 2025'
const APP_NAME = 'Neighbr'

export default function PrivacyPage() {
  return (
    <div style={{ background: '#06060a', minHeight: '100vh', color: '#c8c8e0' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky', top: 0, zIndex: 30,
          background: 'rgba(6,6,10,0.92)', backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          padding: '14px 24px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}
      >
        <Link
          href="/settings"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', color: '#c0c0e0',
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e8e8f8', lineHeight: 1 }}>Privacy Policy</div>
          <div style={{ fontSize: 11, color: '#555577', marginTop: 2 }}>Last updated {LAST_UPDATED}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>

        <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 32, color: '#9090b8' }}>
          {APP_NAME} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard your information
          when you use our mobile and web application.
        </p>

        <S title="1. Information We Collect">
          <P><B>Account information.</B> When you register, we collect your name, email address, username,
          and profile photo (if provided via Google or Apple sign-in).</P>
          <P><B>Location data.</B> With your explicit permission, we store your approximate GPS coordinates
          (latitude and longitude) to power the Nearby feed. We never collect location in the background.</P>
          <P><B>Content you post.</B> Posts, images, comments, and messages you create are stored on our servers.</P>
          <P><B>Usage data.</B> We collect basic analytics such as pages visited and features used to improve the app.
          This data is not sold to third parties.</P>
          <P><B>Device information.</B> We may collect your device type, operating system, and IP address for security
          and fraud prevention.</P>
        </S>

        <S title="2. How We Use Your Information">
          <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#8888aa' }}>
            {[
              'Provide, operate, and improve the Neighbr service',
              'Show you posts from neighbors within your selected radius',
              'Send notifications about activity on your content (if enabled)',
              'Verify your identity and prevent fraud or abuse',
              'Respond to your support requests',
              'Comply with legal obligations',
            ].map(item => <li key={item} style={{ fontSize: 14 }}>{item}</li>)}
          </ul>
        </S>

        <S title="3. Location Data">
          <P>Location is <B>optional</B>. You can use {APP_NAME} without sharing your location — the app will show
          you a worldwide feed instead. If you choose to share your location:</P>
          <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#8888aa', marginTop: 8 }}>
            {[
              'We store only your approximate GPS coordinates in your profile',
              'Location is used solely to filter content within your chosen radius',
              'We never share your exact coordinates with other users',
              'You can remove or update your location at any time in Settings → Edit Profile',
              'Location updates are limited to once every 30 days to prevent misuse',
            ].map(item => <li key={item} style={{ fontSize: 14 }}>{item}</li>)}
          </ul>
        </S>

        <S title="4. Sharing of Information">
          <P>We <B>do not sell</B> your personal data. We may share information in these limited circumstances:</P>
          <P><B>Service providers.</B> We use Supabase for database hosting and authentication, and Vercel for
          application hosting. These providers process data only on our behalf and under strict confidentiality.</P>
          <P><B>Legal requirements.</B> We may disclose information if required by law, court order, or to protect
          the rights and safety of our users.</P>
          <P><B>Business transfers.</B> In the event of a merger or acquisition, your data may be transferred.
          We will notify you before any such transfer.</P>
        </S>

        <S title="5. Data Retention">
          <P>We retain your data for as long as your account is active. When you delete your account,
          we permanently remove your profile, posts, and messages within 30 days.
          Some data may be retained longer if required by law.</P>
        </S>

        <S title="6. Your Rights">
          <P>Depending on your location, you may have the following rights:</P>
          <ul style={{ paddingLeft: 20, lineHeight: 2, color: '#8888aa', marginTop: 8 }}>
            {[
              'Access — request a copy of the data we hold about you',
              'Correction — request correction of inaccurate data',
              'Deletion — delete your account and data via Settings or by emailing us',
              'Portability — receive your data in a machine-readable format',
              'Objection — object to certain processing of your data',
            ].map(item => <li key={item} style={{ fontSize: 14 }}>{item}</li>)}
          </ul>
          <P>To exercise any of these rights, please contact us through the app.</P>
        </S>

        <S title="7. Cookies & Tracking">
          <P>{APP_NAME} uses only essential session cookies required for authentication. We do not use
          advertising cookies or cross-site tracking technologies.</P>
        </S>

        <S title="8. Children's Privacy">
          <P>{APP_NAME} is not directed to children under 13 years of age. We do not knowingly collect
          personal information from children under 13. If you believe we have inadvertently collected
          such data, please contact us immediately.</P>
        </S>

        <S title="9. Security">
          <P>We implement industry-standard security measures including HTTPS encryption, row-level security
          on our database, and OAuth 2.0 for authentication. No method of transmission over the internet
          is 100% secure; we strive to protect your data but cannot guarantee absolute security.</P>
        </S>

        <S title="10. Third-Party Services">
          <P>Our app uses the following third-party services, each with their own privacy policies:</P>
          <ul style={{ paddingLeft: 20, lineHeight: 2, marginTop: 8 }}>
            {[
              { name: 'Google Sign-In', url: 'https://policies.google.com/privacy' },
              { name: 'Supabase', url: 'https://supabase.com/privacy' },
              { name: 'Vercel', url: 'https://vercel.com/legal/privacy-policy' },
            ].map(s => (
              <li key={s.name} style={{ fontSize: 14, color: '#8888aa' }}>
                {s.name} — <A href={s.url}>{s.url}</A>
              </li>
            ))}
          </ul>
        </S>

        <S title="11. Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. We will notify you of significant changes
          via email or an in-app notice. Continued use of {APP_NAME} after changes constitutes acceptance
          of the updated policy.</P>
        </S>

        <S title="12. Contact Us">
          <P>If you have any questions about this Privacy Policy or our data practices, please reach out through the app.</P>
        </S>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#333355', marginBottom: 12 }}>
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <Link href="/settings" style={{ fontSize: 13, color: '#1d9bf0', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to Settings
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function S({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 36 }}>
      <h2 style={{
        fontSize: 16, fontWeight: 700, color: '#e0e0f8',
        marginBottom: 12, letterSpacing: -0.3,
      }}>
        {title}
      </h2>
      {children}
    </section>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 14, lineHeight: 1.75, color: '#8888aa', marginBottom: 10 }}>
      {children}
    </p>
  )
}

function B({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: '#c0c0d8', fontWeight: 600 }}>{children}</strong>
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      style={{ color: '#1d9bf0', textDecoration: 'underline' }}>
      {children}
    </a>
  )
}
