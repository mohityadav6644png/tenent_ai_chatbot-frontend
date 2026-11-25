import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mapApiError } from '../../../api/errorMapper.js';
import { useAuth } from '../../auth/index.js';
import { useUserActions } from './useUserActions.js';
import { useUsers } from './useUsers.js';

export function useUsersPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const usersQuery = useUsers();
  const actions = useUserActions();
  const [actionError, setActionError] = useState('');
  const [toast, setToast] = useState('');
  const companyName = typeof user?.company_name === 'string'
    ? user.company_name
    : typeof user?.companyName === 'string' ? user.companyName : 'Company';

  useEffect(() => {
    const message = location.state?.successToast;
    if (!message) return;
    setToast(message);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function runAction(mutation, target, successMessage) {
    setActionError('');
    try {
      await mutation.mutateAsync(target.id);
      if (successMessage) setToast(successMessage);
      return true;
    } catch (error) {
      setActionError(mapApiError(error));
      return false;
    }
  }

  return {
    companyName,
    usersQuery,
    actions,
    actionError,
    toast,
    setToast,
    data: usersQuery.data,
    usersError: usersQuery.isError ? mapApiError(usersQuery.error) : null,
    runAction,
  };
}
