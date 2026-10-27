import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { attendanceService } from '../../services/attendanceService';

const Topbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState({ loading: true, hasCheckedIn: false, hasCheckedOut: false });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTodayStatus();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const data = await attendanceService.getTodayStatus();
      if (data.success) {
        setAttendance({
          loading: false,
          hasCheckedIn: data.hasCheckedIn,
          hasCheckedOut: data.hasCheckedOut,
          record: data.record
        });
      }
    } catch (err) {
      setAttendance((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleQuickCheck = async () => {
    setActionLoading(true);
    try {
      if (!attendance.hasCheckedIn) {
        await attendanceService.checkIn();
      } else if (!attendance.hasCheckedOut) {
        await attendanceService.checkOut();
      }
      await fetchTodayStatus();
    } catch (err) {
      alert(err.response?.data?.message || 'Attendance action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <header className="staffsync-topbar d-flex align-items-center justify-content-between sticky-top">
      {/* Left section: Toggle & Breadcrumb */}
      <div className="d-flex align-items-center">
        <button
          className="btn btn-sm btn-light border me-3 d-lg-none"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation"
        >
          <i className="bi bi-list fs-5"></i>
        </button>
        <div className="d-none d-sm-block">
          <span className="badge bg-light text-primary border px-2.5 py-1.5 fw-semibold me-2">
            StaffSync Portal
          </span>
          <span className="text-muted small">Human Resource Management</span>
        </div>
      </div>

      {/* Right section: Attendance Quick-Action & Profile Chip */}
      <div className="d-flex align-items-center gap-3">
        {/* Quick Attendance Pill */}
        {!attendance.loading && (
          <div>
            {!attendance.hasCheckedIn ? (
              <button
                className="btn btn-primary btn-sm rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
                onClick={handleQuickCheck}
                disabled={actionLoading}
              >
                <i className="bi bi-box-arrow-in-right"></i>
                <span className="small fw-semibold">{actionLoading ? 'Saving...' : 'Clock In'}</span>
              </button>
            ) : !attendance.hasCheckedOut ? (
              <button
                className="btn btn-outline-danger btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5"
                onClick={handleQuickCheck}
                disabled={actionLoading}
              >
                <i className="bi bi-box-arrow-right"></i>
                <span className="small fw-semibold">{actionLoading ? 'Saving...' : 'Clock Out'}</span>
              </button>
            ) : (
              <span className="badge badge-soft-success px-3 py-1.5 rounded-pill d-flex align-items-center gap-1">
                <i className="bi bi-check-circle-fill"></i>
                <span>Completed Today</span>
              </span>
            )}
          </div>
        )}

        {/* User Chip */}
        <Link
          to="/profile"
          className="text-decoration-none d-flex align-items-center bg-light border rounded-pill py-1 px-2.5 hover-shadow"
          style={{ cursor: 'pointer' }}
        >
          <div
            className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2"
            style={{ width: '30px', height: '30px', backgroundColor: '#0d6efd', fontSize: '0.8rem' }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="d-none d-md-block text-start me-2">
            <div className="text-dark small fw-semibold lh-1 mb-0.5">{user?.name}</div>
            <div className="text-muted" style={{ fontSize: '0.7rem' }}>{user?.department}</div>
          </div>
          <i className="bi bi-gear-fill text-muted small"></i>
        </Link>
      </div>
    </header>
  );
};

export default Topbar;
