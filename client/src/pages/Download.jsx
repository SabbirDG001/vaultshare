import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Download() {
  const { token } = useParams();
  const [vaultInfo, setVaultInfo] = useState(null);
  const [status, setStatus] = useState('loading');
  const [passphrase, setPassphrase] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [burned, setBurned] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // ── Fetch vault info on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchVaultInfo = async () => {
      try {
        const res = await axios.get(
          `${API_URL}/vault/${token}`
        );
        setVaultInfo(res.data);
        setStatus('ready');
      } catch (error) {
        if (error.response?.status === 410) {
          setStatus('destroyed');
        } else if (error.response?.status === 404) {
          setStatus('notfound');
        } else {
          setStatus('error');
        }
      }
    };

    fetchVaultInfo();
  }, [token]);

  // ── Live countdown timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!vaultInfo?.expiryDate) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(vaultInfo.expiryDate);
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Expired');
        setStatus('destroyed');
        clearInterval(interval);
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [vaultInfo]);

  // ── Handle download ────────────────────────────────────────────────────────
  const handleDownload = async () => {
    if (vaultInfo?.hasPassphrase && !passphrase.trim()) {
      toast.error('Please enter the passphrase');
      return;
    }

    setDownloading(true);

    try {
      const res = await axios.post(
        `${API_URL}/vault/${token}/download`,
        { passphrase: passphrase.trim() || undefined },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', vaultInfo.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded successfully!');
      setBurned(true);
      setStatus('destroyed');

    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('Incorrect passphrase. Try again.');
      } else if (error.response?.status === 410) {
        setStatus('destroyed');
        toast.error('This vault has been destroyed.');
      } else {
        toast.error('Download failed. Please try again.');
      }
    } finally {
      setDownloading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // ── Render states ──────────────────────────────────────────────────────────

  if (status === 'loading') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={spinnerContainerStyle}>
            <p style={mutedTextStyle}>Verifying vault...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'notfound') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={statusIconStyle('#ef4444')}>✕</div>
          <h2 style={statusTitleStyle}>Vault not found</h2>
          <p style={mutedTextStyle}>
            This link does not exist. It may have been mistyped or never existed.
          </p>
        </div>
      </div>
    );
  }

  if (status === 'destroyed') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={statusIconStyle('#6b7280')}>🔥</div>
          <h2 style={statusTitleStyle}>
            {burned ? 'Vault destroyed' : 'This vault no longer exists'}
          </h2>
          <p style={mutedTextStyle}>
            {burned
              ? 'The file has been permanently deleted from our servers after your download.'
              : 'This vault has expired, reached its download limit, or was manually deleted.'}
          </p>
          <div style={destroyedBadgeStyle}>410 Gone</div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <div style={statusIconStyle('#f59e0b')}>!</div>
          <h2 style={statusTitleStyle}>Something went wrong</h2>
          <p style={mutedTextStyle}>
            Unable to load this vault. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  // ── Ready state ────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <div style={cardStyle}>

        {/* Header */}
        <div style={cardHeaderStyle}>
          <div style={lockIconStyle}>🔐</div>
          <h1 style={cardTitleStyle}>Secure Vault</h1>
          <p style={mutedTextStyle}>
            This file is encrypted with AES-256. It will be permanently
            deleted after download or expiry.
          </p>
        </div>

        {/* File info */}
        <div style={fileInfoCardStyle}>
          <div style={fileRowStyle}>
            <span style={fileLabelStyle}>File name</span>
            <span style={fileValueStyle}>{vaultInfo?.originalName}</span>
          </div>
          <div style={fileRowStyle}>
            <span style={fileLabelStyle}>File size</span>
            <span style={fileValueStyle}>{formatFileSize(vaultInfo?.fileSize)}</span>
          </div>
          <div style={fileRowStyle}>
            <span style={fileLabelStyle}>Downloads</span>
            <span style={fileValueStyle}>
              {vaultInfo?.downloadCount} / {vaultInfo?.maxDownloads}
            </span>
          </div>
          <div style={fileRowStyle}>
            <span style={fileLabelStyle}>Passphrase</span>
            <span style={fileValueStyle}>
              {vaultInfo?.hasPassphrase ? 'Required' : 'None'}
            </span>
          </div>
        </div>

        {/* Countdown timer */}
        {timeLeft && (
          <div style={timerCardStyle}>
            <p style={timerLabelStyle}>Vault destroys in</p>
            <p style={timerValueStyle}>{timeLeft}</p>
          </div>
        )}

        {/* Passphrase input */}
        {vaultInfo?.hasPassphrase && (
          <div style={passphraseContainerStyle}>
            <label style={passphraseLabelStyle}>
              Enter passphrase to unlock
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDownload()}
              style={passphraseInputStyle}
            />
          </div>
        )}

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={downloading}
          style={downloadBtnStyle(downloading)}
        >
          {downloading ? 'Decrypting & Downloading...' : 'Download File'}
        </button>

        {/* Warning */}
        <p style={warningTextStyle}>
          This file will be permanently deleted from our servers after
          reaching its download limit or expiry date.
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  backgroundColor: '#f9fafb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2rem 1rem',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '16px',
  padding: '2.5rem',
  width: '100%',
  maxWidth: '480px',
  textAlign: 'center',
};

