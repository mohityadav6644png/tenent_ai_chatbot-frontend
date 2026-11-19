import { Link } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { Button } from '../../../shared/components/Button.jsx';
import { useUserRowActions } from '../hooks/useUserRowActions.js';
import { ConfirmActionDialog } from './ConfirmActionDialog.jsx';

export function UserRowActions({ user, isPending, onDeactivate, onResend, onCancel }) {
  const { dialogOpen, setDialogOpen, isInvite, action, confirmAction } =
    useUserRowActions(user, onDeactivate, onCancel);
  if (user.is_self) return <span className="user-row-you">You</span>;

  return (
    <div className="user-row-actions">
      {isInvite ? (
        <>
          <Button
            className="user-row-action user-row-action--primary"
            aria-label={`Resend invite to ${user.email}`}
            disabled={isPending}
            onClick={() => onResend(user)}
          >
            Resend
          </Button>
          <Button
            className="user-row-action user-row-action--danger"
            aria-label={`Cancel invite for ${user.email}`}
            disabled={isPending}
            onClick={() => setDialogOpen(true)}
          >
            Cancel
          </Button>
        </>
      ) : (
        <>
          <Link
            className="user-row-action user-row-action--primary"
            aria-label={`Edit ${user.name}`}
            to={`${ROUTES.ADMIN_USERS}/${encodeURIComponent(user.id)}/edit`}
          >
            Edit
          </Link>
          <Button
            className="user-row-action user-row-action--danger"
            aria-label={`Deactivate ${user.name}`}
            disabled={isPending}
            onClick={() => setDialogOpen(true)}
          >
            Deactivate
          </Button>
        </>
      )}
      {dialogOpen && (
        <ConfirmActionDialog
          title={action === 'Cancel' ? `Cancel the invite for ${user.email}?` : `Deactivate ${user.name}?`}
          description={action === 'Deactivate' ? 'They will no longer be able to sign in.' : ''}
          confirmLabel={isInvite ? 'Cancel invite' : action}
          isPending={isPending}
          onClose={() => setDialogOpen(false)}
          onConfirm={confirmAction}
        />
      )}
    </div>
  );
}
