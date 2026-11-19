import { formatNumber } from '../../../shared/utils/formatNumber.js';
import { mapTenantStatus } from '../mappers/tenant.mapper.js';

export function useTenantsTable(tenants) {
  return tenants.map((tenant) => ({
    tenant,
    status: mapTenantStatus(tenant.status),
    userCount: formatNumber(tenant.user_count),
    queriesMonth: formatNumber(tenant.queries_month),
  }));
}
