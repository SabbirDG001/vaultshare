import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const FEATURES = [
  {
    title: 'AES-256 Encryption',
    description:
      'Every file is encrypted with military-grade AES-256-CBC before being stored. Even server admins cannot read your files.',
  },
  {
    title: 'Self-Destructing Links',
    description:
      'Set a time limit or download count. Once triggered, the file is permanently deleted from our servers — no recovery possible.',
  },
  {
    title: 'Passphrase Protection',
    description:
      'Add an extra layer of security with a passphrase. Keys are derived using PBKDF2 — the server never stores your passphrase.',
  },
  {
    title: 'Recipient Audit Trail',
    description:
      'Every time your vault link is opened, the IP address, timestamp, and browser are logged. Know exactly who accessed your file.',
  },
  {
    title: 'One-Time Links',
    description:
      'Generate links that burn after a single download. The link returns 410 Gone on any subsequent visit.',
  },
  {
    title: 'Admin Oversight',
    description:
      'Full admin panel with system-wide vault monitoring, user management, force-delete controls, and access log visibility.',
  },
];

const STEPS = [
  { step: '01', title: 'Upload your file', description: 'Drag and drop any file up to 50MB.' },
  { step: '02', title: 'Set expiry rules', description: 'Choose time limit, download count, and optional passphrase.' },
  { step: '03', title: 'Share the link', description: 'Copy the generated vault link and send it to your recipient.' },
  { step: '04', title: 'Vault self-destructs', description: 'After the rules trigger, the file is permanently deleted.' },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div style={pageStyle}>

      {/* ── Hero ── */}
      <section style={heroStyle}>
        <div style={heroContentStyle}>
          <div style={heroBadgeStyle}>AES-256 · Self-Destructing · Zero Trust</div>
          <h1 style={heroTitleStyle}>
            Share files securely.<br />
            They vanish after delivery.
          </h1>
          <p style={heroSubtitleStyle}>
            VaultShare encrypts your files before storing them and generates
            a self-destructing link. Once downloaded or expired, the file is
            gone forever — from our servers and from existence.
          </p>
          <div style={heroCTAStyle}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/upload')}
                  style={primaryBtnStyle}
                >
                  Upload a File
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  style={secondaryBtnStyle}
                >
                  My Dashboard
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  style={primaryBtnStyle}
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  style={secondaryBtnStyle}
                >
                  Login
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hero visual */}
        <div style={heroVisualStyle}>
          <div style={vaultCardStyle}>
            <div style={vaultCardHeaderStyle}>
              <span style={vaultDotStyle('#ef4444')} />
              <span style={vaultDotStyle('#f59e0b')} />
              <span style={vaultDotStyle('#10b981')} />
              <span style={vaultCardTitleStyle}>secure_vault.enc</span>
            </div>
            <div style={vaultCardBodyStyle}>
              <div style={vaultRowStyle}>
                <span style={vaultLabelStyle}>Status</span>
                <span style={activePillStyle}>Active</span>
              </div>
              <div style={vaultRowStyle}>
                <span style={vaultLabelStyle}>Encryption</span>
                <span style={vaultValueStyle}>AES-256-CBC</span>
              </div>
              <div style={vaultRowStyle}>
                <span style={vaultLabelStyle}>Key derivation</span>
                <span style={vaultValueStyle}>PBKDF2</span>
              </div>
              <div style={vaultRowStyle}>
                <span style={vaultLabelStyle}>Expires in</span>
                <span style={{ ...vaultValueStyle, color: '#f59e0b' }}>23h 47m 12s</span>
              </div>
              <div style={vaultRowStyle}>
                <span style={vaultLabelStyle}>Downloads</span>
                <span style={vaultValueStyle}>0 / 1</span>
              </div>
              <div style={vaultRowStyle}>
                <span style={vaultLabelStyle}>Passphrase</span>
                <span style={{ ...vaultValueStyle, color: '#10b981' }}>Protected</span>
              </div>
            </div>
            <div style={vaultCardFooterStyle}>
              <div style={burnBarContainerStyle}>
                <div style={burnBarLabelStyle}>Vault integrity</div>
                <div style={burnBarStyle}>
                  <div style={burnBarFillStyle} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section style={sectionStyle}>
        <h2 style={sectionTitleStyle}>How it works</h2>
        <p style={sectionSubtitleStyle}>Four steps from upload to permanent deletion</p>
        <div style={stepsGridStyle}>
          {STEPS.map((s) => (
            <div key={s.step} style={stepCardStyle}>
              <div style={stepNumStyle}>{s.step}</div>
              <h3 style={stepTitleStyle}>{s.title}</h3>
              <p style={stepDescStyle}>{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ ...sectionStyle, backgroundColor: '#f9fafb' }}>
        <h2 style={sectionTitleStyle}>Built for security</h2>
        <p style={sectionSubtitleStyle}>
          Every feature is designed around the principle of zero trust
        </p>
        <div style={featuresGridStyle}>
          {FEATURES.map((f) => (
            <div key={f.title} style={featureCardStyle}>
              <h3 style={featureTitleStyle}>{f.title}</h3>
              <p style={featureDescStyle}>{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section style={ctaBannerStyle}>
        <h2 style={ctaTitleStyle}>Ready to share files securely?</h2>
        <p style={ctaSubtitleStyle}>
          Create a free account and generate your first encrypted vault in seconds.
        </p>
        {isAuthenticated ? (
          <button onClick={() => navigate('/upload')} style={primaryBtnStyle}>
            Upload a File
          </button>
        ) : (
          <button onClick={() => navigate('/register')} style={primaryBtnStyle}>
            Create Free Account
          </button>
        )}
      </section>

      {/* ── Footer ── */}
      <footer style={footerStyle}>
        <p style={footerTextStyle}>
          VaultShare — Encrypted file sharing with self-destructing links
        </p>
        <p style={footerTextStyle}>
          Built with MERN stack · AES-256-CBC · PBKDF2 · JWT
        </p>
      </footer>

    </div>
  );
}

const pageStyle = {
  backgroundColor: '#ffffff',
};

const heroStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '3rem',
  padding: '5rem 4rem',
  maxWidth: '1200px',
  margin: '0 auto',
  flexWrap: 'wrap',
};

const heroContentStyle = {
  flex: '1',
  minWidth: '300px',
  maxWidth: '560px',
};

const heroBadgeStyle = {
  display: 'inline-block',
  backgroundColor: '#eef2ff',
  color: '#4f46e5',
  fontSize: '0.8rem',
  fontWeight: '600',
  padding: '0.35rem 0.875rem',
  borderRadius: '999px',
  marginBottom: '1.25rem',
  letterSpacing: '0.03em',
};

const heroTitleStyle = {
  fontSize: '3rem',
  fontWeight: '800',
  color: '#111827',
  lineHeight: '1.15',
  margin: '0 0 1.25rem',
};

const heroSubtitleStyle = {
  fontSize: '1.05rem',
  color: '#6b7280',
  lineHeight: '1.7',
  margin: '0 0 2rem',
};

const heroCTAStyle = {
  display: 'flex',
  gap: '1rem',
  flexWrap: 'wrap',
};

const primaryBtnStyle = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.8rem 1.75rem',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const secondaryBtnStyle = {
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  padding: '0.8rem 1.75rem',
  fontSize: '1rem',
  fontWeight: '500',
  cursor: 'pointer',
};

const heroVisualStyle = {
  flex: '1',
  minWidth: '280px',
  maxWidth: '400px',
  display: 'flex',
  justifyContent: 'center',
};

const vaultCardStyle = {
  backgroundColor: '#111827',
  borderRadius: '14px',
  width: '100%',
  maxWidth: '360px',
  overflow: 'hidden',
  border: '1px solid #1f2937',
};

const vaultCardHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '0.875rem 1rem',
  backgroundColor: '#1f2937',
  borderBottom: '1px solid #374151',
};

const vaultDotStyle = (color) => ({
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'inline-block',
});

const vaultCardTitleStyle = {
  fontSize: '0.78rem',
  color: '#9ca3af',
  marginLeft: '8px',
  fontFamily: 'monospace',
};

const vaultCardBodyStyle = {
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const vaultRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '0.875rem',
};

const vaultLabelStyle = {
  color: '#6b7280',
};

const vaultValueStyle = {
  color: '#e5e7eb',
  fontFamily: 'monospace',
  fontSize: '0.8rem',
};

const activePillStyle = {
  backgroundColor: '#064e3b',
  color: '#10b981',
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.15rem 0.6rem',
  borderRadius: '999px',
};

const vaultCardFooterStyle = {
  padding: '0 1.25rem 1.25rem',
};

const burnBarContainerStyle = {
  marginTop: '0.5rem',
};

const burnBarLabelStyle = {
  fontSize: '0.75rem',
  color: '#6b7280',
  marginBottom: '0.4rem',
};

const burnBarStyle = {
  height: '4px',
  backgroundColor: '#374151',
  borderRadius: '2px',
  overflow: 'hidden',
};

const burnBarFillStyle = {
  height: '100%',
  width: '82%',
  backgroundColor: '#4f46e5',
  borderRadius: '2px',
};

const sectionStyle = {
  padding: '5rem 4rem',
};

const sectionTitleStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: '#111827',
  textAlign: 'center',
  margin: '0 0 0.75rem',
};

