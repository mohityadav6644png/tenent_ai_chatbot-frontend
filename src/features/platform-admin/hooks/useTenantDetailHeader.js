import { useState } from 'react';
import { mapTenantStatus } from '../mappers/tenant.mapper.js';

export function useTenantDetailHeader(tenant, onSuspend) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const status = mapTenantStatus(tenant.status);

  async function confirmSuspend() {
    if (await onSuspend(tenant.id)) setDialogOpen(false);
  }

  return { dialogOpen, setDialogOpen, status, confirmSuspend };
}
