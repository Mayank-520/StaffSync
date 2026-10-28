import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AlertMessage from '../components/common/AlertMessage';
import Logo from '../components/common/Logo';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: 'Engineering',
    designation: 'Software Engineer',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validations
    if (!formData.name.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!formData.email.trim()) {
      setError('Please provide your corporate email address.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setSubmitting(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        department: formData.department.trim(),
        designation: formData.designation.trim(),
        password: formData.password
      });

      setSuccess('Account created successfully! Redirecting to your employee dashboard...');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
      setSubmitting(false);
    }
  };

  const departments = [
    'Engineering',
    'Human Resources',
    'Product Management',
    'Operations',
    'Finance & Accounting',
    'Marketing & Sales',
    'Customer Success'
  ];

  return (
    <div
      className="d-flex align-items-center justify-content-center p-3 p-md-4"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0f1d',
        backgroundImage: `
          radial-gradient(at 0% 0%, rgba(13, 110, 253, 0.25) 0px, transparent 55%),
          radial-gradient(at 100% 100%, rgba(99, 102, 241, 0.2) 0px, transparent 55%),
          radial-gradient(at 50% 50%, rgba(15, 23, 42, 0.8) 0px, #0a0f1d 100%)
        `
      }}
    >
      <div
        className="card border-0 shadow-lg rounded-4 overflow-hidden"
        style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)'
        }}
      >
        {/* Card Header with Logo */}
        <div className="p-4 p-md-4.5 pb-0 text-center">
          <div className="d-flex justify-content-center mb-2">
            <Logo size="lg" theme="dark" showWordmark={true} />
          </div>
          <h4 className="fw-bold text-dark mt-2 mb-1">Create Employee Account</h4>
          <p className="text-muted small mb-3">
            Register for access to your personal StaffSync employee self-service portal
          </p>

          <div
            className="alert alert-info py-2 px-3 small rounded-3 d-flex align-items-center gap-2 mb-3 text-start"
            style={{ fontSize: '0.785rem' }}
          >
            <i className="bi bi-info-circle-fill text-info flex-shrink-0"></i>
            <div>
              <strong>Security Policy:</strong> Public registration assigns the standard <strong>Employee</strong> role. Management and HR privileges are provisioned internally by an administrator.
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="px-4 px-md-4.5 pb-4">
          <AlertMessage type="danger" message={error} onClose={() => setError('')} />
          <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

          <form onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary mb-1">Full Legal Name</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-person text-muted"></i>
                </span>
                <input
                  type="text"
                  name="name"
                  className="form-control bg-light border-start-0"
                  placeholder="e.g. Alex Johnson"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Corporate Email */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary mb-1">Corporate Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-envelope text-muted"></i>
                </span>
                <input
                  type="email"
                  name="email"
                  className="form-control bg-light border-start-0"
                  placeholder="alex.johnson@staffsync.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Department & Designation in 2-column grid */}
            <div className="row g-2 mb-3">
              <div className="col-12 col-sm-6">
                <label className="form-label small fw-semibold text-secondary mb-1">Department</label>
                <select
                  name="department"
                  className="form-select bg-light"
                  value={formData.department}
                  onChange={handleChange}
                >
                  {departments.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-12 col-sm-6">
                <label className="form-label small fw-semibold text-secondary mb-1">Designation</label>
                <input
                  type="text"
                  name="designation"
                  className="form-control bg-light"
                  placeholder="e.g. Software Engineer"
                  value={formData.designation}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary mb-1">Account Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock text-muted"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-control bg-light border-start-0 border-end-0"
                  placeholder="Min. 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
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

            {/* Confirm Password */}
            <div className="mb-4">
              <label className="form-label small fw-semibold text-secondary mb-1">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-shield-lock text-muted"></i>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  className="form-control bg-light border-start-0"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2.5 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
              disabled={submitting}
              style={{
                backgroundColor: '#0d6efd',
                borderColor: '#0d6efd',
                boxShadow: '0 4px 14px rgba(13, 110, 253, 0.35)'
              }}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span>Creating Employee Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <i className="bi bi-arrow-right"></i>
                </>
              )}
            </button>
          </form>

          {/* Switch to Sign In */}
          <div className="text-center mt-3 pt-3 border-top">
            <span className="text-muted small">Already have an account? </span>
            <Link to="/login" className="small fw-semibold text-primary text-decoration-none">
              Sign In to Portal
            </Link>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-light py-2.5 px-4 text-center border-top text-muted" style={{ fontSize: '0.725rem' }}>
          StaffSync HRMS Enterprise • 2026 College Project Edition
        </div>
      </div>
    </div>
  );
};

export default Register;
