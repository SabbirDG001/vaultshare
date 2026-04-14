import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      height: '60px',
      borderBottom: '1px solid #e5e7eb',
      backgroundColor: '#ffffff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ fontWeight: '700', fontSize: '1.2rem', color: '#4f46e5', textDecoration: 'none' }}>
        VaultShare
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {isAuthenticated ? (
          <>
            <Link to="/upload" style={linkStyle}>Upload</Link>
            <Link to="/dashboard" style={linkStyle}>Dashboard</Link>
            <Link to="/audit" style={linkStyle}>Audit Log</Link>
            {isAdmin && <Link to="/admin" style={{ ...linkStyle, color: '#dc2626' }}>Admin</Link>}
            <Link to="/profile" style={linkStyle}>{user?.name}</Link>
            <button onClick={logout} style={btnStyle}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={linkStyle}>Login</Link>
            <Link to="/register" style={{ ...btnStyle, textDecoration: 'none', display: 'inline-block', lineHeight: '1' }}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const linkStyle = {
  color: '#374151',
  textDecoration: 'none',
  fontSize: '0.9rem',
};

const btnStyle = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '6px',
  padding: '0.4rem 1rem',
  fontSize: '0.9rem',
  cursor: 'pointer',
};