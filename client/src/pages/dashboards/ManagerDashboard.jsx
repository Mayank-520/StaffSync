import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

const ManagerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await dashboardService.getStats();
      if (data.success) {
        setStats(data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load manager dashboard.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Manager dashboard..." />;
  if (error) {
    return <div className="alert alert-danger rounded-3">{error}</div>;
  }

  const { overview = {}, teamMembers = [], recentTeamLeaves = [], announcements = [] } = stats || {};

  return (
    <div>
      {/* Welcome Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Manager Dashboard</h4>
          <p className="text-muted small mb-0">Department: <strong className="text-primary">{overview.department}</strong> • Team Performance & Approvals</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/leaves" className="btn btn-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5 shadow-sm">
            <i className="bi bi-check2-circle"></i>
            <span>Team Approvals</span>
          </Link>
          <Link to="/attendance" className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5">
            <i className="bi bi-calendar-check"></i>
            <span>Team Attendance</span>
          </Link>
        </div>
      </div>

      {/* Team KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="staffsync-stat-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Team Members</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#e7f1ff', color: '#0d6efd' }}>
                <i className="bi bi-people-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{overview.teamSize || 0}</h3>
            <div className="small text-muted">{overview.department} Department</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="staffsync-stat-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Present Today</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>
                <i className="bi bi-person-check-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{overview.teamPresentToday || 0}</h3>
            <div className="small text-muted">{overview.teamAbsentToday || 0} absent / on leave</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="staffsync-stat-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Pending Leaves</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}>
                <i className="bi bi-envelope-exclamation-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{overview.teamPendingLeaves || 0}</h3>
            <div className="small text-muted">Awaiting your approval</div>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-xl-3">
          <div className="staffsync-stat-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Training Status</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                <i className="bi bi-award-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{teamMembers.length}</h3>
            <div className="small text-muted">Track team enrollment</div>
          </div>
        </div>
      </div>

      {/* Team Roster & Pending Leaves */}
      <div className="row g-3">
        {/* Team Members */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Authorized Team Members</h6>
              <Link to="/employees" className="text-primary text-decoration-none small fw-semibold">View All</Link>
            </div>
            {teamMembers.length === 0 ? (
              <p className="text-muted small mb-0 py-3 text-center">No team members assigned.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm staffsync-table mb-0">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>ID</th>
                      <th>Designation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m) => (
                      <tr key={m._id}>
                        <td>
                          <div className="fw-semibold small text-dark">{m.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{m.email}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.75rem' }}>
                            {m.employeeId}
                          </span>
                        </td>
                        <td className="small text-muted">{m.designation}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Team Leave Requests</h6>
              <Link to="/leaves" className="text-primary text-decoration-none small fw-semibold">Review</Link>
            </div>
            {recentTeamLeaves.length === 0 ? (
              <p className="text-muted small mb-0 py-3 text-center">No pending leave requests from your team.</p>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {recentTeamLeaves.map((l) => (
                  <div key={l._id} className="p-2.5 rounded-3 bg-light border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold small">{l.user?.name}</span>
                      <StatusBadge status={l.status} />
                    </div>
                    <div className="text-muted small mb-1" style={{ fontSize: '0.78rem' }}>
                      <span className="text-capitalize">{l.leaveType}</span> • {l.totalDays} day(s)
                    </div>
                    <p className="text-muted small mb-0 fst-italic text-truncate">"{l.reason}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
