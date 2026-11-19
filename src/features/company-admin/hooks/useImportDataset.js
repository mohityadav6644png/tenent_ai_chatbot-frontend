import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importDataset } from '../../../api/v1/companyData.api.js';
import { DATASETS_QUERY_KEY } from './useDatasets.js';

export function useImportDataset(options = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: importDataset,
    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({ queryKey: DATASETS_QUERY_KEY });
      if (options.onSuccess) {
        options.onSuccess(data, variables, context);
      }
    },
    ...options,
  });
}
