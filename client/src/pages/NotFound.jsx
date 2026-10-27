import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="d-flex align-items-center justify-content-center p-4" style={{ minHeight: '80vh' }}>
      <div className="text-center p-5 bg-white rounded-4 shadow-sm border" style={{ maxWidth: '480px' }}>
        <div className="display-1 fw-bold text-primary mb-2">404</div>
        <h4 className="fw-bold text-dark mb-2">Page Not Found</h4>
        <p className="text-muted small mb-4">
          The requested StaffSync portal page does not exist or you may not have permission to access it.
        </p>
        <Link to="/dashboard" className="btn btn-primary btn-sm rounded-pill px-4 shadow-sm">
          <i className="bi bi-house-door-fill me-1.5"></i>
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
