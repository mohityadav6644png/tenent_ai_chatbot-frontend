import { StatCard } from '../../../shared/components/StatCard.jsx';

const STATS = [
  ['Total users', 'total_users'],
  ['Admins', 'admins'],
  ['Pending invites', 'pending_invites'],
];

export function UsersStats({ summary, isLoading }) {
  if (isLoading || !summary) {
    return (
      <div className="users-stats" aria-label="Loading user statistics">
        {STATS.map(([label]) => <div className="platform-stat-skeleton" key={label} />)}
      </div>
    );
  }

  return (
    <div className="users-stats">
      {STATS.map(([label, key]) => {
        const val = summary?.[key] ?? 0;
        return (
          <StatCard key={key} label={label} value={new Intl.NumberFormat('en-US').format(val)} />
        );
      })}
    </div>
  );
}
