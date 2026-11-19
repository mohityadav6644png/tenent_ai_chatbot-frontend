import { useQuery } from '@tanstack/react-query';
import { listReports } from '../../../api/v1/reports.api.js';

export const REPORTS_QUERY_KEY = ['reports'];

export function useReports() {
  return useQuery({
    queryKey: REPORTS_QUERY_KEY,
    queryFn: ({ signal }) => listReports({ signal }),
    refetchOnWindowFocus: true,
    retry: false,
  });
}
