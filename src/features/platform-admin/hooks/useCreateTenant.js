import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createTenant } from '../../../api/v1/tenants.api.js';
import { ROUTES } from '../../../app/routes.constants.js';
import { TENANTS_QUERY_KEY } from './useTenants.js';

export function useCreateTenant() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: createTenant,
    onSuccess: async (tenant, payload) => {
      await queryClient.invalidateQueries({ queryKey: TENANTS_QUERY_KEY });
      navigate(ROUTES.PLATFORM_TENANTS, {
        replace: true,
        state: tenant.invite_email_sent
          ? { successToast: `Invite sent to ${payload.admin_email}` }
          : {
              actionError: `Company created, but the invite email could not be sent to ${payload.admin_email}. Check the backend SMTP logs.`,
            },
      });
    },
  });
}
