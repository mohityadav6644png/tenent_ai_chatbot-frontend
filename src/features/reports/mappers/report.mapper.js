import { formatSchedule } from '../../../shared/utils/formatSchedule.js';

const STATUS_LABELS = { active: 'Active', paused: 'Paused' };

export function mapReport(report) {
  const fullNames = report.recipients.map((recipient) => recipient.name);
  const firstNames = fullNames.map((name) => name.trim().split(/\s+/)[0]).filter(Boolean);
  const visibleNames = firstNames.slice(0, 3);
  const remaining = firstNames.length - visibleNames.length;

  return {
    ...report,
    scheduleLabel: formatSchedule(report.schedule),
    recipientsLabel: firstNames.length
      ? `${visibleNames.join(', ')}${remaining > 0 ? ` +${remaining} more` : ''}`
      : '—',
    recipientsTitle: fullNames.join(', '),
    statusLabel: STATUS_LABELS[report.status] || report.status,
  };
}
