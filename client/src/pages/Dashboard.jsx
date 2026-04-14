import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

export default function Dashboard() {
  const [vaults, setVaults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [burningId, setBurningId] = useState(null);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const [vaultsRes, statsRes] = await Promise.all([
        axiosInstance.get('/vault/my-vaults'),
        axiosInstance.get('/vault/stats'),
      ]);
      setVaults(vaultsRes.data.vaults);
      setStats(statsRes.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleBurn = async (vaultId) => {
    if (!window.confirm('Permanently delete this vault? This cannot be undone.')) return;
    setBurningId(vaultId);
    try {
      await axiosInstance.delete(`/vault/${vaultId}/burn`);
      toast.success('Vault burned successfully');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to burn vault');
    } finally {
      setBurningId(null);
    }
  };

  const handleCopyLink = (linkToken) => {
    const link = `${window.location.origin}/vault/${linkToken}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copied!');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatTimeLeft = (expiryDate) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diff = expiry - now;
    if (diff <= 0) return 'Expired';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h left`;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  const statusColor = (status) => {
    if (status === 'active') return { bg: '#d1fae5', text: '#065f46' };
    if (status === 'burned') return { bg: '#fee2e2', text: '#991b1b' };
    if (status === 'expired') return { bg: '#f3f4f6', text: '#4b5563' };
    return { bg: '#f3f4f6', text: '#4b5563' };
  };

  const filteredVaults = vaults.filter((v) => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#6b7280', textAlign: 'center', paddingTop: '4rem' }}>
          Loading your vaults...
        </p>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>My Vaults</h1>
            <p style={subtitleStyle}>Manage your encrypted file links</p>
          </div>
          <button onClick={() => navigate('/upload')} style={newVaultBtnStyle}>
            + New Vault
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Total vaults</p>
              <p style={statValueStyle}>{stats.total}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Active</p>
              <p style={{ ...statValueStyle, color: '#059669' }}>{stats.active}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Burned</p>
              <p style={{ ...statValueStyle, color: '#dc2626' }}>{stats.burned}</p>
            </div>
            <div style={statCardStyle}>
              <p style={statLabelStyle}>Total downloads</p>
              <p style={{ ...statValueStyle, color: '#4f46e5' }}>{stats.totalDownloads}</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={filterRowStyle}>
          {['all', 'active', 'burned', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={filterBtnStyle(filter === f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Vault list */}
        {filteredVaults.length === 0 ? (
          <div style={emptyStateStyle}>
            <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0 }}>
              {filter === 'all'
                ? "You haven't created any vaults yet."
                : `No ${filter} vaults found.`}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/upload')}
                style={{ ...newVaultBtnStyle, marginTop: '1rem' }}
              >
                Upload your first file
              </button>
            )}
          </div>
        ) : (
          <div style={vaultListStyle}>
            {filteredVaults.map((vault) => {
              const colors = statusColor(vault.status);
              return (
                <div key={vault._id} style={vaultCardStyle}>
                  {/* Top row */}
                  <div style={vaultTopRowStyle}>
                    <div style={vaultNameGroupStyle}>
                      <span style={vaultNameStyle}>{vault.originalName}</span>
                      <span style={vaultSizeStyle}>{formatFileSize(vault.fileSize)}</span>
                    </div>
                    <span style={statusBadgeStyle(colors)}>{vault.status}</span>
                  </div>

                  {/* Meta row */}
                  <div style={vaultMetaRowStyle}>
                    <span style={metaItemStyle}>
                      Downloads: {vault.downloadCount} / {vault.maxDownloads}
                    </span>
                    <span style={metaItemStyle}>
                      {vault.status === 'active'
                        ? formatTimeLeft(vault.expiryDate)
                        : new Date(vault.expiryDate).toLocaleDateString()}
                    </span>
                    <span style={metaItemStyle}>
                      {vault.hasPassphrase ? 'Passphrase protected' : 'No passphrase'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={vaultActionsStyle}>
                    {vault.status === 'active' && (
                      <>
                        <button
                          onClick={() => handleCopyLink(vault.linkToken)}
                          style={actionBtnStyle('#4f46e5', '#eef2ff')}
                        >
                          Copy link
                        </button>
                        <button
                          onClick={() => navigate(`/audit?vault=${vault._id}`)}
                          style={actionBtnStyle('#374151', '#f9fafb')}
                        >
                          View logs
                        </button>
                        <button
                          onClick={() => handleBurn(vault._id)}
                          disabled={burningId === vault._id}
                          style={actionBtnStyle('#dc2626', '#fef2f2')}
                        >
                          {burningId === vault._id ? 'Burning...' : 'Burn'}
                        </button>
                      </>
                    )}
                    {vault.status !== 'active' && (
                      <button
                        onClick={() => navigate(`/audit?vault=${vault._id}`)}
                        style={actionBtnStyle('#374151', '#f9fafb')}
                      >
                        View logs
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
  maxWidth: '860px',
  margin: '0 auto',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.5rem',
  flexWrap: 'wrap',
  gap: '1rem',
};

const titleStyle = {
  fontSize: '1.8rem',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 0.25rem',
};

const subtitleStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  margin: 0,
};

const newVaultBtnStyle = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem 1.25rem',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: '1rem',
  marginBottom: '1.5rem',
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

const filterRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.25rem',
  flexWrap: 'wrap',
};

const filterBtnStyle = (active) => ({
  padding: '0.4rem 1rem',
  borderRadius: '6px',
  border: `1px solid ${active ? '#4f46e5' : '#d1d5db'}`,
  backgroundColor: active ? '#4f46e5' : '#ffffff',
  color: active ? '#ffffff' : '#374151',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontWeight: active ? '600' : '400',
});

const emptyStateStyle = {
  textAlign: 'center',
  padding: '4rem 2rem',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
};

const vaultListStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const vaultCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.25rem',
};

const vaultTopRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '0.75rem',
  gap: '1rem',
};

const vaultNameGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const vaultNameStyle = {
  fontSize: '0.95rem',
  fontWeight: '600',
  color: '#111827',
  wordBreak: 'break-all',
};

const vaultSizeStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
};

const statusBadgeStyle = (colors) => ({
  backgroundColor: colors.bg,
  color: colors.text,
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
  whiteSpace: 'nowrap',
});

const vaultMetaRowStyle = {
  display: 'flex',
  gap: '1.5rem',
  marginBottom: '1rem',
  flexWrap: 'wrap',
};

const metaItemStyle = {
  fontSize: '0.8rem',
  color: '#6b7280',
};

const vaultActionsStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const actionBtnStyle = (color, bg) => ({
  padding: '0.35rem 0.875rem',
  borderRadius: '6px',
  border: `1px solid ${color}`,
  backgroundColor: bg,
  color: color,
  fontSize: '0.8rem',
  fontWeight: '500',
  cursor: 'pointer',
});