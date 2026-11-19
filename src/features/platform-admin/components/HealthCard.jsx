import { StatusBadge } from '../../../shared/components/StatusBadge.jsx';
import { useHealthCard } from '../hooks/useHealthCard.js';

export function HealthCard({ component }) {
  const status = useHealthCard(component);

  return (
    <li className="platform-health-card">
      <span>{component.label}</span>
      <StatusBadge status={status.tone} label={status.label} />
    </li>
  );
}
