const STATUS_CLASSES = {
  active: 'status-badge--active',
  paused: 'status-badge--warning',
  onboarding: 'status-badge--onboarding',
  suspended: 'status-badge--suspended',
  operational: 'status-badge--positive',
  success: 'status-badge--positive',
  logged: 'status-badge--positive',
  degraded: 'status-badge--warning',
  retry: 'status-badge--warning',
  down: 'status-badge--danger',
  failed: 'status-badge--danger',
  neutral: 'status-badge--neutral',
  'role-admin': 'status-badge--role-admin',
  'role-employee': 'status-badge--role-employee',
};

export function StatusBadge({ status, label }) {
  const toneClass = STATUS_CLASSES[status] || STATUS_CLASSES.neutral;
  return <span className={`status-badge ${toneClass}`}>{label}</span>;
}
