import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../app/routes.constants.js';
import { useAuth } from './useAuth.js';

export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: login,
    onSuccess: (user) => {
      const destination = {
        employee: ROUTES.CHAT,
        company_admin: ROUTES.ADMIN_USERS,
        super_admin: ROUTES.PLATFORM_TENANTS,
      }[user.role];
      navigate(destination, { replace: true });
    },
  });
}
