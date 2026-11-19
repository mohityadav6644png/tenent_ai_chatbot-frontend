import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { mapApiError } from '../../../api/errorMapper.js';
import { useTenantActions } from './useTenantActions.js';
import { useTenants } from './useTenants.js';

export function useTenantsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const tenantsQuery = useTenants();
  const actions = useTenantActions();
  const [actionError, setActionError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const data = tenantsQuery.data;

  useEffect(() => {
    const message = location.state?.successToast;
    const error = location.state?.actionError;
    if (message) setSuccessToast(message);
    if (error) setActionError(error);
    if (!message && !error) return;
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, navigate]);

  async function changeTenantStatus(mutation, tenant) {
    setActionError('');
    try {
      await mutation.mutateAsync(tenant.id);
      return true;
    } catch (error) {
      setActionError(mapApiError(error));
      return false;
    }
  }

  return {
    tenantsQuery,
    actions,
    actionError,
    successToast,
    setSuccessToast,
    data,
    tenantsError: tenantsQuery.isError ? mapApiError(tenantsQuery.error) : null,
    changeTenantStatus,
  };
}
