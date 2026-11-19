import { Button } from '../../../shared/components/Button.jsx';
import { StatusBadge } from '../../../shared/components/StatusBadge.jsx';
import { useTenantDetailHeader } from '../hooks/useTenantDetailHeader.js';
import { ConfirmSuspendDialog } from './ConfirmSuspendDialog.jsx';

export function TenantDetailHeader({ tenant, isPending, onSuspend, onReactivate }) {
  const { dialogOpen, setDialogOpen, status, confirmSuspend } = useTenantDetailHeader(tenant, onSuspend);

  return (
    <header className="tenant-detail-header">
      <div>
        <h1>{tenant.name}</h1>
        <StatusBadge status={tenant.status} label={status.label} />
      </div>
      {tenant.status !== 'onboarding' && (
        <Button
          className="tenant-detail-action"
          variant="dark"
          disabled={isPending}
          onClick={() => tenant.status === 'active' ? setDialogOpen(true) : onReactivate(tenant.id)}
        >
          {tenant.status === 'active' ? 'Suspend tenant' : 'Reactivate tenant'}
        </Button>
      )}
      {dialogOpen && (
        <ConfirmSuspendDialog
          tenant={tenant}
          isPending={isPending}
          onClose={() => setDialogOpen(false)}
          onConfirm={confirmSuspend}
        />
      )}
    </header>
  );
}
