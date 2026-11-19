import { formatRelativeTime } from '../../../shared/utils/formatRelativeTime.js';
import { mapTenantStatus } from './tenant.mapper.js';

const numberFormat = new Intl.NumberFormat('en-US');
const compactFormat = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

function formatCompactNumber(value) {
  return compactFormat.format(value).replace(/([KMBT])$/, ' $1');
}

export function mapTenantDetail(tenant) {
  return {
    ...tenant,
    statusDisplay: mapTenantStatus(tenant.status),
    stats: [
      { label: 'Users', value: numberFormat.format(tenant.stats.user_count) },
      { label: 'Queries (month)', value: numberFormat.format(tenant.stats.queries_month) },
      { label: 'AI tokens (month)', value: formatCompactNumber(tenant.stats.ai_tokens_month) },
      { label: 'Avg response', value: `${(tenant.stats.avg_response_ms / 1000).toFixed(1)} s` },
    ],
    admins: tenant.admins.map((admin) => ({
      ...admin,
      lastLogin: formatRelativeTime(admin.last_login_at),
    })),
  };
}
