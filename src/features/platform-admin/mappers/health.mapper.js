const HEALTH_STATUS = {
  operational: { label: 'Operational', tone: 'operational' },
  degraded: { label: 'Degraded', tone: 'degraded' },
  down: { label: 'Down', tone: 'down' },
};

export function mapHealthStatus(status) {
  return HEALTH_STATUS[status] || { label: status, tone: 'neutral' };
}
