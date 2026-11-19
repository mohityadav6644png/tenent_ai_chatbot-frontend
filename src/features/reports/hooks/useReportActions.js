import { useMutation, useQueryClient } from '@tanstack/react-query';
import { mapApiError } from '../../../api/errorMapper.js';
import { pauseReport, resumeReport } from '../../../api/v1/reports.api.js';
import { useToast } from '../../../shared/hooks/useToast.js';
import { REPORTS_QUERY_KEY } from './useReports.js';

export function useReportActions() {
  const queryClient = useQueryClient();
  const { toast, showToast, clearToast } = useToast();
  const updateStatus = (status) => async (id) => {
    await queryClient.cancelQueries({ queryKey: REPORTS_QUERY_KEY });
    const previousReport = queryClient.getQueryData(REPORTS_QUERY_KEY)
      ?.reports.find((report) => report.id === id);
    queryClient.setQueryData(REPORTS_QUERY_KEY, (current) => current && ({
      ...current,
      reports: current.reports.map((report) => (
        report.id === id ? { ...report, status } : report
      )),
    }));
    return { id, previousStatus: previousReport?.status, optimisticStatus: status };
  };
  const onError = (error, _id, context) => {
    if (context?.previousStatus) {
      queryClient.setQueryData(REPORTS_QUERY_KEY, (current) => current && ({
        ...current,
        reports: current.reports.map((report) => (
          report.id === context.id && report.status === context.optimisticStatus
            ? { ...report, status: context.previousStatus }
            : report
        )),
      }));
    }
    showToast(mapApiError(error), 'error');
  };
  const onSuccess = async (_result, _id, status) => {
    showToast(status === 'paused' ? 'Report paused' : 'Report resumed');
    await queryClient.invalidateQueries({ queryKey: REPORTS_QUERY_KEY });
  };
  const pause = useMutation({
    mutationFn: pauseReport,
    onMutate: updateStatus('paused'),
    onError,
    onSuccess: (_result, id) => onSuccess(_result, id, 'paused'),
  });
  const resume = useMutation({
    mutationFn: resumeReport,
    onMutate: updateStatus('active'),
    onError,
    onSuccess: (_result, id) => onSuccess(_result, id, 'active'),
  });
  const pendingIds = [pause, resume]
    .filter((mutation) => mutation.isPending)
    .map((mutation) => mutation.variables);

  return { pause, resume, pendingIds, toast, showToast, clearToast };
}
