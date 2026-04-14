import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import axiosInstance from '../utils/axiosInstance';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const password = watch('password');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      login(res.data.token, res.data.user);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={titleStyle}>Create an account</h1>
        <p style={subtitleStyle}>Start sharing files securely with VaultShare</p>

        <form onSubmit={handleSubmit(onSubmit)} style={formStyle}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Full name</label>
            <input
              type="text"
              placeholder="Dragon"
              style={inputStyle(!!errors.name)}
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Minimum 2 characters' },
              })}
            />
            {errors.name && <span style={errorStyle}>{errors.name.message}</span>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              style={inputStyle(!!errors.email)}
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' },
              })}
            />
            {errors.email && <span style={errorStyle}>{errors.email.message}</span>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              style={inputStyle(!!errors.password)}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' },
              })}
            />
            {errors.password && <span style={errorStyle}>{errors.password.message}</span>}
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Confirm password</label>
            <input
              type="password"
              placeholder="••••••••"
              style={inputStyle(!!errors.confirmPassword)}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === password || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && <span style={errorStyle}>{errors.confirmPassword.message}</span>}
          </div>

          <button type="submit" disabled={loading} style={submitStyle}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none', fontWeight: '500' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#f9fafb',
  padding: '2rem',
};

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  padding: '2.5rem',
  width: '100%',
  maxWidth: '420px',
};

const titleStyle = {
  fontSize: '1.6rem',
  fontWeight: '700',
  color: '#111827',
  margin: '0 0 0.5rem',
};

const subtitleStyle = {
  fontSize: '0.9rem',
  color: '#6b7280',
  margin: '0 0 2rem',
};

const formStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
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
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  color: '#111827',
});

const errorStyle = {
  fontSize: '0.8rem',
  color: '#ef4444',
};

const submitStyle = {
  backgroundColor: '#4f46e5',
  color: '#ffffff',
  border: 'none',
  borderRadius: '8px',
  padding: '0.75rem',
  fontSize: '1rem',
  fontWeight: '600',
  cursor: 'pointer',
  marginTop: '0.5rem',
};