import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { mapApiError } from '../../../api/errorMapper.js';
import { tenantDetailIdSchema } from '../../../api/v1/schemas/tenants.schema.js';
import { useTenantActions } from './useTenantActions.js';
import { useTenant } from './useTenant.js';
import { mapTenantDetail } from '../mappers/tenantDetail.mapper.js';

export function useTenantDetailPage(tenantId) {
  const validId = tenantDetailIdSchema.safeParse(tenantId).success;
  const tenantQuery = useTenant(tenantId, validId);
  const actions = useTenantActions();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState('');
  const notFound = !validId || tenantQuery.error?.status === 404
    || tenantQuery.error?.code === 'TENANT_NOT_FOUND';

  async function changeStatus(mutation, id) {
    setActionError('');
    try {
      await mutation.mutateAsync(id);
      await queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      return true;
    } catch (error) {
      setActionError(mapApiError(error));
      return false;
    }
  }

  return {
    tenantQuery,
    actions,
    actionError,
    notFound,
    tenant: tenantQuery.data ? mapTenantDetail(tenantQuery.data) : null,
    tenantError: tenantQuery.isError ? mapApiError(tenantQuery.error) : null,
    changeStatus,
  };
}
