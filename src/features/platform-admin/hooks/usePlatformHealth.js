import { useQuery } from '@tanstack/react-query';
import { getPlatformHealth } from '../../../api/v1/health.api.js';

export function usePlatformHealth() {
  return useQuery({
    queryKey: ['platform', 'health'],
    queryFn: ({ signal }) => getPlatformHealth({ signal }),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
