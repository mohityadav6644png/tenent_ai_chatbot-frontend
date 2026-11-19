import { mapApiError } from '../../../api/errorMapper.js';
import { useAuditEvents } from './useAuditEvents.js';
import { usePlatformHealth } from './usePlatformHealth.js';

export function useSystemHealthPage() {
  const healthQuery = usePlatformHealth();
  const auditQuery = useAuditEvents();

  return {
    healthQuery,
    auditQuery,
    healthError: healthQuery.isError ? mapApiError(healthQuery.error) : null,
    auditError: auditQuery.isError ? mapApiError(auditQuery.error) : null,
  };
}
