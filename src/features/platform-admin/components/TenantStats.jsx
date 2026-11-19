import { StatCard } from '../../../shared/components/StatCard.jsx';

export function TenantStats({ stats }) {
  return (
    <section className="tenant-detail-stats" aria-label="Tenant usage statistics">
      {stats.map(({ label, value }) => <StatCard key={label} label={label} value={value} />)}
    </section>
  );
}
