import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reactivateTenant, suspendTenant } from '../../../api/v1/tenants.api.js';
import { TENANTS_QUERY_KEY } from './useTenants.js';

export function useTenantActions() {
  const queryClient = useQueryClient();
  const invalidateTenants = () => queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });

  const suspend = useMutation({
    mutationFn: suspendTenant,
    onSuccess: invalidateTenants,
  });
  const reactivate = useMutation({
    mutationFn: reactivateTenant,
    onSuccess: invalidateTenants,
  });

  return {
    suspend,
    reactivate,
    pendingTenantId: suspend.isPending
      ? suspend.variables
      : reactivate.isPending ? reactivate.variables : null,
    isPending: suspend.isPending || reactivate.isPending,
  };
}
