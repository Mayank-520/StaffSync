import React from 'react';

const LoadingSpinner = ({ text = 'Loading StaffSync...', fullPage = false }) => {
  const content = (
    <div className="d-flex flex-column align-items-center justify-content-center p-4">
      <div className="spinner-border text-primary mb-3" style={{ width: '2.5rem', height: '2.5rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted small fw-medium mb-0">{text}</p>
    </div>
  );

  if (fullPage) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;