const cardHeaderStyle = {
  marginBottom: '1.5rem',
};

const lockIconStyle = {
  fontSize: '2.5rem',
  marginBottom: '0.75rem',
};

const cardTitleStyle = {
  fontSize: '1.6rem',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 0.5rem',
};

const mutedTextStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0.5rem 0 0',
};

const fileInfoCardStyle = {
  backgroundColor: '#f9fafb',
  borderRadius: '10px',
  padding: '1rem 1.25rem',
  marginBottom: '1.25rem',
  textAlign: 'left',
};

const fileRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0.4rem 0',
  borderBottom: '1px solid #f3f4f6',
  fontSize: '0.875rem',
};

const fileLabelStyle = {
  color: '#6b7280',
};

const fileValueStyle = {
  color: '#111827',
  fontWeight: '500',
  wordBreak: 'break-all',
  maxWidth: '60%',
  textAlign: 'right',
};

const timerCardStyle = {
  backgroundColor: '#fef3c7',
  border: '1px solid #fcd34d',
  borderRadius: '10px',
  padding: '0.875rem',
  marginBottom: '1.25rem',
};

const timerLabelStyle = {
  fontSize: '0.75rem',
  color: '#92400e',
  margin: '0 0 0.25rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const timerValueStyle = {
  fontSize: '1.4rem',
  fontWeight: '700',
  color: '#92400e',
  margin: 0,
  fontFamily: 'monospace',
};

const passphraseContainerStyle = {
  marginBottom: '1.25rem',
  textAlign: 'left',
};

const passphraseLabelStyle = {
  display: 'block',
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#374151',
  marginBottom: '0.5rem',
};

const passphraseInputStyle = {
  width: '100%',
  padding: '0.65rem 0.875rem',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  boxSizing: 'border-box',
  color: '#111827',
};

const downloadBtnStyle = (disabled) => ({
  width: '100%',
  padding: '0.875rem',
  backgroundColor: disabled ? '#9ca3af' : '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: disabled ? 'not-allowed' : 'pointer',
  marginBottom: '1rem',
});

const warningTextStyle = {
  fontSize: '0.78rem',
  color: '#9ca3af',
  lineHeight: '1.5',
  margin: 0,
};

const spinnerContainerStyle = {
  padding: '2rem 0',
};

const statusIconStyle = (color) => ({
  fontSize: '2.5rem',
  color,
  marginBottom: '1rem',
});

const statusTitleStyle = {
  fontSize: '1.4rem',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 0.75rem',
};

const destroyedBadgeStyle = {
  display: 'inline-block',
  marginTop: '1rem',
  backgroundColor: '#f3f4f6',
  color: '#6b7280',
  fontSize: '0.8rem',
  fontWeight: '600',
  padding: '0.3rem 0.75rem',
  borderRadius: '999px',
  fontFamily: 'monospace',
};