const sectionSubtitleStyle = {
  fontSize: '1rem',
  color: '#6b7280',
  textAlign: 'center',
  margin: '0 0 3rem',
};

const stepsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '1.5rem',
  maxWidth: '1000px',
  margin: '0 auto',
};

const stepCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.5rem',
};

const stepNumStyle = {
  fontSize: '2rem',
  fontWeight: '800',
  color: '#e0e7ff',
  marginBottom: '0.75rem',
  fontFamily: 'monospace',
};

const stepTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 0.5rem',
};

const stepDescStyle = {
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: 0,
};

const featuresGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '1.25rem',
  maxWidth: '1100px',
  margin: '0 auto',
};

const featureCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.5rem',
};

const featureTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 0.5rem',
};

const featureDescStyle = {
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: 0,
};

const ctaBannerStyle = {
  backgroundColor: '#4f46e5',
  padding: '5rem 4rem',
  textAlign: 'center',
};

const ctaTitleStyle = {
  fontSize: '2rem',
  fontWeight: '700',
  color: '#ffffff',
  margin: '0 0 1rem',
};

const ctaSubtitleStyle = {
  fontSize: '1rem',
  color: '#c7d2fe',
  margin: '0 0 2rem',
  lineHeight: '1.6',
};

const footerStyle = {
  padding: '2rem 4rem',
  borderTop: '1px solid #e5e7eb',
  textAlign: 'center',
};

const footerTextStyle = {
  fontSize: '0.85rem',
  color: '#9ca3af',
  margin: '0.25rem 0',
};