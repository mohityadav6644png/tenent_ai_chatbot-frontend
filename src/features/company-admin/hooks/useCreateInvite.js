import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createInvite } from '../../../api/v1/users.api.js';
import { ROUTES } from '../../../app/routes.constants.js';
import { USERS_QUERY_KEY } from './useUsers.js';

export function useCreateInvite() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createInvite,
    onSuccess: async (_invite, payload) => {
      await queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
      navigate(ROUTES.ADMIN_USERS, {
        replace: true,
        state: { successToast: `Invite sent to ${payload.email}` },
      });
    },
  });
}
