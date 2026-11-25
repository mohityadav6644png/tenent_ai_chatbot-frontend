import { useQuery } from '@tanstack/react-query';
import { listConnections } from '../../../api/v1/connections.api.js';

export const CONNECTIONS_QUERY_KEY = ['company-connections'];

export function useConnections(options = {}) {
  return useQuery({
    queryKey: CONNECTIONS_QUERY_KEY,
    queryFn: ({ signal }) => listConnections({ signal }),
    refetchInterval: (query) => {
      const connections = query?.state?.data?.connections || [];
      const hasRefreshing = connections.some(
        (c) => (c.status || '').toLowerCase() === 'refreshing'
      );
      return hasRefreshing ? 5000 : false;
    },
    retry: false,
    ...options,
  });
}
