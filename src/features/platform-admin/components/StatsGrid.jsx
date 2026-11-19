import { StatCard } from '../../../shared/components/StatCard.jsx';

const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function StatsGrid({ summary, isLoading }) {
  if (isLoading) {
    return (
      <div className="platform-stats" aria-label="Loading tenant statistics">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="platform-stat-skeleton" key={index} />
        ))}
      </div>
    );
  }

  const stats = [
    ['Active tenants', numberFormat.format(summary.active_tenants)],
    ['API uptime (30 d)', `${summary.api_uptime_pct.toFixed(1)}%`],
    ['Avg response time', `${(summary.avg_response_ms / 1000).toFixed(1)} s`],
    ['AI tokens this month', compactFormat.format(summary.ai_tokens_month)],
  ];

  return (
    <div className="platform-stats">
      {stats.map(([label, value]) => <StatCard key={label} label={label} value={value} />)}
    </div>
  );
}
