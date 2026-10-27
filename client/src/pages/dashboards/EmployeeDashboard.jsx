import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboardService';
import { attendanceService } from '../../services/attendanceService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';
import AlertMessage from '../../components/common/AlertMessage';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

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
      setFeedback({ type: 'danger', message: 'Failed to load dashboard data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendance = async (action) => {
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      if (action === 'check-in') {
        const res = await attendanceService.checkIn();
        setFeedback({ type: 'success', message: res.message || 'Checked in successfully!' });
      } else {
        const res = await attendanceService.checkOut();
        setFeedback({ type: 'success', message: res.message || 'Checked out successfully!' });
      }
      await loadDashboard();
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.response?.data?.message || 'Attendance action failed.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Employee dashboard..." />;

  const {
    todayAttendance = {},
    monthlySummary = {},
    leaveBalance = {},
    pendingLeavesCount = 0,
    trainings = {},
    recentLeaves = [],
    recentAnnouncements = []
  } = stats || {};

  return (
    <div>
      {/* Welcome Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Employee Portal</h4>
          <p className="text-muted small mb-0">Track your attendance, manage leave applications, and view assigned training modules.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/leaves" className="btn btn-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5 shadow-sm">
            <i className="bi bi-plus-circle-fill"></i>
            <span>Apply for Leave</span>
          </Link>
          <Link to="/attendance" className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5">
            <i className="bi bi-clock-history"></i>
            <span>My Attendance</span>
          </Link>
        </div>
      </div>

      <AlertMessage
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: '', message: '' })}
      />

      {/* Row 1: Today Attendance Card + Leave Balance Summary */}
      <div className="row g-3 mb-4">
        {/* Attendance Widget */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Today's Attendance Status</h6>
              <StatusBadge status={todayAttendance.status || 'absent'} />
            </div>

            <div className="p-3 rounded-3 bg-light border mb-3">
              <div className="row text-center">
                <div className="col-6 border-end">
                  <div className="text-muted small">Check In</div>
                  <div className="fw-bold mt-1 text-dark">
                    {todayAttendance.checkInTime
                      ? new Date(todayAttendance.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </div>
                </div>
                <div className="col-6">
                  <div className="text-muted small">Check Out</div>
                  <div className="fw-bold mt-1 text-dark">
                    {todayAttendance.checkOutTime
                      ? new Date(todayAttendance.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '--:--'}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button */}
            {!todayAttendance.checkedIn ? (
              <button
                className="btn btn-primary w-100 py-2 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={() => handleAttendance('check-in')}
                disabled={actionLoading}
              >
                <i className="bi bi-box-arrow-in-right fs-5"></i>
                <span>{actionLoading ? 'Processing...' : 'Clock In Now'}</span>
              </button>
            ) : !todayAttendance.checkedOut ? (
              <button
                className="btn btn-danger w-100 py-2 rounded-3 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                onClick={() => handleAttendance('check-out')}
                disabled={actionLoading}
              >
                <i className="bi bi-box-arrow-right fs-5"></i>
                <span>{actionLoading ? 'Processing...' : 'Clock Out for the Day'}</span>
              </button>
            ) : (
              <div className="text-center p-2 rounded-3 bg-light text-success fw-semibold small">
                <i className="bi bi-check-circle-fill me-1"></i> Completed: {todayAttendance.workingHours} hours worked today.
              </div>
            )}
          </div>
        </div>

        {/* Leave Balances Grid */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Leave Balances Available</h6>
              <span className="badge bg-light text-primary border">{pendingLeavesCount} Pending</span>
            </div>
            <div className="row g-2">
              {[
                { label: 'Annual Leave', val: leaveBalance.annual ?? 15, color: '#0d6efd', bg: '#e7f1ff' },
                { label: 'Sick Leave', val: leaveBalance.sick ?? 10, color: '#10b981', bg: '#dcfce7' },
                { label: 'Casual Leave', val: leaveBalance.casual ?? 10, color: '#ca8a04', bg: '#fef9c3' },
                { label: 'Unpaid / Other', val: leaveBalance.unpaid ?? 30, color: '#64748b', bg: '#f1f5f9' }
              ].map((item, idx) => (
                <div key={idx} className="col-6 col-sm-3">
                  <div className="p-3 rounded-3 text-center border" style={{ backgroundColor: item.bg }}>
                    <div className="fw-bold fs-4" style={{ color: item.color }}>{item.val}</div>
                    <small className="text-secondary fw-semibold" style={{ fontSize: '0.72rem' }}>{item.label}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-2 border-top d-flex justify-content-between text-muted small">
              <span>This Month: <strong>{monthlySummary.presentDays || 0} days</strong> present</span>
              <span>Total Hours: <strong>{monthlySummary.totalHoursWorked || 0} hrs</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Recent Leaves & Enrolled Trainings */}
      <div className="row g-3">
        {/* Recent Leaves */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">My Leave Applications</h6>
              <Link to="/leaves" className="text-primary text-decoration-none small fw-semibold">View All</Link>
            </div>
            {recentLeaves.length === 0 ? (
              <p className="text-muted small mb-0 py-3 text-center">No leave requests recorded.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm staffsync-table mb-0">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeaves.map((l) => (
                      <tr key={l._id}>
                        <td className="small text-capitalize fw-semibold">{l.leaveType}</td>
                        <td className="small text-muted">
                          {new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} ({l.totalDays}d)
                        </td>
                        <td><StatusBadge status={l.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Assigned Trainings */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Assigned Training Modules</h6>
              <Link to="/trainings" className="text-primary text-decoration-none small fw-semibold">Open Learning</Link>
            </div>
            <div className="row g-2 mb-3 text-center">
              <div className="col-6">
                <div className="p-2.5 rounded-3 bg-light border">
                  <div className="fw-bold text-primary fs-5">{trainings.totalAssigned || 0}</div>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>Total Enrolled</small>
                </div>
              </div>
              <div className="col-6">
                <div className="p-2.5 rounded-3 bg-light border">
                  <div className="fw-bold text-success fs-5">{trainings.completed || 0}</div>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>Completed</small>
                </div>
              </div>
            </div>

            {recentAnnouncements.length > 0 && (
              <div className="border-top pt-2">
                <div className="small fw-semibold text-secondary mb-2">Latest Notice:</div>
                <div className="p-2 rounded-2 bg-light border small text-truncate">
                  <i className="bi bi-megaphone-fill text-primary me-2"></i>
                  {recentAnnouncements[0].title}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
