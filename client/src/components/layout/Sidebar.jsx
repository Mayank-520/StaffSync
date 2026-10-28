import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Logo from '../common/Logo';

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: 'bi-grid-fill', label: 'Dashboard' },
    { to: '/employees', icon: 'bi-people-fill', label: 'Employees' },
    { to: '/attendance', icon: 'bi-calendar-check-fill', label: 'Attendance' },
    { to: '/leaves', icon: 'bi-file-earmark-medical-fill', label: 'Leave Requests' },
    { to: '/announcements', icon: 'bi-megaphone-fill', label: 'Announcements' },
    { to: '/trainings', icon: 'bi-mortarboard-fill', label: 'Training' },
    { to: '/profile', icon: 'bi-person-badge-fill', label: 'Profile & Settings' }
  ];

  return (
    <>
      {isOpen && <div className="sidebar-backdrop d-lg-none" onClick={onClose}></div>}
      <aside className={`staffsync-sidebar d-flex flex-column ${isOpen ? 'show' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-box d-flex align-items-center justify-content-between py-3 px-3">
          <Logo size="md" theme="light" showWordmark={true} />
          <button
            type="button"
            className="btn btn-link text-white-50 p-0 d-lg-none"
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            <i className="bi bi-x-lg fs-5"></i>
          </button>
        </div>

        {/* Navigation Section */}
        <div className="py-3 flex-grow-1 overflow-auto">
          <div className="px-3 mb-2" style={{ color: '#64748b', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
            Main Menu
          </div>
          <nav className="nav flex-column">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <i className={`bi ${item.icon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Role Card & Logout */}
        <div className="p-3 border-top border-secondary border-opacity-25 mt-auto">
          <div className="d-flex align-items-center mb-2 px-1">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold me-2"
              style={{ width: '36px', height: '36px', backgroundColor: '#25314d', fontSize: '0.85rem' }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-grow-1">
              <div className="text-white small fw-semibold text-truncate">{user?.name}</div>
              <div className="badge bg-primary bg-opacity-75" style={{ fontSize: '0.65rem' }}>
                {user?.roleDisplay || user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline-light btn-sm w-100 mt-2 d-flex align-items-center justify-content-center gap-2"
            style={{ borderColor: 'rgba(255, 255, 255, 0.15)', fontSize: '0.82rem' }}
          >
            <i className="bi bi-box-arrow-right"></i>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
