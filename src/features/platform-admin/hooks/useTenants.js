import { useQuery } from '@tanstack/react-query';
import { listTenants } from '../../../api/v1/tenants.api.js';

export const TENANTS_QUERY_KEY = ['platform', 'tenants'];

export function useTenants() {
  return useQuery({
    queryKey: TENANTS_QUERY_KEY,
    queryFn: ({ signal }) => listTenants({ signal }),
    retry: false,
  });
}
