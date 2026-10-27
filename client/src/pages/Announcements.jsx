import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { announcementService } from '../services/announcementService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import AlertMessage from '../components/common/AlertMessage';

const Announcements = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const initialForm = {
    title: '',
    content: '',
    priority: 'medium',
    targetDepartment: 'All',
    isPinned: false
  };
  const [formData, setFormData] = useState(initialForm);

  const departments = ['All', 'Human Resources', 'Engineering', 'Marketing', 'Finance', 'Operations', 'Sales'];

  useEffect(() => {
    loadAnnouncements();
  }, [priorityFilter]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const params = {};
      if (priorityFilter) params.priority = priorityFilter;
      const data = await announcementService.getAnnouncements(params);
      if (data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load announcements feed.' });
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setFormData(initialForm);
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setSelectedId(item._id);
    setFormData({
      title: item.title,
      content: item.content,
      priority: item.priority || 'medium',
      targetDepartment: item.targetDepartment || 'All',
      isPinned: item.isPinned || false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      if (isEditing) {
        await announcementService.updateAnnouncement(selectedId, formData);
        setFeedback({ type: 'success', message: 'Announcement updated successfully!' });
      } else {
        await announcementService.createAnnouncement(formData);
        setFeedback({ type: 'success', message: 'Announcement published to bulletin!' });
      }
      setShowModal(false);
      loadAnnouncements();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Operation failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this announcement?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      setFeedback({ type: 'success', message: 'Announcement deactivated.' });
      loadAnnouncements();
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to deactivate announcement.' });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Company Announcements</h4>
          <p className="text-muted small mb-0">Official notices, emergency updates, and department circulars.</p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary btn-sm rounded-pill px-3 mt-3 mt-md-0 d-flex align-items-center gap-1.5 shadow-sm"
            onClick={openCreateModal}
          >
            <i className="bi bi-megaphone-fill"></i>
            <span>Post Announcement</span>
          </button>
        )}
      </div>

      <AlertMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white d-flex flex-row align-items-center justify-content-between">
        <div className="d-flex align-items-center gap-2">
          <span className="small text-muted fw-semibold">Priority Filter:</span>
          <select
            className="form-select form-select-sm"
            style={{ width: '140px' }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <span className="small text-muted">
          Active Notices: <strong>{announcements.length}</strong>
        </span>
      </div>

      {/* Announcement Cards Feed */}
      {loading ? (
        <div className="py-5"><LoadingSpinner text="Loading bulletin board..." /></div>
      ) : announcements.length === 0 ? (
        <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white text-muted">
          <i className="bi bi-megaphone fs-1 text-secondary opacity-50 mb-2"></i>
          <h6>No active announcements.</h6>
          <small>Check back later for company broadcasts and circulars.</small>
        </div>
      ) : (
        <div className="row g-3">
          {announcements.map((item) => (
            <div key={item._id} className="col-12 col-md-6 col-lg-4">
              <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-column" style={{ borderTop: item.isPinned ? '4px solid #0d6efd' : '1px solid #e2e8f0' }}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div className="d-flex align-items-center gap-1.5">
                    {item.isPinned && (
                      <span className="badge bg-primary rounded-pill small" title="Pinned Announcement">
                        <i className="bi bi-pin-angle-fill me-1"></i> Pinned
                      </span>
                    )}
                    <span className="badge bg-light text-secondary border small">
                      {item.targetDepartment}
                    </span>
                  </div>
                  <StatusBadge status={item.priority} />
                </div>

                <h6 className="fw-bold text-dark mb-2">{item.title}</h6>
                <p className="text-secondary small flex-grow-1" style={{ whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {item.content}
                </p>

                <div className="pt-2 border-top mt-auto d-flex justify-content-between align-items-center" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  <span>By: <strong>{item.postedBy?.name || 'HR Team'}</strong></span>
                  <span>{new Date(item.publicationDate || item.createdAt).toLocaleDateString()}</span>
                </div>

                {isAdmin && (
                  <div className="pt-2 border-top mt-2 d-flex justify-content-end gap-1">
                    <button
                      className="btn btn-outline-secondary btn-sm py-0.5 px-2"
                      style={{ fontSize: '0.72rem' }}
                      onClick={() => openEditModal(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm py-0.5 px-2"
                      style={{ fontSize: '0.72rem' }}
                      onClick={() => handleDeactivate(item._id)}
                    >
                      Deactivate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================
          CREATE / EDIT ANNOUNCEMENT MODAL
      ======================================================== */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">
                  {isEditing ? 'Edit Announcement' : 'Publish Announcement'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Title *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      minLength={3}
                      maxLength={200}
                      placeholder="Notice headline..."
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Priority</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Target Department</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.targetDepartment}
                        onChange={(e) => setFormData({ ...formData, targetDepartment: e.target.value })}
                      >
                        {departments.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Content *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="4"
                      required
                      minLength={5}
                      placeholder="Write the detailed announcement..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="pinCheck"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    />
                    <label className="form-check-label small text-secondary" htmlFor="pinCheck">
                      Pin to top of bulletin board
                    </label>
                  </div>
                </div>
                <div className="modal-footer border-top p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-3" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : isEditing ? 'Update Notice' : 'Publish Notice'}
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

export default Announcements;
