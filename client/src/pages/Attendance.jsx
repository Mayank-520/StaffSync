import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { attendanceService } from '../services/attendanceService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import AlertMessage from '../components/common/AlertMessage';

const Attendance = () => {
  const { user } = useAuth();
  const isSupervisor = ['admin', 'manager'].includes(user?.role);

  const [activeTab, setActiveTab] = useState('my-attendance');
  const [todayStatus, setTodayStatus] = useState(null);
  const [myHistory, setMyHistory] = useState([]);
  const [teamHistory, setTeamHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    loadAttendanceData();
  }, [activeTab, filterMonth, filterYear, filterStatus]);

  const loadAttendanceData = async () => {
    setLoading(true);
    try {
      // 1. Load today's status
      const todayData = await attendanceService.getTodayStatus();
      if (todayData.success) {
        setTodayStatus(todayData);
      }

      // 2. Load tab specific history
      if (activeTab === 'my-attendance') {
        const historyData = await attendanceService.getMyHistory({
          month: filterMonth,
          year: filterYear
        });
        if (historyData.success) {
          setMyHistory(historyData.records || []);
        }
      } else if (isSupervisor) {
        const params = {};
        if (filterStatus) params.status = filterStatus;
        const teamData = await attendanceService.getTeamAttendance(params);
        if (teamData.success) {
          setTeamHistory(teamData.records || []);
        }
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load attendance logs.' });
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceAction = async (action) => {
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      if (action === 'check-in') {
        const res = await attendanceService.checkIn();
        setFeedback({ type: 'success', message: res.message || 'Clocked in successfully!' });
      } else {
        const res = await attendanceService.checkOut();
        setFeedback({ type: 'success', message: res.message || 'Clocked out successfully!' });
      }
      await loadAttendanceData();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Attendance action failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Attendance Management</h4>
          <p className="text-muted small mb-0">Record your work presence, view daily duration, and track historical attendance logs.</p>
        </div>
      </div>

      <AlertMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* Today's Clock In/Out Banner Card */}
      <div className="card border-0 shadow-sm rounded-4 p-4 mb-4 bg-white">
        <div className="row align-items-center g-3">
          <div className="col-12 col-md-4 border-md-end">
            <span className="text-muted small fw-semibold text-uppercase d-block mb-1">Today's Presence</span>
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold mb-0 text-dark">
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </h5>
              <StatusBadge status={todayStatus?.record?.status || 'absent'} />
            </div>
            <div className="text-muted small mt-1">
              Working Hours: <strong>{todayStatus?.record?.workingHours || 0} hrs</strong>
            </div>
          </div>

          <div className="col-12 col-md-4 border-md-end">
            <div className="row text-center">
              <div className="col-6 border-end">
                <span className="text-muted small">Clock In</span>
                <div className="fw-bold fs-5 text-dark mt-0.5">
                  {todayStatus?.record?.checkIn
                    ? new Date(todayStatus.record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </div>
              </div>
              <div className="col-6">
                <span className="text-muted small">Clock Out</span>
                <div className="fw-bold fs-5 text-dark mt-0.5">
                  {todayStatus?.record?.checkOut
                    ? new Date(todayStatus.record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-4 text-md-end">
            {!todayStatus?.hasCheckedIn ? (
              <button
                className="btn btn-primary px-4 py-2 rounded-pill shadow-sm fw-semibold"
                onClick={() => handleAttendanceAction('check-in')}
                disabled={actionLoading}
              >
                <i className="bi bi-box-arrow-in-right me-1.5"></i>
                <span>{actionLoading ? 'Saving...' : 'Clock In Now'}</span>
              </button>
            ) : !todayStatus?.hasCheckedOut ? (
              <button
                className="btn btn-danger px-4 py-2 rounded-pill shadow-sm fw-semibold"
                onClick={() => handleAttendanceAction('check-out')}
                disabled={actionLoading}
              >
                <i className="bi bi-box-arrow-right me-1.5"></i>
                <span>{actionLoading ? 'Saving...' : 'Clock Out for Day'}</span>
              </button>
            ) : (
              <div className="d-inline-flex align-items-center gap-1.5 p-2 px-3 rounded-pill bg-light text-success fw-semibold small border">
                <i className="bi bi-check-circle-fill"></i>
                <span>Daily shift completed</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-3 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-3 py-1.5 small fw-semibold ${activeTab === 'my-attendance' ? 'active bg-primary' : 'bg-white text-secondary border'}`}
            onClick={() => setActiveTab('my-attendance')}
          >
            My Attendance History
          </button>
        </li>
        {isSupervisor && (
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-3 py-1.5 small fw-semibold ${activeTab === 'team-attendance' ? 'active bg-primary' : 'bg-white text-secondary border'}`}
              onClick={() => setActiveTab('team-attendance')}
            >
              {user.role === 'admin' ? 'Company Attendance Logs' : 'Team Attendance Logs'}
            </button>
          </li>
        )}
      </ul>

      {/* Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        {/* Filters */}
        <div className="p-3 border-bottom bg-light d-flex flex-wrap align-items-center justify-content-between gap-2">
          {activeTab === 'my-attendance' ? (
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">Filter:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: '130px' }}
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
              >
                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, idx) => (
                  <option key={idx} value={idx + 1}>{m}</option>
                ))}
              </select>
              <select
                className="form-select form-select-sm"
                style={{ width: '90px' }}
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted fw-semibold">Status:</span>
              <select
                className="form-select form-select-sm"
                style={{ width: '130px' }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="half-day">Half-day</option>
                <option value="absent">Absent</option>
              </select>
            </div>
          )}

          <span className="small text-muted">
            Total: <strong>{activeTab === 'my-attendance' ? myHistory.length : teamHistory.length}</strong> Records
          </span>
        </div>

        {loading ? (
          <div className="py-5"><LoadingSpinner text="Fetching attendance records..." /></div>
        ) : (activeTab === 'my-attendance' ? myHistory : teamHistory).length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-calendar-x fs-1 text-secondary opacity-50 mb-2 d-block"></i>
            <h6>No attendance records found.</h6>
            <small>Check in today to record your first presence.</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table staffsync-table mb-0">
              <thead>
                <tr>
                  {activeTab !== 'my-attendance' && <th>Employee</th>}
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Hours Worked</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'my-attendance' ? myHistory : teamHistory).map((r) => (
                  <tr key={r._id}>
                    {activeTab !== 'my-attendance' && (
                      <td>
                        <div className="fw-semibold small text-dark">{r.user?.name || 'Employee'}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{r.user?.department} • {r.user?.employeeId}</div>
                      </td>
                    )}
                    <td className="small fw-medium">
                      {new Date(r.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="small text-muted">
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="small text-muted">
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </td>
                    <td className="small fw-semibold">
                      {r.workingHours > 0 ? `${r.workingHours} hrs` : '--'}
                    </td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
