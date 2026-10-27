import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { leaveService } from '../services/leaveService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import AlertMessage from '../components/common/AlertMessage';

const Leaves = () => {
  const { user } = useAuth();
  const isSupervisor = ['admin', 'manager'].includes(user?.role);

  const [activeTab, setActiveTab] = useState('my-leaves');
  const [leaveBalances, setLeaveBalances] = useState({});
  const [myLeaves, setMyLeaves] = useState([]);
  const [allLeaves, setAllLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal States
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Apply Form State
  const initialForm = {
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // Review State
  const [reviewModalLeave, setReviewModalLeave] = useState(null);
  const [reviewStatus, setReviewStatus] = useState('approved');
  const [reviewerNote, setReviewerNote] = useState('');

  useEffect(() => {
    loadLeaves();
  }, [activeTab]);

  const loadLeaves = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my-leaves') {
        const data = await leaveService.getMyLeaves();
        if (data.success) {
          setMyLeaves(data.leaves || []);
          setLeaveBalances(data.leaveBalance || {});
        }
      } else if (isSupervisor) {
        const data = await leaveService.getAllLeaves();
        if (data.success) {
          setAllLeaves(data.leaves || []);
        }
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load leave records.' });
    } finally {
      setLoading(false);
    }
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await leaveService.applyLeave(formData);
      setFeedback({ type: 'success', message: res.message || 'Leave request submitted successfully!' });
      setShowApplyModal(false);
      setFormData(initialForm);
      loadLeaves();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to submit leave request.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openReviewModal = (leave, status) => {
    setReviewModalLeave(leave);
    setReviewStatus(status);
    setReviewerNote('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModalLeave) return;
    setActionLoading(true);
    try {
      const res = await leaveService.updateLeaveStatus(reviewModalLeave._id, {
        status: reviewStatus,
        reviewerNote
      });
      setFeedback({ type: 'success', message: res.message || `Leave ${reviewStatus} successfully.` });
      setReviewModalLeave(null);
      loadLeaves();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to update leave status.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Leave Management</h4>
          <p className="text-muted small mb-0">Apply for time off, review leave quotas, and manage supervisor approval workflows.</p>
        </div>
        <button
          className="btn btn-primary btn-sm rounded-pill px-3 mt-3 mt-md-0 d-flex align-items-center gap-1.5 shadow-sm"
          onClick={() => setShowApplyModal(true)}
        >
          <i className="bi bi-calendar-plus-fill"></i>
          <span>Apply for Leave</span>
        </button>
      </div>

      <AlertMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* Leave Balance Cards Row */}
      <div className="row g-2 mb-4">
        {[
          { label: 'Annual Leave', val: leaveBalances.annual ?? 15, bg: '#e7f1ff', color: '#0d6efd' },
          { label: 'Sick Leave', val: leaveBalances.sick ?? 10, bg: '#dcfce7', color: '#15803d' },
          { label: 'Casual Leave', val: leaveBalances.casual ?? 10, bg: '#fef9c3', color: '#a16207' },
          { label: 'Unpaid Leave', val: leaveBalances.unpaid ?? 30, bg: '#f1f5f9', color: '#475569' }
        ].map((b, i) => (
          <div key={i} className="col-6 col-md-3">
            <div className="card border-0 shadow-sm rounded-4 p-3 text-center border" style={{ backgroundColor: b.bg }}>
              <div className="fw-bold fs-3" style={{ color: b.color }}>{b.val}</div>
              <small className="text-secondary fw-semibold" style={{ fontSize: '0.75rem' }}>{b.label} Days Left</small>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Tabs */}
      <ul className="nav nav-pills mb-3 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-3 py-1.5 small fw-semibold ${activeTab === 'my-leaves' ? 'active bg-primary' : 'bg-white text-secondary border'}`}
            onClick={() => setActiveTab('my-leaves')}
          >
            My Leave Applications
          </button>
        </li>
        {isSupervisor && (
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-3 py-1.5 small fw-semibold ${activeTab === 'team-leaves' ? 'active bg-primary' : 'bg-white text-secondary border'}`}
              onClick={() => setActiveTab('team-leaves')}
            >
              {user.role === 'admin' ? 'Company Leave Approvals' : 'Team Leave Approvals'}
            </button>
          </li>
        )}
      </ul>

      {/* Leave Table Card */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        {loading ? (
          <div className="py-5"><LoadingSpinner text="Fetching leave applications..." /></div>
        ) : (activeTab === 'my-leaves' ? myLeaves : allLeaves).length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-card-checklist fs-1 text-secondary opacity-50 mb-2 d-block"></i>
            <h6>No leave requests found.</h6>
            <small>Use the 'Apply for Leave' button above to request time off.</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table staffsync-table mb-0">
              <thead>
                <tr>
                  {activeTab !== 'my-leaves' && <th>Employee</th>}
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Dates</th>
                  <th>Reason</th>
                  <th>Status</th>
                  {activeTab !== 'my-leaves' && <th className="text-end">Review Actions</th>}
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'my-leaves' ? myLeaves : allLeaves).map((l) => (
                  <tr key={l._id}>
                    {activeTab !== 'my-leaves' && (
                      <td>
                        <div className="fw-semibold small text-dark">{l.user?.name || 'Employee'}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>{l.user?.department} • {l.user?.employeeId}</div>
                      </td>
                    )}
                    <td className="small fw-semibold text-capitalize">{l.leaveType}</td>
                    <td className="small fw-medium">{l.totalDays} day(s)</td>
                    <td className="small text-muted">
                      {new Date(l.startDate).toLocaleDateString()} to {new Date(l.endDate).toLocaleDateString()}
                    </td>
                    <td className="small text-muted text-truncate" style={{ maxWidth: '200px' }}>
                      {l.reason}
                    </td>
                    <td>
                      <StatusBadge status={l.status} />
                    </td>
                    {activeTab !== 'my-leaves' && (
                      <td className="text-end">
                        {l.status === 'pending' && l.user?._id !== user._id ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-success btn-sm"
                              onClick={() => openReviewModal(l, 'approved')}
                              title="Approve"
                            >
                              <i className="bi bi-check-lg"></i> Approve
                            </button>
                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => openReviewModal(l, 'rejected')}
                              title="Reject"
                            >
                              <i className="bi bi-x-lg"></i> Reject
                            </button>
                          </div>
                        ) : l.user?._id === user._id ? (
                          <span className="badge bg-light text-muted border small">Your Request</span>
                        ) : (
                          <span className="small text-muted">Reviewed</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================
          APPLY LEAVE MODAL
      ======================================================== */}
      {showApplyModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">Submit Leave Application</h5>
                <button type="button" className="btn-close" onClick={() => setShowApplyModal(false)}></button>
              </div>
              <form onSubmit={handleApplySubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Leave Type *</label>
                    <select
                      className="form-select form-select-sm"
                      value={formData.leaveType}
                      onChange={(e) => setFormData({ ...formData, leaveType: e.target.value })}
                    >
                      <option value="annual">Annual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="casual">Casual Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="unpaid">Unpaid Leave</option>
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Start Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">End Date *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Reason for Leave *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      required
                      minLength={5}
                      maxLength={500}
                      placeholder="Please describe the purpose of your leave..."
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowApplyModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-3" disabled={actionLoading}>
                    {actionLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          REVIEW LEAVE MODAL (APPROVE / REJECT)
      ======================================================== */}
      {reviewModalLeave && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">
                  {reviewStatus === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setReviewModalLeave(null)}></button>
              </div>
              <form onSubmit={handleReviewSubmit}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="fw-bold text-dark">{reviewModalLeave.user?.name}</div>
                    <div className="text-muted small">
                      {reviewModalLeave.leaveType} leave for {reviewModalLeave.totalDays} day(s)
                    </div>
                    <div className="text-muted small mt-1">"{reviewModalLeave.reason}"</div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Reviewer Comments / Note (Optional)</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      placeholder="Add an optional explanation or instructions for the employee..."
                      value={reviewerNote}
                      onChange={(e) => setReviewerNote(e.target.value)}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setReviewModalLeave(null)}>Cancel</button>
                  <button
                    type="submit"
                    className={`btn btn-sm px-3 ${reviewStatus === 'approved' ? 'btn-success' : 'btn-danger'}`}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : `Confirm ${reviewStatus === 'approved' ? 'Approval' : 'Rejection'}`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaves;
