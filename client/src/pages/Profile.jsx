import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../hooks/useAuth';

export default function Profile() {
  const { user, login } = useAuth();
  const [stats, setStats] = useState(null);
  const [apiKey, setApiKey] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();

  const newPassword = watch('newPassword');

  // ── Fetch user stats ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [statsRes, meRes] = await Promise.all([
          axiosInstance.get('/vault/stats'),
          axiosInstance.get('/auth/me'),
        ]);
        setStats(statsRes.data);
        if (meRes.data.user.apiKey) {
          setApiKey(meRes.data.user.apiKey);
        }
      } catch (error) {
        toast.error('Failed to load profile data');
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  // ── Generate API key ───────────────────────────────────────────────────────
  const handleGenerateApiKey = async () => {
    if (apiKey) {
      if (!window.confirm('Generating a new key will invalidate your existing one. Continue?')) {
        return;
      }
    }
    setGeneratingKey(true);
    try {
      const res = await axiosInstance.post('/auth/generate-api-key');
      setApiKey(res.data.apiKey);
      setShowApiKey(true);
      toast.success('API key generated successfully');
    } catch (error) {
      toast.error('Failed to generate API key');
    } finally {
      setGeneratingKey(false);
    }
  };

  // ── Copy API key ───────────────────────────────────────────────────────────
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setApiKeyCopied(true);
    toast.success('API key copied');
    setTimeout(() => setApiKeyCopied(false), 3000);
  };

  // ── Change password ────────────────────────────────────────────────────────
  const onChangePassword = async (data) => {
    setChangingPassword(true);
    try {
      await axiosInstance.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      reset();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const roleBadgeColor = (role) => {
    if (role === 'admin') return { bg: '#fee2e2', text: '#991b1b' };
    return { bg: '#e0e7ff', text: '#3730a3' };
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* ── Profile header ── */}
        <div style={profileHeaderStyle}>
          <div style={avatarStyle}>
            {getInitials(user?.name)}
          </div>
          <div style={profileInfoStyle}>
            <div style={profileNameRowStyle}>
              <h1 style={profileNameStyle}>{user?.name}</h1>
              {user?.role && (
                <span style={roleBadgeStyle(roleBadgeColor(user.role))}>
                  {user.role}
                </span>
              )}
            </div>
            <p style={profileEmailStyle}>{user?.email}</p>
          </div>
        </div>

        {/* ── Stats ── */}
        {!loadingStats && stats && (
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Vaults created</p>
              <p style={statValueStyle}>{stats.total}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Active vaults</p>
              <p style={{ ...statValueStyle, color: '#059669' }}>{stats.active}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Burned vaults</p>
              <p style={{ ...statValueStyle, color: '#dc2626' }}>{stats.burned}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Total downloads</p>
              <p style={{ ...statValueStyle, color: '#4f46e5' }}>{stats.totalDownloads}</p>
            </div>
          </div>
        )}

        <div style={twoColStyle}>

          {/* ── Left column ── */}
          <div style={colStyle}>

            {/* Account info */}
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Account information</h2>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Full name</span>
                <span style={infoValueStyle}>{user?.name}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Email address</span>
                <span style={infoValueStyle}>{user?.email}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Account role</span>
                <span style={infoValueStyle}>{user?.role}</span>
              </div>
            </div>

            {/* API Key */}
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>API key</h2>
              <p style={cardDescStyle}>
                Use your API key to upload and manage vaults programmatically
                without logging in through the browser.
              </p>

              {apiKey ? (
                <div style={apiKeyContainerStyle}>
                  <div style={apiKeyBoxStyle}>
                    <code style={apiKeyTextStyle}>
                      {showApiKey
                        ? apiKey
                        : apiKey.slice(0, 8) + '••••••••••••••••••••••••'}
                    </code>
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={toggleKeyBtnStyle}
                    >
                      {showApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <div style={apiKeyActionsStyle}>
                    <button onClick={handleCopyApiKey} style={copyKeyBtnStyle}>
                      {apiKeyCopied ? 'Copied!' : 'Copy key'}
                    </button>
                    <button
                      onClick={handleGenerateApiKey}
                      disabled={generatingKey}
                      style={regenerateKeyBtnStyle}
                    >
                      {generatingKey ? 'Generating...' : 'Regenerate'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={noKeyContainerStyle}>
                  <p style={noKeyTextStyle}>No API key generated yet.</p>
                  <button
                    onClick={handleGenerateApiKey}
                    disabled={generatingKey}
                    style={generateKeyBtnStyle}
                  >
                    {generatingKey ? 'Generating...' : 'Generate API key'}
                  </button>
                </div>
              )}

              {apiKey && showApiKey && (
                <div style={apiKeyWarningStyle}>
                  Keep this key secret. Anyone with this key can upload
                  vaults on your behalf.
                </div>
              )}

              {/* API usage example */}
              {apiKey && (
                <div style={apiExampleStyle}>
                  <p style={apiExampleLabelStyle}>Example usage</p>
                  <code style={apiExampleCodeStyle}>
                    {`curl -X POST http://localhost:5000/api/vault/upload \\
  -H "Authorization: Bearer ${showApiKey ? apiKey : '<your-api-key>'}" \\
  -F "file=@yourfile.pdf" \\
  -F "duration=24h" \\
  -F "maxDownloads=1"`}
                  </code>
                </div>
              )}
            </div>

          </div>

          {/* ── Right column ── */}
          <div style={colStyle}>

            {/* Change password */}
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Change password</h2>
              <p style={cardDescStyle}>
                Choose a strong password of at least 6 characters.
              </p>

              <form
                onSubmit={handleSubmit(onChangePassword)}
                style={formStyle}
              >
                <div style={fieldStyle}>
                  <label style={labelStyle}>Current password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={inputStyle(!!errors.currentPassword)}
                    {...register('currentPassword', {
                      required: 'Current password is required',
                    })}
                  />
                  {errors.currentPassword && (
                    <span style={errorStyle}>
                      {errors.currentPassword.message}
                    </span>
                  )}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>New password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={inputStyle(!!errors.newPassword)}
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'Minimum 6 characters',
                      },
                    })}
                  />
                  {errors.newPassword && (
                    <span style={errorStyle}>{errors.newPassword.message}</span>
                  )}
                </div>

                <div style={fieldStyle}>
                  <label style={labelStyle}>Confirm new password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    style={inputStyle(!!errors.confirmPassword)}
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (value) =>
                        value === newPassword || 'Passwords do not match',
                    })}
                  />
                  {errors.confirmPassword && (
                    <span style={errorStyle}>
                      {errors.confirmPassword.message}
                    </span>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={changingPassword}
                  style={submitBtnStyle(changingPassword)}
                >
                  {changingPassword ? 'Updating...' : 'Update password'}
                </button>
              </form>
            </div>

            {/* Danger zone */}
            <div style={dangerCardStyle}>
              <h2 style={{ ...cardTitleStyle, color: '#dc2626' }}>
                Danger zone
              </h2>
              <p style={cardDescStyle}>
                Logging out will clear your session. All your vaults and
                audit logs are preserved on the server.
              </p>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to logout?')) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                  }
                }}
                style={logoutBtnStyle}
              >
                Logout from this device
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: '#f9fafb',
  padding: '2rem 1rem',
};

