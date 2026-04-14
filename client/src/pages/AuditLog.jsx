import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

export default function AuditLog() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [vaults, setVaults] = useState([]);
  const [selectedVaultId, setSelectedVaultId] = useState(searchParams.get('vault') || '');
  const [logs, setLogs] = useState([]);
  const [loadingVaults, setLoadingVaults] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // ── Fetch all user vaults for the selector ─────────────────────────────────
  useEffect(() => {
    const fetchVaults = async () => {
      try {
        const res = await axiosInstance.get('/vault/my-vaults');
        setVaults(res.data.vaults);
      } catch (error) {
        toast.error('Failed to load vaults');
      } finally {
        setLoadingVaults(false);
      }
    };
    fetchVaults();
  }, []);

  // ── Fetch logs when a vault is selected ───────────────────────────────────
  useEffect(() => {
    if (!selectedVaultId) {
      setLogs([]);
      return;
    }
    const fetchLogs = async () => {
      setLoadingLogs(true);
      try {
        const res = await axiosInstance.get(`/vault/${selectedVaultId}/logs`);
        setLogs(res.data.logs);
      } catch (error) {
        toast.error('Failed to load logs');
        setLogs([]);
      } finally {
        setLoadingLogs(false);
      }
    };
    fetchLogs();
  }, [selectedVaultId]);

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast.error('No logs to export');
      return;
    }

    const selectedVault = vaults.find((v) => v._id === selectedVaultId);
    const fileName = selectedVault?.originalName || 'vault';

    const headers = ['Timestamp', 'Action', 'IP Address', 'User Agent'];
    const rows = logs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.action,
      log.ip,
      `"${log.userAgent}"`,
    ]);

    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_${fileName}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const actionColor = (action) => {
    if (action === 'download') return { bg: '#d1fae5', text: '#065f46' };
    if (action === 'failed_passphrase') return { bg: '#fee2e2', text: '#991b1b' };
    if (action === 'view') return { bg: '#e0e7ff', text: '#3730a3' };
    return { bg: '#f3f4f6', text: '#4b5563' };
  };

  const actionLabel = (action) => {
    if (action === 'download') return 'Download';
    if (action === 'failed_passphrase') return 'Failed passphrase';
    if (action === 'view') return 'View';
    return action;
  };

  const selectedVault = vaults.find((v) => v._id === selectedVaultId);

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>

        {/* Header */}
        <div style={headerStyle}>
          <div>
            <h1 style={titleStyle}>Audit Log</h1>
            <p style={subtitleStyle}>
              Track every access event for your encrypted vaults
            </p>
          </div>
          {logs.length > 0 && (
            <button onClick={handleExportCSV} style={exportBtnStyle}>
              Export CSV
            </button>
          )}
        </div>

        {/* Vault selector */}
        <div style={selectorCardStyle}>
          <label style={selectorLabelStyle}>Select a vault to inspect</label>
          {loadingVaults ? (
            <p style={mutedStyle}>Loading vaults...</p>
          ) : vaults.length === 0 ? (
            <div style={emptyVaultStyle}>
              <p style={mutedStyle}>No vaults found.</p>
              <button onClick={() => navigate('/upload')} style={uploadBtnStyle}>
                Upload a file
              </button>
            </div>
          ) : (
            <select
              value={selectedVaultId}
              onChange={(e) => setSelectedVaultId(e.target.value)}
              style={selectStyle}
            >
              <option value="">-- Choose a vault --</option>
              {vaults.map((vault) => (
                <option key={vault._id} value={vault._id}>
                  {vault.originalName} ({vault.status}) —{' '}
                  {new Date(vault.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Selected vault summary */}
        {selectedVault && (
          <div style={vaultSummaryStyle}>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>File</span>
              <span style={summaryValueStyle}>{selectedVault.originalName}</span>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Status</span>
              <span style={{
                ...summaryValueStyle,
                color: selectedVault.status === 'active' ? '#059669'
                  : selectedVault.status === 'burned' ? '#dc2626'
                  : '#6b7280',
              }}>
                {selectedVault.status}
              </span>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Downloads</span>
              <span style={summaryValueStyle}>
                {selectedVault.downloadCount} / {selectedVault.maxDownloads}
              </span>
            </div>
            <div style={summaryRowStyle}>
              <span style={summaryLabelStyle}>Created</span>
              <span style={summaryValueStyle}>
                {new Date(selectedVault.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Logs table */}
        {selectedVaultId && (
          <div style={logsCardStyle}>
            {loadingLogs ? (
              <p style={{ ...mutedStyle, textAlign: 'center', padding: '2rem' }}>
                Loading logs...
              </p>
            ) : logs.length === 0 ? (
              <div style={emptyLogsStyle}>
                <p style={mutedStyle}>No access events recorded yet for this vault.</p>
                <p style={{ ...mutedStyle, fontSize: '0.8rem' }}>
                  Events are logged when someone opens or downloads the vault link.
                </p>
              </div>
            ) : (
              <>
                <div style={logsHeaderStyle}>
                  <p style={logsCountStyle}>
                    {logs.length} event{logs.length !== 1 ? 's' : ''} recorded
                  </p>
                </div>

                <div style={tableWrapperStyle}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Timestamp</th>
                        <th style={thStyle}>Action</th>
                        <th style={thStyle}>IP Address</th>
                        <th style={thStyle}>User Agent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => {
                        const colors = actionColor(log.action);
                        return (
                          <tr
                            key={log._id}
                            style={{
                              backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                            }}
                          >
                            <td style={tdStyle}>
                              <span style={timestampStyle}>
                                {new Date(log.timestamp).toLocaleDateString()}
                              </span>
                              <span style={timeStyle}>
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={actionBadgeStyle(colors)}>
                                {actionLabel(log.action)}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <span style={ipStyle}>{log.ip}</span>
                            </td>
                            <td style={tdStyle}>
                              <span style={uaStyle} title={log.userAgent}>
                                {log.userAgent.length > 60
                                  ? log.userAgent.substring(0, 60) + '...'
                                  : log.userAgent}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* Empty state — no vault selected */}
        {!selectedVaultId && !loadingVaults && vaults.length > 0 && (
          <div style={emptyStateStyle}>
            <p style={mutedStyle}>Select a vault above to view its access history.</p>
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
  maxWidth: '900px',
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

const exportBtnStyle = {
  padding: '0.6rem 1.25rem',
  backgroundColor: '#ffffff',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  fontSize: '0.875rem',
  fontWeight: '500',
  cursor: 'pointer',
};

const selectorCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.25rem',
  marginBottom: '1rem',
};

const selectorLabelStyle = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '0.75rem',
};

const selectStyle = {
  width: '100%',
  padding: '0.65rem 0.875rem',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.9rem',
  color: '#111827',
  backgroundColor: '#ffffff',
  cursor: 'pointer',
};

const mutedStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  margin: 0,
};

const emptyVaultStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
};

const uploadBtnStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.875rem',
  cursor: 'pointer',
  width: 'fit-content',
};

const vaultSummaryStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.25rem',
  marginBottom: '1rem',
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '0.75rem',
};

const summaryRowStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.2rem',
};

const summaryLabelStyle = {
  fontSize: '0.75rem',
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const summaryValueStyle = {
  fontSize: '0.9rem',
  fontWeight: '600',
  color: '#111827',
  wordBreak: 'break-all',
};

const logsCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  overflow: 'hidden',
};

const logsHeaderStyle = {
  padding: '1rem 1.25rem',
  borderBottom: '1px solid #f3f4f6',
};

const logsCountStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#374151',
  margin: 0,
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
  padding: '0.75rem 1.25rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: '600',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  backgroundColor: '#f9fafb',
  borderBottom: '1px solid #e5e7eb',
};

const tdStyle = {
  padding: '0.875rem 1.25rem',
  borderBottom: '1px solid #f3f4f6',
  verticalAlign: 'top',
};

const timestampStyle = {
  display: 'block',
  fontWeight: '500',
  color: '#111827',
};

const timeStyle = {
  display: 'block',
  fontSize: '0.8rem',
  color: '#9ca3af',
  marginTop: '0.1rem',
};

const actionBadgeStyle = (colors) => ({
  backgroundColor: colors.bg,
  color: colors.text,
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.2rem 0.6rem',
  borderRadius: '999px',
  whiteSpace: 'nowrap',
});

const ipStyle = {
  fontFamily: 'monospace',
  fontSize: '0.85rem',
  color: '#374151',
};

const uaStyle = {
  fontSize: '0.78rem',
  color: '#6b7280',
  display: 'block',
  maxWidth: '280px',
};

const emptyLogsStyle = {
  padding: '3rem 2rem',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  alignItems: 'center',
};

const emptyStateStyle = {
  textAlign: 'center',
  padding: '3rem 2rem',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
};