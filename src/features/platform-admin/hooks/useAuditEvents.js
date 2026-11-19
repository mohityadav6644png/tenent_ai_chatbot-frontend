import { useQuery } from '@tanstack/react-query';
import { listAuditEvents } from '../../../api/v1/audit.api.js';

export function useAuditEvents() {
  return useQuery({
    queryKey: ['platform', 'audit-events', 5],
    queryFn: ({ signal }) => listAuditEvents({ limit: 5, signal }),
    refetchOnWindowFocus: true,
    retry: false,
  });
}
