import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { dashboardService } from '../../services/dashboardService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusBadge from '../../components/common/StatusBadge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
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
      setError(err.response?.data?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading HR Administrator dashboard..." />;
  }

  if (error) {
    return (
      <div className="alert alert-danger rounded-3" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
      </div>
    );
  }

  const { overview = {}, departmentDistribution = [], recentLeaves = [], recentAnnouncements = [] } = stats || {};

  // Department Distribution Chart Data (Bar Chart)
  const deptChartData = {
    labels: departmentDistribution.map((d) => d.department || 'Unassigned'),
    datasets: [
      {
        label: 'Employees',
        data: departmentDistribution.map((d) => d.count),
        backgroundColor: '#0d6efd',
        borderRadius: 6
      }
    ]
  };

  const deptChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  // Attendance Donut Chart Data
  const attendanceDonutData = {
    labels: ['Present Today', 'Absent Today'],
    datasets: [
      {
        data: [overview.presentToday || 0, overview.absentToday || 0],
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">HR Administrator Dashboard</h4>
          <p className="text-muted small mb-0">Overview of organization workforce, daily attendance, and operational requests.</p>
        </div>
        <div className="d-flex gap-2 mt-3 mt-md-0">
          <Link to="/employees" className="btn btn-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5 shadow-sm">
            <i className="bi bi-person-plus-fill"></i>
            <span>Manage Employees</span>
          </Link>
          <Link to="/leaves" className="btn btn-outline-secondary btn-sm rounded-pill px-3 d-flex align-items-center gap-1.5">
            <i className="bi bi-clock-history"></i>
            <span>Review Leaves</span>
          </Link>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="row g-3 mb-4">
        {/* Total Employees */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="staffsync-stat-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Total Headcount</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#e7f1ff', color: '#0d6efd' }}>
                <i className="bi bi-people-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{overview.totalEmployees || 0}</h3>
            <div className="small text-muted">
              <span className="text-success fw-semibold">{overview.activeEmployees || 0} Active</span> • {overview.inactiveEmployees || 0} Inactive
            </div>
          </div>
        </div>

        {/* Present Today */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="staffsync-stat-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Present Today</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#dcfce7', color: '#10b981' }}>
                <i className="bi bi-calendar-check-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{overview.presentToday || 0}</h3>
            <div className="small text-muted">
              Attendance Rate: <span className="text-success fw-semibold">{overview.attendanceRate || '0%'}</span>
            </div>
          </div>
        </div>

        {/* Pending Leaves */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="staffsync-stat-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Pending Leaves</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#fef9c3', color: '#ca8a04' }}>
                <i className="bi bi-hourglass-split"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{overview.pendingLeaves || 0}</h3>
            <div className="small text-muted">Awaiting supervisor review</div>
          </div>
        </div>

        {/* Active Notices & Training */}
        <div className="col-12 col-sm-6 col-xl-3">
          <div className="staffsync-stat-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <span className="text-muted small fw-semibold text-uppercase">Active Modules</span>
              <div className="stat-icon-wrapper" style={{ backgroundColor: '#f3e8ff', color: '#9333ea' }}>
                <i className="bi bi-mortarboard-fill"></i>
              </div>
            </div>
            <h3 className="fw-bold mb-1">{overview.activeTrainings || 0}</h3>
            <div className="small text-muted">
              {overview.activeAnnouncements || 0} Active Announcements
            </div>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="row g-3 mb-4">
        {/* Department Distribution */}
        <div className="col-12 col-lg-8">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Department Headcount Distribution</h6>
              <span className="badge bg-light text-secondary border">Real-time</span>
            </div>
            <div style={{ height: '240px' }}>
              {departmentDistribution.length > 0 ? (
                <Bar data={deptChartData} options={deptChartOptions} />
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                  No department records found.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Daily Attendance Ratio Donut */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 h-100 bg-white">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Today's Attendance Ratio</h6>
            </div>
            <div style={{ height: '180px' }} className="d-flex align-items-center justify-content-center">
              <Doughnut
                data={attendanceDonutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } }
                }}
              />
            </div>
            <div className="mt-2 text-center text-muted small">
              Rate: <strong>{overview.attendanceRate}</strong> of active workforce
            </div>
          </div>
        </div>
      </div>

      {/* Recent Leaves & Company Notices Row */}
      <div className="row g-3">
        {/* Recent Leave Applications */}
        <div className="col-12 col-lg-7">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Recent Leave Applications</h6>
              <Link to="/leaves" className="text-primary text-decoration-none small fw-semibold">View All</Link>
            </div>
            {recentLeaves.length === 0 ? (
              <p className="text-muted small mb-0 py-3 text-center">No recent leave requests.</p>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm staffsync-table mb-0">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeaves.map((l) => (
                      <tr key={l._id}>
                        <td>
                          <div className="fw-semibold small">{l.user?.name || 'Employee'}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{l.user?.department}</div>
                        </td>
                        <td className="small text-capitalize">{l.leaveType}</td>
                        <td className="small text-muted">
                          {new Date(l.startDate).toLocaleDateString()} ({l.totalDays}d)
                        </td>
                        <td>
                          <StatusBadge status={l.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Recent Announcements */}
        <div className="col-12 col-lg-5">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold mb-0">Company Notices</h6>
              <Link to="/announcements" className="text-primary text-decoration-none small fw-semibold">View Board</Link>
            </div>
            {recentAnnouncements.length === 0 ? (
              <p className="text-muted small mb-0 py-3 text-center">No notices published yet.</p>
            ) : (
              <div className="d-flex flex-column gap-2.5">
                {recentAnnouncements.map((a) => (
                  <div key={a._id} className="p-2.5 rounded-3 bg-light border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold small text-dark">{a.title}</span>
                      <StatusBadge status={a.priority} />
                    </div>
                    <p className="text-muted small mb-1 text-truncate">{a.content}</p>
                    <div className="d-flex justify-content-between align-items-center" style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                      <span>Target: {a.targetDepartment}</span>
                      <span>{new Date(a.publicationDate).toLocaleDateString()}</span>
                    </div>
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

export default AdminDashboard;
