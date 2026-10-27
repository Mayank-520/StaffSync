import React from 'react';

const StatusBadge = ({ status }) => {
  if (!status) return null;

  const normalized = status.toLowerCase();

  let badgeClass = 'badge-soft-secondary';
  let label = status;

  switch (normalized) {
    // Attendance
    case 'present':
      badgeClass = 'badge-soft-success';
      label = 'Present';
      break;
    case 'late':
      badgeClass = 'badge-soft-warning';
      label = 'Late';
      break;
    case 'half-day':
      badgeClass = 'badge-soft-info';
      label = 'Half-day';
      break;
    case 'absent':
      badgeClass = 'badge-soft-danger';
      label = 'Absent';
      break;

    // Leave & Request statuses
    case 'approved':
    case 'completed':
    case 'active':
      badgeClass = 'badge-soft-success';
      label = status.charAt(0).toUpperCase() + status.slice(1);
      break;
    case 'pending':
    case 'in-progress':
      badgeClass = 'badge-soft-warning';
      label = status === 'in-progress' ? 'In Progress' : 'Pending';
      break;
    case 'rejected':
    case 'inactive':
    case 'archived':
      badgeClass = 'badge-soft-danger';
      label = status.charAt(0).toUpperCase() + status.slice(1);
      break;
    case 'on-leave':
      badgeClass = 'badge-soft-info';
      label = 'On Leave';
      break;

    // Priority
    case 'urgent':
      badgeClass = 'badge-soft-danger';
      label = 'Urgent';
      break;
    case 'high':
      badgeClass = 'badge-soft-warning';
      label = 'High';
      break;
    case 'medium':
      badgeClass = 'badge-soft-primary';
      label = 'Medium';
      break;
    case 'low':
      badgeClass = 'badge-soft-secondary';
      label = 'Low';
      break;

    default:
      badgeClass = 'badge-soft-secondary';
      label = status;
  }

  return (
    <span className={`badge ${badgeClass} px-2.5 py-1.5 rounded-pill`} style={{ fontSize: '0.78rem' }}>
      {label}
    </span>
  );
};

export default StatusBadge;
