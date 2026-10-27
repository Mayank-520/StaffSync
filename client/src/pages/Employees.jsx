import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services/employeeService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/common/StatusBadge';
import AlertMessage from '../components/common/AlertMessage';

const Employees = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    email: '',
    password: '',
    department: 'Engineering',
    designation: '',
    employeeId: '',
    role: 'employee',
    status: 'active',
    phone: '',
    address: ''
  };
  const [formData, setFormData] = useState(initialForm);

  const departments = ['All', 'Human Resources', 'Engineering', 'Marketing', 'Finance', 'Operations', 'Sales'];

  useEffect(() => {
    fetchEmployees();
  }, [page, department]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (department !== 'All') params.department = department;
      if (search.trim()) params.search = search.trim();

      const data = await employeeService.getEmployees(params);
      if (data.success) {
        setEmployees(data.employees || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setFeedback({ type: 'danger', message: 'Failed to load employees list.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const openAddModal = () => {
    setFormData(initialForm);
    setShowAddModal(true);
  };

  const openEditModal = (emp) => {
    setSelectedEmployee(emp);
    setFormData({
      name: emp.name || '',
      email: emp.email || '',
      department: emp.department || 'Engineering',
      designation: emp.designation || '',
      employeeId: emp.employeeId || '',
      role: emp.role || 'employee',
      status: emp.status || 'active',
      phone: emp.phone || '',
      address: emp.address || ''
    });
    setShowEditModal(true);
  };

  const openDetailModal = (emp) => {
    setSelectedEmployee(emp);
    setShowDetailModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      await employeeService.createEmployee(formData);
      setFeedback({ type: 'success', message: `Employee ${formData.name} created successfully!` });
      setShowAddModal(false);
      fetchEmployees();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to create employee.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setActionLoading(true);
    setFeedback({ type: '', message: '' });
    try {
      await employeeService.updateEmployee(selectedEmployee._id, formData);
      setFeedback({ type: 'success', message: 'Employee profile updated successfully!' });
      setShowEditModal(false);
      fetchEmployees();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to update employee.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (emp) => {
    if (!window.confirm(`Are you sure you want to deactivate ${emp.name} (${emp.employeeId})?`)) {
      return;
    }
    try {
      await employeeService.deactivateEmployee(emp._id);
      setFeedback({ type: 'success', message: `Employee ${emp.name} has been deactivated.` });
      fetchEmployees();
    } catch (err) {
      setFeedback({ type: 'danger', message: err.response?.data?.message || 'Failed to deactivate employee.' });
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-2 border-bottom">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Employee Management</h4>
          <p className="text-muted small mb-0">Browse employee directory, review organizational hierarchy, and manage credentials.</p>
        </div>
        {isAdmin && (
          <button
            className="btn btn-primary btn-sm rounded-pill px-3 mt-3 mt-md-0 d-flex align-items-center gap-1.5 shadow-sm"
            onClick={openAddModal}
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>Add New Employee</span>
          </button>
        )}
      </div>

      <AlertMessage type={feedback.type} message={feedback.message} onClose={() => setFeedback({ type: '', message: '' })} />

      {/* Filter and Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 mb-4 bg-white">
        <form onSubmit={handleSearchSubmit} className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group input-group-sm">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control bg-light border-start-0"
                placeholder="Search by name, email, or employee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-outline-secondary">Search</button>
            </div>
          </div>

          <div className="col-6 col-md-4">
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted fw-semibold text-nowrap mb-0">Department:</label>
              <select
                className="form-select form-select-sm"
                value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  setPage(1);
                }}
              >
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="col-6 col-md-3 text-end">
            <span className="badge bg-light text-secondary border px-2.5 py-1.5">
              Total: <strong>{total}</strong> Records
            </span>
          </div>
        </form>
      </div>

      {/* Employee Table */}
      <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden">
        {loading ? (
          <div className="py-5"><LoadingSpinner text="Fetching employee records..." /></div>
        ) : employees.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-people fs-1 text-secondary opacity-50 mb-2 d-block"></i>
            <h6>No employee records found.</h6>
            <small>Try adjusting your search query or department filter.</small>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table staffsync-table mb-0">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2.5 shadow-sm"
                          style={{ width: '36px', height: '36px', backgroundColor: '#1a2238', fontSize: '0.85rem' }}
                        >
                          {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <div>
                          <div className="fw-semibold text-dark small">{emp.name}</div>
                          <div className="text-muted" style={{ fontSize: '0.72rem' }}>{emp.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-light text-secondary border font-monospace" style={{ fontSize: '0.75rem' }}>
                        {emp.employeeId}
                      </span>
                    </td>
                    <td>
                      <span className="small text-secondary">{emp.roleDisplay || emp.role}</span>
                    </td>
                    <td>
                      <div className="small fw-medium text-dark">{emp.department}</div>
                      <div className="text-muted" style={{ fontSize: '0.72rem' }}>{emp.designation}</div>
                    </td>
                    <td>
                      <StatusBadge status={emp.status} />
                    </td>
                    <td className="text-end">
                      <div className="btn-group btn-group-sm">
                        <button
                          className="btn btn-light border btn-sm"
                          title="View Details"
                          onClick={() => openDetailModal(emp)}
                        >
                          <i className="bi bi-eye"></i>
                        </button>

                        {(isAdmin || user?._id === emp._id) && (
                          <button
                            className="btn btn-light border btn-sm"
                            title="Edit"
                            onClick={() => openEditModal(emp)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                        )}

                        {isAdmin && emp._id !== user?._id && emp.status !== 'inactive' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            title="Deactivate"
                            onClick={() => handleDeactivate(emp)}
                          >
                            <i className="bi bi-person-x"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
            <span className="small text-muted">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <div className="btn-group btn-group-sm">
              <button
                className="btn btn-outline-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-outline-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          ADD EMPLOYEE MODAL
      ======================================================== */}
      {showAddModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">Add New Employee</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>
              <form onSubmit={handleCreateSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Full Name *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Corporate Email *</label>
                      <input
                        type="email"
                        className="form-control form-control-sm"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@staffsync.com"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Initial Password * (min 6 chars)</label>
                      <input
                        type="password"
                        className="form-control form-control-sm"
                        required
                        minLength={6}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Employee ID *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        placeholder="EMP-010"
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Department *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      >
                        {departments.filter(d => d !== 'All').map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">Designation *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="Software Engineer"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold">System Role *</label>
                      <select
                        className="form-select form-select-sm"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="employee">Employee</option>
                        <option value="manager">Manager</option>
                        <option value="admin">HR Administrator</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1-555-0100"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Residential Address</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="123 Campus Blvd"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-3" disabled={actionLoading}>
                    {actionLoading ? 'Creating...' : 'Create Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EDIT EMPLOYEE MODAL
      ======================================================== */}
      {showEditModal && selectedEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">Edit Employee Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <form onSubmit={handleUpdateSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    {isAdmin ? (
                      <>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Full Name</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold">Corporate Email</label>
                          <input
                            type="email"
                            className="form-control form-control-sm"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Department</label>
                          <select
                            className="form-select form-select-sm"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                          >
                            {departments.filter(d => d !== 'All').map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Designation</label>
                          <input
                            type="text"
                            className="form-control form-control-sm"
                            value={formData.designation}
                            onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label small fw-semibold">Role</label>
                          <select
                            className="form-select form-select-sm"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                          >
                            <option value="employee">Employee</option>
                            <option value="manager">Manager</option>
                            <option value="admin">HR Administrator</option>
                          </select>
                        </div>
                      </>
                    ) : null}

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Phone Number</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold">Residential Address</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-top p-3 bg-light rounded-bottom-4">
                  <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setShowEditModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm px-3" disabled={actionLoading}>
                    {actionLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          EMPLOYEE DETAILS MODAL
      ======================================================== */}
      {showDetailModal && selectedEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-header border-bottom pb-3">
                <h5 className="modal-title fw-bold text-dark">Employee Information</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="d-flex align-items-center mb-3">
                  <div
                    className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-3 shadow-sm"
                    style={{ width: '48px', height: '48px', backgroundColor: '#1a2238', fontSize: '1.2rem' }}
                  >
                    {selectedEmployee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">{selectedEmployee.name}</h5>
                    <div className="text-muted small">{selectedEmployee.designation} • {selectedEmployee.department}</div>
                  </div>
                </div>

                <div className="list-group list-group-flush border-top border-bottom my-3">
                  <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                    <span className="text-muted">Employee ID</span>
                    <span className="font-monospace fw-semibold">{selectedEmployee.employeeId}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                    <span className="text-muted">Corporate Email</span>
                    <span className="fw-medium">{selectedEmployee.email}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                    <span className="text-muted">Role</span>
                    <span><StatusBadge status={selectedEmployee.role} /></span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                    <span className="text-muted">Status</span>
                    <span><StatusBadge status={selectedEmployee.status} /></span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                    <span className="text-muted">Phone</span>
                    <span>{selectedEmployee.phone || 'Not provided'}</span>
                  </div>
                  <div className="list-group-item d-flex justify-content-between px-0 py-2 small">
                    <span className="text-muted">Joined Date</span>
                    <span>{new Date(selectedEmployee.joiningDate || selectedEmployee.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top p-3 bg-light rounded-bottom-4">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
