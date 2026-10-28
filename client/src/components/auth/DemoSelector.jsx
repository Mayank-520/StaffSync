import React, { useState } from 'react';

/**
 * DemoSelector Component
 * Provides instant 1-click evaluation access for evaluators, college professors, and recruiters.
 * Authenticates against the real backend without bypassing security or JWT verification.
 */
const DemoSelector = ({ onSelectRole, loadingRole }) => {
  const [isOpen, setIsOpen] = useState(false);

  const demoRoles = [
    {
      id: 'admin',
      title: 'HR Administrator',
      roleDisplay: 'HR Administrator',
      email: 'demo.hr@staffsync.com',
      password: 'DemoPass123!',
      badge: 'Admin Access',
      badgeClass: 'bg-primary',
      icon: 'bi-shield-shaded',
      color: '#0d6efd',
      bgLight: 'rgba(13, 110, 253, 0.08)',
      description: 'Complete company overview: manage employee directory, announcements, leave policies, and company KPIs.'
    },
    {
      id: 'manager',
      title: 'Operations Manager',
      roleDisplay: 'Manager',
      email: 'demo.manager@staffsync.com',
      password: 'DemoPass123!',
      badge: 'Manager Access',
      badgeClass: 'bg-indigo',
      icon: 'bi-people-fill',
      color: '#6366f1',
      bgLight: 'rgba(99, 102, 241, 0.08)',
      description: 'Supervise team: monitor daily attendance, review and approve/reject leave requests, assign trainings.'
    },
    {
      id: 'employee',
      title: 'Software Engineer',
      roleDisplay: 'Employee',
      email: 'demo.employee@staffsync.com',
      password: 'DemoPass123!',
      badge: 'Employee Access',
      badgeClass: 'bg-teal',
      icon: 'bi-person-badge-fill',
      color: '#0ea5e9',
      bgLight: 'rgba(14, 165, 233, 0.08)',
      description: 'Self-service portal: 1-click clock-in/out, leave balance tracker, submit leave requests, progress courses.'
    }
  ];

  return (
    <div className="mb-4">
      {/* Prominent Demo Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="btn w-100 py-2.5 rounded-3 fw-semibold d-flex align-items-center justify-content-between px-3"
        style={{
          background: 'linear-gradient(135deg, rgba(13, 110, 253, 0.12) 0%, rgba(99, 102, 241, 0.15) 100%)',
          color: '#0d6efd',
          border: '1px solid rgba(13, 110, 253, 0.3)',
          boxShadow: '0 2px 8px rgba(13, 110, 253, 0.08)'
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <span
            className="d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{ width: '28px', height: '28px', backgroundColor: '#0d6efd', color: '#fff', fontSize: '0.85rem' }}
          >
            <i className="bi bi-lightning-charge-fill"></i>
          </span>
          <span className="fw-bold" style={{ fontSize: '0.925rem' }}>
            Explore Live Demo Accounts
          </span>
        </div>
        <div className="d-flex align-items-center gap-1.5 small text-secondary">
          <span className="badge bg-primary-subtle text-primary border border-primary-subtle d-none d-sm-inline">
            3 Preset Roles
          </span>
          <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} text-primary`}></i>
        </div>
      </button>

      {/* Expandable Demo Role Cards */}
      {isOpen && (
        <div
          className="mt-3 p-3 rounded-3 border"
          style={{
            backgroundColor: '#f8fafc',
            borderColor: '#e2e8f0',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span className="small fw-bold text-dark text-uppercase" style={{ fontSize: '0.725rem', letterSpacing: '0.05em' }}>
              Select Role for Instant Demo Sign-In
            </span>
            <span className="text-muted" style={{ fontSize: '0.725rem' }}>
              Password: <code className="text-dark bg-white px-1.5 py-0.5 rounded border">DemoPass123!</code>
            </span>
          </div>

          <div className="d-flex flex-column gap-2">
            {demoRoles.map((role) => {
              const isSelectedLoading = loadingRole === role.id;

              return (
                <div
                  key={role.id}
                  className="card border rounded-3 p-2.5 transition-all"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-2.5">
                      <div
                        className="rounded-3 d-flex align-items-center justify-content-center"
                        style={{
                          width: '36px',
                          height: '36px',
                          backgroundColor: role.bgLight,
                          color: role.color,
                          fontSize: '1.1rem'
                        }}
                      >
                        <i className={`bi ${role.icon}`}></i>
                      </div>
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold text-dark small">{role.title}</span>
                          <span
                            className="badge rounded-pill"
                            style={{
                              fontSize: '0.65rem',
                              backgroundColor: role.bgLight,
                              color: role.color,
                              border: `1px solid ${role.color}33`
                            }}
                          >
                            {role.badge}
                          </span>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          {role.email}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={Boolean(loadingRole)}
                      onClick={() => onSelectRole(role)}
                      className="btn btn-sm px-3 py-1.5 rounded-pill fw-semibold d-flex align-items-center gap-1.5"
                      style={{
                        backgroundColor: role.color,
                        color: '#ffffff',
                        fontSize: '0.775rem',
                        boxShadow: `0 2px 6px ${role.color}40`
                      }}
                    >
                      {isSelectedLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          <span>Entering...</span>
                        </>
                      ) : (
                        <>
                          <span>Quick Login</span>
                          <i className="bi bi-arrow-right-short"></i>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-muted mt-2 pt-1 border-top" style={{ fontSize: '0.725rem', lineHeight: 1.35 }}>
                    {role.description}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-2.5 pt-2 border-top text-center text-muted" style={{ fontSize: '0.7rem' }}>
            <i className="bi bi-shield-check text-success me-1"></i>
            Authenticates through real backend JWT & bcrypt. Role permissions are enforced server-side.
          </div>
        </div>
      )}
    </div>
  );
};

export default DemoSelector;
