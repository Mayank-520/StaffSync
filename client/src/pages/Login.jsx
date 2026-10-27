import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/common/AlertMessage';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If already authenticated, redirect
  const from = location.state?.from?.pathname || '/dashboard';
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both corporate email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center p-3"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0e1526',
        backgroundImage: 'radial-gradient(at 0% 0%, #1a2238 0px, transparent 50%), radial-gradient(at 100% 100%, #162447 0px, transparent 50%)'
      }}
    >
      <div className="card border-0 shadow-lg rounded-4 p-4 p-md-5" style={{ maxWidth: '440px', width: '100%', backgroundColor: '#ffffff' }}>
        {/* Brand Header */}
        <div className="text-center mb-4">
          <div
            className="mx-auto mb-3"
            style={{
              width: '56px',
              height: '56px',
              backgroundColor: '#0d6efd',
              borderRadius: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '1.75rem',
              color: '#ffffff',
              boxShadow: '0 8px 16px rgba(13, 110, 253, 0.35)'
            }}
          >
            S
          </div>
          <h3 className="fw-bold text-dark mb-1">StaffSync</h3>
          <p className="text-muted small mb-0">Modern Human Resource Management Solution</p>
        </div>

        {/* Error Feedback */}
        <AlertMessage type="danger" message={error} onClose={() => setError('')} />

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-secondary">Corporate Email</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-envelope text-muted"></i>
              </span>
              <input
                type="email"
                className="form-control bg-light border-start-0"
                placeholder="name@staffsync.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label small fw-semibold text-secondary mb-0">Password</label>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-lock text-muted"></i>
              </span>
              <input
                type="password"
                className="form-control bg-light border-start-0"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to Portal</span>
                <i className="bi bi-arrow-right"></i>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 pt-3 border-top text-center text-muted" style={{ fontSize: '0.75rem' }}>
          StaffSync HRMS • College Project Edition
        </div>
      </div>
    </div>
  );
};

export default Login;
