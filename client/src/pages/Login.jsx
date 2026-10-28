import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/common/AlertMessage';
import Logo from '../components/common/Logo';
import DemoSelector from '../components/auth/DemoSelector';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingRole, setLoadingRole] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
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

  // Handler for 1-click Demo Role Login
  const handleSelectDemoRole = async (role) => {
    setError('');
    setEmail(role.email);
    setPassword(role.password);
    setLoadingRole(role.id);

    try {
      await login(role.email, role.password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(`Demo login failed: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div
      className="d-flex align-items-center justify-content-center p-3 p-md-4"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1d',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(13, 110, 253, 0.22) 0px, transparent 55%),
          radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.18) 0px, transparent 55%),
          radial-gradient(at 50% 50%, rgba(15, 23, 42, 0.8) 0px, #0a0f1d 100%)
        `
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{
          maxWidth: '1000px',
          width: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div className="row g-0">
          {/* Left Column: Brand Hero & Value Proposition (Visible on lg screens) */}
          <div
            className="col-lg-5 d-none d-lg-flex flex-column justify-content-between p-4 p-xl-5 text-white"
            style={{
              backgroundColor: '#0f172a',
              backgroundImage: `
                radial-gradient(circle at 10% 20%, rgba(13, 110, 253, 0.35) 0%, transparent 45%),
                radial-gradient(circle at 90% 80%, rgba(99, 102, 241, 0.25) 0%, transparent 45%),
                linear-gradient(180deg, #0b1329 0%, #111c38 100%)
              `,
              borderRight: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Top Brand */}
            <div>
              <Logo size="lg" theme="light" showWordmark={true} />

              <div className="mt-4 pt-2">
                <span
                  className="badge rounded-pill mb-2 px-3 py-1.5"
                  style={{
                    backgroundColor: 'rgba(13, 110, 253, 0.18)',
                    color: '#60a5fa',
                    border: '1px solid rgba(13, 110, 253, 0.35)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.04em'
                  }}
                >
                  Enterprise HR Solution
                </span>
                <h3 className="fw-bold lh-sm text-white mb-3" style={{ fontSize: '1.65rem', letterSpacing: '-0.02em' }}>
                  The Modern Operating System for Teams.
                </h3>
                <p className="text-secondary small mb-4" style={{ lineHeight: 1.6, color: '#94a3b8' }}>
                  Streamline human resources with automated attendance clock-in, leave approval workflows, employee directory, and live role dashboards.
                </p>
              </div>

              {/* Value Proposition Highlights */}
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', backgroundColor: 'rgba(13, 110, 253, 0.2)', color: '#38bdf8' }}
                  >
                    <i className="bi bi-clock-history small"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-white small">Attendance & Daily Hours</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>1-click clock in/out with automated working duration logging.</div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}
                  >
                    <i className="bi bi-calendar2-check small"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-white small">Automated Leave Approvals</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Real-time balance deduction and role-scoped supervisor reviews.</div>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-2.5">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{ width: '28px', height: '28px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399' }}
                  >
                    <i className="bi bi-shield-lock small"></i>
                  </div>
                  <div>
                    <div className="fw-semibold text-white small">Role-Based Security (RBAC)</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Cryptographic JWT tokens enforcing HR, Manager, and Employee access.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Proof Tag */}
            <div className="pt-4 mt-4 border-top border-secondary border-opacity-25 d-flex align-items-center justify-content-between text-muted" style={{ fontSize: '0.725rem' }}>
              <span>StaffSync v1.0 • MERN Stack</span>
              <span className="text-success d-flex align-items-center gap-1">
                <span className="spinner-grow spinner-grow-sm text-success" style={{ width: '6px', height: '6px' }}></span>
                Backend Live
              </span>
            </div>
          </div>

          {/* Right Column: Interactive Login & Demo Selector */}
          <div className="col-12 col-lg-7 p-4 p-md-5 d-flex flex-column justify-content-between">
            <div>
              {/* Mobile Brand Header (Visible below lg) */}
              <div className="d-lg-none text-center mb-3">
                <Logo size="md" theme="dark" showWordmark={true} className="justify-content-center" />
              </div>

              {/* Title & Subtitle */}
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h4 className="fw-bold text-dark mb-0">Sign In</h4>
                  <p className="text-muted small mb-0">Access your organization portal</p>
                </div>
                <Link
                  to="/register"
                  className="btn btn-outline-primary btn-sm rounded-pill px-3 py-1.5 fw-semibold"
                  style={{ fontSize: '0.8rem' }}
                >
                  Create Account
                </Link>
              </div>

              {/* Priority 1: Interactive Live Demo Selector */}
              <DemoSelector onSelectRole={handleSelectDemoRole} loadingRole={loadingRole} />

              {/* Divider */}
              <div className="position-relative text-center my-3">
                <hr className="border-secondary border-opacity-25 my-0" />
                <span
                  className="position-absolute top-50 start-50 translate-middle px-3 bg-white text-muted fw-semibold"
                  style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}
                >
                  OR SIGN IN MANUALLY
                </span>
              </div>

              {/* Error Feedback */}
              <AlertMessage type="danger" message={error} onClose={() => setError('')} />

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary mb-1">Corporate Email</label>
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
                      disabled={submitting || Boolean(loadingRole)}
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
                      type={showPassword ? 'text' : 'password'}
                      className="form-control bg-light border-start-0 border-end-0"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      disabled={submitting || Boolean(loadingRole)}
                    />
                    <button
                      type="button"
                      className="input-group-text bg-light border-start-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <i className={`bi bi-eye${showPassword ? '-slash' : ''} text-muted`}></i>
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                  disabled={submitting || Boolean(loadingRole)}
                  style={{
                    backgroundColor: '#0d6efd',
                    borderColor: '#0d6efd',
                    boxShadow: '0 4px 14px rgba(13, 110, 253, 0.35)'
                  }}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      <span>Authenticating Session...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Portal</span>
                      <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Bottom Quick Links */}
            <div className="mt-4 pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
              <div>
                <span>New employee? </span>
                <Link to="/register" className="fw-semibold text-primary text-decoration-none">
                  Register Account
                </Link>
              </div>
              <div className="text-secondary">
                StaffSync HRMS Enterprise • 2026
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
