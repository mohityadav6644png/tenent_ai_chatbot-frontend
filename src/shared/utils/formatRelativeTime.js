const DAY_MS = 24 * 60 * 60 * 1000;

function localDayNumber(date) {
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

export function formatRelativeTime(value, now = new Date()) {
  if (!value) return 'Never';

  const date = new Date(value);
  const daysAgo = localDayNumber(now) - localDayNumber(date);
  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);

  if (daysAgo === 0) return `Today, ${time}`;
  if (daysAgo === 1) return `Yesterday, ${time}`;
  if (daysAgo >= 2 && daysAgo <= 6) return `${daysAgo} days ago`;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