const containerStyle = {
  maxWidth: '960px',
  margin: '0 auto',
};

const profileHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '1.25rem',
  marginBottom: '1.75rem',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.5rem',
};

const avatarStyle = {
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '1.4rem',
  fontWeight: '700',
  flexShrink: 0,
};

const profileInfoStyle = {
  flex: 1,
};

const profileNameRowStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  flexWrap: 'wrap',
};

const profileNameStyle = {
  fontSize: '1.4rem',
  fontWeight: '700',
  color: '#111827',
  margin: 0,
};

const roleBadgeStyle = (colors) => ({
  backgroundColor: colors.bg,
  color: colors.text,
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
});

const profileEmailStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  margin: '0.25rem 0 0',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
  gap: '1rem',
  marginBottom: '1.75rem',
};

const statCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '1rem 1.25rem',
};

const statLabelStyle = {
  fontSize: '0.8rem',
  color: '#6b7280',
  margin: '0 0 0.25rem',
};

const statValueStyle = {
  fontSize: '1.6rem',
  fontWeight: '700',
  color: '#111827',
  margin: 0,
};

const twoColStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
  gap: '1.25rem',
  alignItems: 'start',
};

const colStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.5rem',
};

const dangerCardStyle = {
  ...cardStyle,
  border: '1px solid #fecaca',
};

const cardTitleStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#111827',
  margin: '0 0 1rem',
};

const cardDescStyle = {
  fontSize: '0.875rem',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 1.25rem',
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.6rem 0',
  borderTop: '1px solid #f3f4f6',
  fontSize: '0.875rem',
};

const infoLabelStyle = {
  color: '#6b7280',
};

const infoValueStyle = {
  color: '#111827',
  fontWeight: '500',
};

const apiKeyContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const apiKeyBoxStyle = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  gap: '0.5rem',
};

const apiKeyTextStyle = {
  fontSize: '0.8rem',
  color: '#374151',
  fontFamily: 'monospace',
  wordBreak: 'break-all',
  flex: 1,
};

const toggleKeyBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#4f46e5',
  fontSize: '0.8rem',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

const apiKeyActionsStyle = {
  display: 'flex',
  gap: '0.5rem',
};

const copyKeyBtnStyle = {
  flex: 1,
  padding: '0.5rem',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: '500',
  cursor: 'pointer',
};

const regenerateKeyBtnStyle = {
  flex: 1,
  padding: '0.5rem',
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '0.85rem',
  cursor: 'pointer',
};

const noKeyContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const noKeyTextStyle = {
  fontSize: '0.875rem',
  color: '#6b7280',
  margin: 0,
};

const generateKeyBtnStyle = {
  padding: '0.6rem 1.25rem',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
  width: 'fit-content',
};

const apiKeyWarningStyle = {
  backgroundColor: '#fffbeb',
  border: '1px solid #fcd34d',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  fontSize: '0.8rem',
  color: '#92400e',
  lineHeight: '1.5',
};

const apiExampleStyle = {
  marginTop: '1rem',
  backgroundColor: '#111827',
  borderRadius: '8px',
  padding: '1rem',
};

const apiExampleLabelStyle = {
  fontSize: '0.75rem',
  color: '#9ca3af',
  margin: '0 0 0.5rem',
};

const apiExampleCodeStyle = {
  fontSize: '0.75rem',
  color: '#10b981',
  fontFamily: 'monospace',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-all',
  display: 'block',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const fieldStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.4rem',
};

const labelStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#374151',
};

const inputStyle = (hasError) => ({
  padding: '0.6rem 0.875rem',
  borderRadius: '8px',
  border: `1px solid ${hasError ? '#ef4444' : '#d1d5db'}`,
  fontSize: '0.95rem',
  width: '100%',
  boxSizing: 'border-box',
  color: '#111827',
  outline: 'none',
});

const errorStyle = {
  fontSize: '0.8rem',
  color: '#ef4444',
};

const submitBtnStyle = (disabled) => ({
  padding: '0.7rem',
  backgroundColor: disabled ? '#9ca3af' : '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.95rem',
  fontWeight: '600',
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginTop: '0.25rem',
});

const logoutBtnStyle = {
  padding: '0.6rem 1.25rem',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
};