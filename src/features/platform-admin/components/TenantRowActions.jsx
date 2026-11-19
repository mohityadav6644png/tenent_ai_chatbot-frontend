import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';
import { useTenantRowActions } from '../hooks/useTenantRowActions.js';
import { ConfirmSuspendDialog } from './ConfirmSuspendDialog.jsx';

export function TenantRowActions({
  tenant,
  isPending,
  onSuspend,
  onReactivate,
}) {
  const { dialogOpen, setDialogOpen, actions, disabled, confirmSuspend } =
    useTenantRowActions(tenant, isPending, onSuspend);

  return (
    <div className="tenant-actions">
      {actions.includes('manage') && (
        <Link
          aria-disabled={disabled || undefined}
          className="tenant-action tenant-action--manage"
          onClick={(event) => {
            if (disabled) event.preventDefault();
          }}
          tabIndex={disabled ? -1 : undefined}
          to={`${ROUTES.PLATFORM_TENANTS}/${tenant.id}`}
        >
          Manage
        </Link>
      )}
      {actions.includes('suspend') && (
        <Button
          className="tenant-action tenant-action--suspend"
          disabled={disabled}
          onClick={() => setDialogOpen(true)}
        >
          Suspend
        </Button>
      )}
      {actions.includes('reactivate') && (
        <Button
          className="tenant-action tenant-action--reactivate"
          disabled={disabled}
          onClick={() => onReactivate(tenant)}
        >
          Reactivate
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
    </div>
  );
}
