import { mapApiError } from '../../../api/errorMapper.js';
import { useReportActions } from './useReportActions.js';
import { useReports } from './useReports.js';

export function useReportsPage() {
  const reportsQuery = useReports();
  const actions = useReportActions();
  const reports = reportsQuery.data?.reports || [];

  return {
    reportsQuery,
    actions,
    reports,
    reportsError: reportsQuery.isError ? mapApiError(reportsQuery.error) : null,
  };
}
