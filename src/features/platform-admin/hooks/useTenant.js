import { useQuery } from '@tanstack/react-query';
import { getTenant } from '../../../api/v1/tenants.api.js';
import { tenantDetailIdSchema } from '../../../api/v1/schemas/tenants.schema.js';

export function useTenant(tenantId, enabled = true) {
  const validId = tenantDetailIdSchema.safeParse(tenantId).success;

  return useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: ({ signal }) => getTenant(tenantId, { signal }),
    enabled: enabled && validId,
    retry: false,
    refetchOnWindowFocus: true,
  });
}
