import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelInvite, deactivateUser, resendInvite } from '../../../api/v1/users.api.js';
import { USERS_QUERY_KEY } from './useUsers.js';

export function useUserActions() {
  const queryClient = useQueryClient();
  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
  const deactivate = useMutation({ mutationFn: deactivateUser, onSuccess: invalidateUsers });
  const resend = useMutation({ mutationFn: resendInvite, onSuccess: invalidateUsers });
  const cancel = useMutation({ mutationFn: cancelInvite, onSuccess: invalidateUsers });
  const pendingIds = [deactivate, resend, cancel]
    .filter((mutation) => mutation.isPending)
    .map((mutation) => mutation.variables);

  return { deactivate, resend, cancel, pendingIds };
}
