import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { trainingService } from '../services/trainingService';
import { employeeService } from '../services/employeeService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import AlertMessage from '../components/common/AlertMessage';

const Training = () => {
  const { user } = useAuth();
  const isSupervisor = ['admin', 'manager'].includes(user?.role);

  const [activeTab, setActiveTab] = useState('my-trainings');
  const [myTrainings, setMyTrainings] = useState([]);
  const [allTrainings, setAllTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Create Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const initialForm = {
    title: '',
    description: '',
    category: 'Technical',
    deadline: ''
  };
  const [formData, setFormData] = useState(initialForm);

  // Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState([]);

  useEffect(() => {
    loadTrainings();
  }, [activeTab]);

  const loadTrainings = async () => {
    setLoading(true);
    try {
      if (activeTab === 'my-trainings') {
        const data = await trainingService.getMyTrainings();
        if (data.success) {
          setMyTrainings(data.trainings || []);
        }
      } else if (isSupervisor) {
        const data = await trainingService.getTrainings();
        if (data.success) {
          setAllTrainings(data.trainings || []);
        }
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load training programs.' });
    } finally {
      setLoading(false);
    }
  };

  const handleProgressUpdate = async (trainingId, newStatus) => {
    setActionLoading(true);
    try {
      const res = await trainingService.updateProgress(trainingId, newStatus);
      setFeedback({ type: 'success', message: res.message || `Training marked as ${newStatus}!` });
      loadTrainings();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to update progress.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await trainingService.createTraining(formData);
      setFeedback({ type: 'success', message: 'Training module created successfully!' });
      setShowCreateModal(false);
      setFormData(initialForm);
      loadTrainings();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to create training.' });
    } finally {
      setActionLoading(false);
    }
  };

  const openAssignModal = async (training) => {
    setSelectedTraining(training);
    setSelectedEmpIds([]);
    try {
      const data = await employeeService.getEmployees({ limit: 50 });
      if (data.success) {
        setAvailableEmployees(data.employees || []);
      }
      setShowAssignModal(true);
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load employee list.' });
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTraining || selectedEmpIds.length === 0) return;
    setActionLoading(true);
    try {
      await trainingService.assignEmployees(selectedTraining._id, selectedEmpIds);
      setFeedback({ type: 'success', message: 'Employees assigned successfully!' });
      setShowAssignModal(false);
      loadTrainings();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Assignment failed.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Training & Skill Development</h4>
          <p className="text-muted small mb-0">Upskilling curriculum, compliance certifications, and personal learning progress.</p>
        </div>
        {isSupervisor && (
          <button
            className="btn btn-primary btn-sm rounded-pill px-3 mt-3 mt-md-0 d-flex align-items-center gap-1.5 shadow-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="bi bi-mortarboard-fill"></i>
            <span>Create Training Module</span>
          </button>
        )}
      </div>

      <AlertMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* Tabs */}
      <ul className="nav nav-pills mb-3 gap-2">
        <li className="nav-item">
          <button
            className={`nav-link rounded-pill px-3 py-1.5 small fw-semibold ${activeTab === 'my-trainings' ? 'active bg-primary' : 'bg-white text-secondary border'}`}
            onClick={() => setActiveTab('my-trainings')}
          >
            My Assigned Modules
          </button>
        </li>
        {isSupervisor && (
          <li className="nav-item">
            <button
              className={`nav-link rounded-pill px-3 py-1.5 small fw-semibold ${activeTab === 'all-trainings' ? 'active bg-primary' : 'bg-white text-secondary border'}`}
              onClick={() => setActiveTab('all-trainings')}
            >
              All Training Programs
            </button>
          </li>
        )}
      </ul>

      {/* Main Content */}
      {loading ? (
        <div className="py-5"><LoadingSpinner text="Loading training programs..." /></div>
      ) : activeTab === 'my-trainings' ? (
        // Employee Personal Training Grid
        myTrainings.length === 0 ? (
          <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white text-muted">
            <i className="bi bi-journal-check fs-1 text-secondary opacity-50 mb-2"></i>
            <h6>No assigned trainings at this time.</h6>
            <small>You're all caught up on your learning modules!</small>
          </div>
        ) : (
          <div className="row g-3">
            {myTrainings.map((t) => (
              <div key={t._id} className="col-12 col-md-6 col-lg-4">
                <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-light text-primary border small">{t.category}</span>
                    <StatusBadge status={t.myStatus} />
                  </div>

                  <h6 className="fw-bold text-dark mb-1">{t.title}</h6>
                  <p className="text-secondary small flex-grow-1" style={{ lineHeight: 1.5 }}>
                    {t.description}
                  </p>

                  {/* Progress bar visual */}
                  <div className="my-2">
                    <div className="d-flex justify-content-between small text-muted mb-1" style={{ fontSize: '0.72rem' }}>
                      <span>Progress</span>
                      <span>
                        {t.myStatus === 'completed' ? '100%' : t.myStatus === 'in-progress' ? '50%' : '0%'}
                      </span>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div
                        className={`progress-bar ${t.myStatus === 'completed' ? 'bg-success' : t.myStatus === 'in-progress' ? 'bg-warning' : 'bg-secondary'}`}
                        style={{
                          width: t.myStatus === 'completed' ? '100%' : t.myStatus === 'in-progress' ? '50%' : '5%'
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="pt-2 border-top mt-2 d-flex justify-content-between align-items-center" style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                    <span>Deadline: <strong>{new Date(t.deadline).toLocaleDateString()}</strong></span>
                  </div>

                  {/* Action buttons */}
                  <div className="pt-2 border-top mt-2 d-flex gap-2">
                    {t.myStatus === 'assigned' && (
                      <button
                        className="btn btn-primary btn-sm w-100 py-1 small rounded-pill"
                        onClick={() => handleProgressUpdate(t._id, 'in-progress')}
                        disabled={actionLoading}
                      >
                        Start Training
                      </button>
                    )}
                    {t.myStatus === 'in-progress' && (
                      <button
                        className="btn btn-success btn-sm w-100 py-1 small rounded-pill"
                        onClick={() => handleProgressUpdate(t._id, 'completed')}
                        disabled={actionLoading}
                      >
                        Mark as Completed
                      </button>
                    )}
                    {t.myStatus === 'completed' && (
                      <div className="w-100 text-center py-1 text-success small fw-semibold bg-light rounded-pill border">
                        <i className="bi bi-check-circle-fill me-1"></i> Completed
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        // Supervisor All Programs Table
        <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
          {allTrainings.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <h6>No training programs created yet.</h6>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table staffsync-table mb-0">
                <thead>
                  <tr>
                    <th>Module Title</th>
                    <th>Category</th>
                    <th>Deadline</th>
                    <th>Assigned Count</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allTrainings.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div className="fw-semibold text-dark small">{t.title}</div>
                        <div className="text-muted text-truncate" style={{ maxWidth: '250px', fontSize: '0.72rem' }}>{t.description}</div>
                      </td>
                      <td><span className="badge bg-light text-secondary border small">{t.category}</span></td>
                      <td className="small text-muted">{new Date(t.deadline).toLocaleDateString()}</td>
                      <td>
                        <span className="badge bg-primary bg-opacity-10 text-primary fw-semibold px-2.5 py-1 rounded-pill">
                          {t.assignedEmployees?.length || 0} enrolled
                        </span>
                      </td>
                      <td><StatusBadge status={t.status} /></td>
                      <td className="text-end">
                        <button
                          className="btn btn-outline-primary btn-sm rounded-pill px-2.5 py-1"
                          onClick={() => openAssignModal(t)}
                        >
                          <i className="bi bi-person-plus"></i> Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          CREATE TRAINING MODAL
      ======================================================== */}
      {showCreateModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">Create Training Module</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Title *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      required
                      placeholder="e.g. AWS Cloud Architecture Essentials"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Category</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      >
                        <option value="Technical">Technical</option>
                        <option value="Soft Skills">Soft Skills</option>
                        <option value="Compliance">Compliance</option>
                        <option value="Leadership">Leadership</option>
                        <option value="Orientation">Orientation</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Deadline *</label>
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        required
                        value={formData.deadline}
                        onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold">Description *</label>
                    <textarea
                      className="form-control form-control-sm"
                      rows="3"
                      required
                      placeholder="Outline course objectives and syllabus..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer border-top p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-3" disabled={actionLoading}>
                    {actionLoading ? 'Creating...' : 'Create Program'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          ASSIGN EMPLOYEES MODAL
      ======================================================== */}
      {showAssignModal && selectedTraining && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">Assign Employees to Module</h5>
                <button type="button" className="btn-close" onClick={() => setShowAssignModal(false)}></button>
              </div>
              <form onSubmit={handleAssignSubmit}>
                <div className="modal-body p-4">
                  <div className="p-2.5 bg-light rounded-3 border mb-3">
                    <div className="fw-bold small">{selectedTraining.title}</div>
                    <small className="text-muted">{selectedTraining.category}</small>
                  </div>

                  <label className="form-label small fw-semibold mb-2">Select Employees to Enroll:</label>
                  <div className="border rounded-3 p-2 overflow-auto" style={{ maxHeight: '200px' }}>
                    {availableEmployees.map((emp) => {
                      const isAlready = selectedTraining.assignedEmployees?.some(
                        (a) => a.employee?._id === emp._id || a.employee === emp._id
                      );
                      return (
                        <div key={emp._id} className="form-check py-1 border-bottom">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id={`emp-check-${emp._id}`}
                            disabled={isAlready}
                            checked={isAlready || selectedEmpIds.includes(emp._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmpIds([...selectedEmpIds, emp._id]);
                              } else {
                                setSelectedEmpIds(selectedEmpIds.filter((id) => id !== emp._id));
                              }
                            }}
                          />
                          <label className="form-check-label small d-flex justify-content-between" htmlFor={`emp-check-${emp._id}`}>
                            <span>{emp.name} ({emp.department})</span>
                            {isAlready && <span className="badge bg-light text-muted border">Enrolled</span>}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="modal-footer border-top p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAssignModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-3" disabled={actionLoading || selectedEmpIds.length === 0}>
                    {actionLoading ? 'Assigning...' : `Assign Selected (${selectedEmpIds.length})`}
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

export default Training;
