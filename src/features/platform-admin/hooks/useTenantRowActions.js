import { useState } from 'react';
import { mapTenantStatus } from '../mappers/tenant.mapper.js';

export function useTenantRowActions(tenant, isPending, onSuspend) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { actions } = mapTenantStatus(tenant.status);
  const disabled = isPending;

  async function confirmSuspend() {
    if (await onSuspend(tenant)) setDialogOpen(false);
  }

  return { dialogOpen, setDialogOpen, actions, disabled, confirmSuspend };
}
