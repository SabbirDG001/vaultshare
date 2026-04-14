import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';

const EXPIRY_OPTIONS = [
  { label: '1 Hour', value: '1h' },
  { label: '6 Hours', value: '6h' },
  { label: '24 Hours', value: '24h' },
  { label: '7 Days', value: '7d' },
];

const DOWNLOAD_OPTIONS = [1, 3, 5, 10];

export default function Upload() {
  const [file, setFile] = useState(null);
  const [duration, setDuration] = useState('24h');
  const [maxDownloads, setMaxDownloads] = useState(1);
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [vaultResult, setVaultResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setVaultResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    maxSize: 50 * 1024 * 1024,
    onDropRejected: (rejectedFiles) => {
      const error = rejectedFiles[0]?.errors[0];
      if (error?.code === 'file-too-large') {
        toast.error('File is too large. Maximum size is 50MB.');
      } else {
        toast.error('File rejected: ' + error?.message);
      }
    },
  });

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('duration', duration);
      formData.append('maxDownloads', maxDownloads);
      if (passphrase.trim()) {
        formData.append('passphrase', passphrase.trim());
      }

      const res = await axiosInstance.post('/vault/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percent);
        },
      });

      setVaultResult(res.data);
      setFile(null);
      setPassphrase('');
      toast.success('File encrypted and vault created!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const vaultLink = vaultResult
    ? `${window.location.origin}/vault/${vaultResult.linkToken}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(vaultLink);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleReset = () => {
    setVaultResult(null);
    setFile(null);
    setPassphrase('');
    setDuration('24h');
    setMaxDownloads(1);
  };

  return (
    <div style={pageStyle}>
      <div style={containerStyle}>
        <h1 style={titleStyle}>Upload a Vault</h1>
        <p style={subtitleStyle}>
          Your file will be encrypted with AES-256 before being stored.
          Share the generated link with your recipient.
        </p>

        {/* ── Success Result ── */}
        {vaultResult && (
          <div style={resultCardStyle}>
            <div style={resultHeaderStyle}>
              <span style={successBadgeStyle}>Vault Created</span>
              <p style={resultTitleStyle}>{vaultResult.originalName}</p>
            </div>

            <div style={resultInfoStyle}>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Expires</span>
                <span style={infoValueStyle}>
                  {new Date(vaultResult.expiryDate).toLocaleString()}
                </span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Max downloads</span>
                <span style={infoValueStyle}>{vaultResult.maxDownloads}</span>
              </div>
              <div style={infoRowStyle}>
                <span style={infoLabelStyle}>Passphrase</span>
                <span style={infoValueStyle}>
                  {vaultResult.hasPassphrase ? 'Protected' : 'None'}
                </span>
              </div>
            </div>

            <div style={linkBoxStyle}>
              <span style={linkTextStyle}>{vaultLink}</span>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button onClick={handleCopy} style={copyBtnStyle}>
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
              <button onClick={handleReset} style={resetBtnStyle}>
                Upload Another
              </button>
            </div>
          </div>
        )}

        {/* ── Upload Form ── */}
        {!vaultResult && (
          <>
            {/* Dropzone */}
            <div {...getRootProps()} style={dropzoneStyle(isDragActive)}>
              <input {...getInputProps()} />
              {file ? (
                <div style={fileInfoStyle}>
                  <p style={fileNameStyle}>{file.name}</p>
                  <p style={fileSizeStyle}>{formatFileSize(file.size)}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                    style={removeFileStyle}
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div style={dropPromptStyle}>
                  <div style={uploadIconStyle}>↑</div>
                  <p style={dropTextStyle}>
                    {isDragActive
                      ? 'Drop your file here...'
                      : 'Drag and drop a file here, or click to browse'}
                  </p>
                  <p style={dropHintStyle}>Maximum file size: 50MB</p>
                </div>
              )}
            </div>

            {/* Settings */}
            <div style={settingsStyle}>
              {/* Expiry */}
              <div style={settingGroupStyle}>
                <label style={settingLabelStyle}>Expiry duration</label>
                <div style={optionRowStyle}>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDuration(opt.value)}
                      style={optionBtnStyle(duration === opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Max Downloads */}
              <div style={settingGroupStyle}>
                <label style={settingLabelStyle}>Max downloads</label>
                <div style={optionRowStyle}>
                  {DOWNLOAD_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setMaxDownloads(opt)}
                      style={optionBtnStyle(maxDownloads === opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passphrase */}
              <div style={settingGroupStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label style={settingLabelStyle}>Passphrase protection</label>
                  <button
                    onClick={() => {
                      setShowPassphrase(!showPassphrase);
                      if (showPassphrase) setPassphrase('');
                    }}
                    style={toggleBtnStyle(showPassphrase)}
                  >
                    {showPassphrase ? 'Remove' : 'Add'}
                  </button>
                </div>
                {showPassphrase && (
                  <input
                    type="password"
                    placeholder="Enter a passphrase for the recipient"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    style={passphraseInputStyle}
                  />
                )}
              </div>
            </div>

            {/* Progress Bar */}
            {uploading && (
              <div style={progressContainerStyle}>
                <div style={progressBarStyle}>
                  <div style={progressFillStyle(progress)} />
                </div>
                <p style={progressTextStyle}>
                  {progress < 100 ? `Uploading... ${progress}%` : 'Encrypting...'}
                </p>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              style={uploadBtnStyle(uploading || !file)}
            >
              {uploading ? 'Encrypting & Uploading...' : 'Encrypt & Upload'}
            </button>
          </>
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
  maxWidth: '640px',
  margin: '0 auto',
};

const titleStyle = {
  fontSize: '1.8rem',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 0.5rem',
};

const subtitleStyle = {
  fontSize: '0.95rem',
  color: '#6b7280',
  margin: '0 0 2rem',
  lineHeight: '1.6',
};

const dropzoneStyle = (isDragActive) => ({
  border: `2px dashed ${isDragActive ? '#4f46e5' : '#d1d5db'}`,
  borderRadius: '12px',
  padding: '2.5rem',
  textAlign: 'center',
  cursor: 'pointer',
  backgroundColor: isDragActive ? '#eef2ff' : '#ffffff',
  transition: 'all 0.2s ease',
  marginBottom: '1.5rem',
});

const dropPromptStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.5rem',
};

const uploadIconStyle = {
  fontSize: '2rem',
  color: '#9ca3af',
};

const dropTextStyle = {
  fontSize: '0.95rem',
  color: '#374151',
  margin: 0,
};

const dropHintStyle = {
  fontSize: '0.8rem',
  color: '#9ca3af',
  margin: 0,
};

const fileInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '0.4rem',
};

const fileNameStyle = {
  fontSize: '1rem',
  fontWeight: '600',
  color: '#111827',
  margin: 0,
  wordBreak: 'break-all',
};

const fileSizeStyle = {
  fontSize: '0.85rem',
  color: '#6b7280',
  margin: 0,
};

const removeFileStyle = {
  background: 'none',
  border: 'none',
  color: '#ef4444',
  cursor: 'pointer',
  fontSize: '0.85rem',
  marginTop: '0.25rem',
};

const settingsStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem',
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const settingGroupStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.6rem',
};

const settingLabelStyle = {
  fontSize: '0.875rem',
  fontWeight: '500',
  color: '#374151',
};

const optionRowStyle = {
  display: 'flex',
  gap: '0.5rem',
  flexWrap: 'wrap',
};

const optionBtnStyle = (active) => ({
  padding: '0.4rem 1rem',
  borderRadius: '6px',
  border: `1px solid ${active ? '#4f46e5' : '#d1d5db'}`,
  backgroundColor: active ? '#4f46e5' : '#ffffff',
  color: active ? '#ffffff' : '#374151',
  fontSize: '0.875rem',
  cursor: 'pointer',
  fontWeight: active ? '600' : '400',
});

const toggleBtnStyle = (active) => ({
  padding: '0.25rem 0.75rem',
  borderRadius: '6px',
  border: `1px solid ${active ? '#ef4444' : '#4f46e5'}`,
  backgroundColor: 'transparent',
  color: active ? '#ef4444' : '#4f46e5',
  fontSize: '0.8rem',
  cursor: 'pointer',
});

const passphraseInputStyle = {
  padding: '0.6rem 0.875rem',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  width: '100%',
  boxSizing: 'border-box',
  color: '#111827',
};

const progressContainerStyle = {
  marginBottom: '1rem',
};

const progressBarStyle = {
  height: '6px',
  backgroundColor: '#e5e7eb',
  borderRadius: '3px',
  overflow: 'hidden',
  marginBottom: '0.4rem',
};

const progressFillStyle = (progress) => ({
  height: '100%',
  width: `${progress}%`,
  backgroundColor: '#4f46e5',
  borderRadius: '3px',
  transition: 'width 0.3s ease',
});

const progressTextStyle = {
  fontSize: '0.85rem',
  color: '#6b7280',
  textAlign: 'center',
  margin: 0,
};

const uploadBtnStyle = (disabled) => ({
  width: '100%',
  padding: '0.875rem',
  backgroundColor: disabled ? '#9ca3af' : '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '10px',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: disabled ? 'not-allowed' : 'pointer',
});

const resultCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #d1fae5',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem',
};

const resultHeaderStyle = {
  marginBottom: '1rem',
};

const successBadgeStyle = {
  backgroundColor: '#d1fae5',
  color: '#065f46',
  fontSize: '0.75rem',
  fontWeight: '600',
  padding: '0.25rem 0.75rem',
  borderRadius: '999px',
};

const resultTitleStyle = {
  fontSize: '1.1rem',
  fontWeight: '600',
  color: '#111827',
  margin: '0.75rem 0 0',
  wordBreak: 'break-all',
};

const resultInfoStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '0.875rem',
};

const infoLabelStyle = {
  color: '#6b7280',
};

const infoValueStyle = {
  color: '#111827',
  fontWeight: '500',
};

const linkBoxStyle = {
  backgroundColor: '#f3f4f6',
  borderRadius: '8px',
  padding: '0.75rem 1rem',
  wordBreak: 'break-all',
};

const linkTextStyle = {
  fontSize: '0.8rem',
  color: '#4f46e5',
  fontFamily: 'monospace',
};

const copyBtnStyle = {
  flex: 1,
  padding: '0.6rem',
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '0.9rem',
  fontWeight: '600',
  cursor: 'pointer',
};

const resetBtnStyle = {
  flex: 1,
  padding: '0.6rem',
  backgroundColor: 'transparent',
  color: '#4f46e5',
  border: '1px solid #4f46e5',
  borderRadius: '8px',
  fontSize: '0.9rem',
  cursor: 'pointer',
};