import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

export default function AdminPanel() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [vaults, setVaults] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [banningId, setBanningId] = useState(null);

  const fetchAll = async () => {
    try {
      const [statsRes, usersRes, vaultsRes] = await Promise.all([
        axiosInstance.get('/admin/stats'),
        axiosInstance.get('/admin/users'),
        axiosInstance.get('/admin/vaults'),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data.users);
      setVaults(vaultsRes.data.vaults);
    } catch (error) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleDeleteVault = async (vaultId, fileName) => {
    if (!window.confirm(`Permanently delete "${fileName}"? This cannot be undone.`)) return;
    setDeletingId(vaultId);
    try {
      await axiosInstance.delete(`/admin/vaults/${vaultId}`);
      toast.success('Vault permanently deleted');
      fetchAll();
    } catch (error) {
      toast.error('Failed to delete vault');
    } finally {
      setDeletingId(null);
    }
  };

  const handleBanUser = async (userId, isBanned, userName) => {
    const action = isBanned ? 'unban' : 'ban';
    if (!window.confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} "${userName}"?`)) return;
    setBanningId(userId);
    try {
      const res = await axiosInstance.patch(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setBanningId(null);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axiosInstance.patch(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchAll();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update role');
    }
  };

  const formatStorage = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const statusColor = (status) => {
    if (status === 'active') return { bg: '#d1fae5', text: '#065f46' };
    if (status === 'burned') return { bg: '#fee2e2', text: '#991b1b' };
    return { bg: '#f3f4f6', text: '#4b5563' };
  };

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ textAlign: 'center', color: '#6b7280', paddingTop: '4rem' }}>
          Loading admin panel...
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
            <h1 style={titleStyle}>Admin Panel</h1>
            <p style={subtitleStyle}>System-wide monitoring and control</p>
          </div>
          <span style={adminBadgeStyle}>Admin</span>
        </div>

        {/* Tabs */}
        <div style={tabRowStyle}>
          {['overview', 'vaults', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={tabBtnStyle(activeTab === tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && stats && (
          <div>
            <div style={statsGridStyle}>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Total users</p>
                <p style={statValueStyle}>{stats.totalUsers}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Total vaults</p>
                <p style={statValueStyle}>{stats.totalVaults}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Active vaults</p>
                <p style={{ ...statValueStyle, color: '#059669' }}>{stats.activeVaults}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Burned vaults</p>
                <p style={{ ...statValueStyle, color: '#dc2626' }}>{stats.burnedVaults}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Total downloads</p>
                <p style={{ ...statValueStyle, color: '#4f46e5' }}>{stats.totalDownloads}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Failed passphrases</p>
                <p style={{ ...statValueStyle, color: '#f59e0b' }}>{stats.failedAttempts}</p>
              </div>
              <div style={statCardStyle}>
                <p style={statLabelStyle}>Storage used</p>
                <p style={statValueStyle}>{formatStorage(stats.totalStorage)}</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Vaults Tab ── */}
        {activeTab === 'vaults' && (
          <div style={tableCardStyle}>
            <p style={tableHeaderStyle}>{vaults.length} total vaults</p>
            {vaults.length === 0 ? (
              <p style={mutedStyle}>No vaults found.</p>
            ) : (
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {['File', 'Uploader', 'Size', 'Status', 'Downloads', 'Expires', 'Actions'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vaults.map((vault, index) => {
                      const colors = statusColor(vault.status);
                      return (
                        <tr
                          key={vault._id}
                          style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                        >
                          <td style={tdStyle}>
                            <span style={fileNameStyle}>{vault.originalName}</span>
                          </td>
                          <td style={tdStyle}>
                            <span style={uploaderStyle}>
                              {vault.uploaderId?.name || 'Unknown'}
                            </span>
                            <span style={uploaderEmailStyle}>
                              {vault.uploaderId?.email || ''}
                            </span>
                          </td>
                          <td style={tdStyle}>{formatFileSize(vault.fileSize)}</td>
                          <td style={tdStyle}>
                            <span style={badgeStyle(colors)}>{vault.status}</span>
                          </td>
                          <td style={tdStyle}>
                            {vault.downloadCount} / {vault.maxDownloads}
                          </td>
                          <td style={tdStyle}>
                            {new Date(vault.expiryDate).toLocaleDateString()}
                          </td>
                          <td style={tdStyle}>
                            <button
                              onClick={() => handleDeleteVault(vault._id, vault.originalName)}
                              disabled={deletingId === vault._id}
                              style={deleteBtnStyle}
                            >
                              {deletingId === vault._id ? 'Deleting...' : 'Force Delete'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div style={tableCardStyle}>
            <p style={tableHeaderStyle}>{users.length} registered users</p>
            {users.length === 0 ? (
              <p style={mutedStyle}>No users found.</p>
            ) : (
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      {['Name', 'Email', 'Role', 'Vaults', 'Joined', 'Status', 'Actions'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, index) => (
                      <tr
                        key={user._id}
                        style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb' }}
                      >
                        <td style={tdStyle}>
                          <span style={fileNameStyle}>{user.name}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={uploaderEmailStyle}>{user.email}</span>
                        </td>
                        <td style={tdStyle}>
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            style={roleSelectStyle}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={tdStyle}>{user.vaultCount}</td>
                        <td style={tdStyle}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td style={tdStyle}>
                          <span style={badgeStyle(
                            user.isBanned
                              ? { bg: '#fee2e2', text: '#991b1b' }
                              : { bg: '#d1fae5', text: '#065f46' }
                          )}>
                            {user.isBanned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => handleBanUser(user._id, user.isBanned, user.name)}
                            disabled={banningId === user._id}
                            style={banBtnStyle(user.isBanned)}
                          >
                            {banningId === user._id
                              ? 'Updating...'
                              : user.isBanned ? 'Unban' : 'Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
  maxWidth: '1100px',
  margin: '0 auto',
};

const headerStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '1.5rem',
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

const adminBadgeStyle = {
  backgroundColor: '#fee2e2',
  color: '#991b1b',
  fontSize: '0.75rem',
  fontWeight: '700',
  padding: '0.3rem 0.875rem',
  borderRadius: '999px',
};

const tabRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  marginBottom: '1.5rem',
};

const tabBtnStyle = (active) => ({
  padding: '0.5rem 1.25rem',
  borderRadius: '8px',
  border: `1px solid ${active ? '#4f46e5' : '#d1d5db'}`,
  backgroundColor: active ? '#4f46e5' : '#ffffff',
  color: active ? '#ffffff' : '#374151',
  fontSize: '0.9rem',
  fontWeight: active ? '600' : '400',
  cursor: 'pointer',
});

const statsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '1rem',
};

const statCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '10px',
  padding: '1.25rem',
};

const statLabelStyle = {
  fontSize: '0.8rem',
  color: '#6b7280',
  margin: '0 0 0.25rem',
};

const statValueStyle = {
  fontSize: '1.8rem',
  fontWeight: '700',
  color: '#111827',
  margin: 0,
};

const tableCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
};

const tableHeaderStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#374151',
  margin: 0,
  padding: '1rem 1.25rem',
  borderBottom: '1px solid #f3f4f6',
};

const tableWrapperStyle = {
  overflowX: 'auto',
};

const tableStyle = {
  width: '100%',
  borderCollapse: 'collapse',
  fontSize: '0.875rem',
};

const thStyle = {
  padding: '0.75rem 1rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.875rem 1rem',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'top',
};

const fileNameStyle = {
  fontWeight: '500',
  color: '#111827',
  display: 'block',
  maxWidth: '200px',
  wordBreak: 'break-all',
};

const uploaderStyle = {
  display: 'block',
  fontWeight: '500',
  color: '#111827',
};

const uploaderEmailStyle = {
  display: 'block',
  fontSize: '0.78rem',
  color: '#9ca3af',
};

const badgeStyle = (colors) => ({
  backgroundColor: colors.bg,
  color: colors.text,
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
  whiteSpace: 'nowrap',
});

const deleteBtnStyle = {
  padding: '0.3rem 0.75rem',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  border: '1px solid #dc2626',
  borderRadius: '6px',
  fontSize: '0.78rem',
  fontWeight: '500',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
};

const banBtnStyle = (isBanned) => ({
  padding: '0.3rem 0.75rem',
  backgroundColor: isBanned ? '#f0fdf4' : '#fef2f2',
  color: isBanned ? '#16a34a' : '#dc2626',
  border: `1px solid ${isBanned ? '#16a34a' : '#dc2626'}`,
  borderRadius: '6px',
  fontSize: '0.78rem',
  fontWeight: '500',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});

const roleSelectStyle = {
  padding: '0.25rem 0.5rem',
  borderRadius: '6px',
  border: '1px solid #d1d5db',
  fontSize: '0.8rem',
  color: '#374151',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
};

const mutedStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  padding: '2rem',
  textAlign: 'center',
};