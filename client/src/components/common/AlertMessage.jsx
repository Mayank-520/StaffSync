import React from 'react';

const AlertMessage = ({ type = 'danger', message, onClose }) => {
  if (!message) return null;

  return (
    <div className={`alert alert-${type} alert-dismissible fade show rounded-3 py-2 px-3 small`} role="alert">
      <div className="d-flex align-items-center">
        <i className={`bi ${type === 'danger' ? 'bi-exclamation-triangle-fill text-danger' : 'bi-check-circle-fill text-success'} me-2`}></i>
        <div>{message}</div>
      </div>
      {onClose && (
        <button type="button" className="btn-close py-2" aria-label="Close" onClick={onClose}></button>
      )}
    </div>
  );
};

export default AlertMessage;
