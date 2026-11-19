import { useState } from 'react';

export function useUserRowActions(user, onDeactivate, onCancel) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const isInvite = user.status === 'invite_pending';
  const action = isInvite ? 'Cancel' : 'Deactivate';

  async function confirmAction() {
    const succeeded = isInvite ? await onCancel(user) : await onDeactivate(user);
    if (succeeded) setDialogOpen(false);
  }

  return { dialogOpen, setDialogOpen, isInvite, action, confirmAction };
}
