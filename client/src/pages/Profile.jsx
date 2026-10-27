import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import { authService } from '../services/authService';
import StatusBadge from '../components/common/StatusBadge';
import AlertMessage from '../components/common/AlertMessage';

const Profile = () => {
  const { user, updateUserProfile, logout } = useAuth();

  // Contact Info Form State
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [contactLoading, setContactLoading] = useState(false);
  const [contactFeedback, setContactFeedback] = useState({ type: '', message: '' });

  // Password Change Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState({ type: '', message: '' });

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactLoading(true);
    setContactFeedback({ type: '', message: '' });
    try {
      const res = await employeeService.updateEmployee(user._id, { phone, address });
      if (res.success) {
        updateUserProfile({ phone, address });
        setContactFeedback({ type: 'success', message: 'Contact details updated successfully!' });
      }
    } catch (err) {
      setContactFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to update contact info.' });
    } finally {
      setContactLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: '', message: '' });

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'danger', message: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'danger', message: 'New password must be at least 6 characters long.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authService.changePassword({ currentPassword, newPassword });
      setPasswordFeedback({ type: 'success', message: res.message || 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Profile & Account Settings</h4>
          <p className="text-muted small mb-0">View your verified corporate credentials, update contact information, and manage your password.</p>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: ID Card & Contact Info */}
        <div className="col-12 col-lg-5">
          {/* Identity Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4 text-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold mx-auto mb-3 shadow"
              style={{ width: '80px', height: '80px', backgroundColor: '#1a2238', fontSize: '2rem' }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <h5 className="fw-bold text-dark mb-1">{user?.name}</h5>
            <div className="text-muted small mb-2">{user?.designation} • {user?.department}</div>
            <div className="d-flex justify-content-center gap-2 mb-3">
              <span className="badge bg-primary bg-opacity-10 text-primary border">{user?.roleDisplay || user?.role}</span>
              <StatusBadge status={user?.status} />
            </div>

            <div className="list-group list-group-flush text-start border-top pt-2">
              <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                <span className="text-muted">Employee ID</span>
                <span className="font-monospace fw-semibold">{user?.employeeId}</span>
              </div>
              <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                <span className="text-muted">Corporate Email</span>
                <span className="fw-medium text-truncate" style={{ maxWidth: '200px' }}>{user?.email}</span>
              </div>
              <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                <span className="text-muted">Joined Date</span>
                <span>{new Date(user?.joiningDate || user?.createdAt).toLocaleDateString()}</span>
              </div>
              {user?.manager && (
                <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                  <span className="text-muted">Reports To</span>
                  <span className="fw-medium">{user.manager.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Sign Out Card */}
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white text-center">
            <button
              onClick={logout}
              className="btn btn-outline-danger w-100 rounded-3 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Sign Out of StaffSync</span>
            </button>
          </div>
        </div>

        {/* Right Column: Editable Profile Details & Change Password */}
        <div className="col-12 col-lg-7">
          {/* Contact Details Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
            <h6 className="fw-bold mb-3 text-dark">Personal Contact Details</h6>
            <AlertMessage
              type={contactFeedback.type}
              message={contactFeedback.message}
              onClose={() => setContactFeedback({ type: '', message: '' })}
            />

            <form onSubmit={handleContactSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Phone Number</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-telephone text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0"
                    placeholder="+1-555-0100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">Residential Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="bi bi-geo-alt text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control bg-light border-start-0"
                    placeholder="123 University Drive, Tech City"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-sm rounded-pill px-4 shadow-sm"
                disabled={contactLoading}
              >
                {contactLoading ? 'Saving...' : 'Update Contact Info'}
              </button>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
            <h6 className="fw-bold mb-3 text-dark">Change Password</h6>
            <AlertMessage
              type={passwordFeedback.type}
              message={passwordFeedback.message}
              onClose={() => setPasswordFeedback({ type: '', message: '' })}
            />

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">Current Password</label>
                <input
                  type="password"
                  className="form-control form-control-sm bg-light"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">New Password (min 6 chars)</label>
                  <input
                    type="password"
                    className="form-control form-control-sm bg-light"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-control form-control-sm bg-light"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-outline-primary btn-sm rounded-pill px-4"
                disabled={passwordLoading}
              >
                {passwordLoading ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
